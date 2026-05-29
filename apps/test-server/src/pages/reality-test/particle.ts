import { EntityInfo } from '.'

export class Particle {
  private layer = 4
  private size = 0.05
  private partSize = 0
  private cornerRadius = 0.01
  private originPos = { x: 0, y: 0, z: 0 }
  private frame = 0
  private duration = 0
  private side = 'left'
  private moveSpeed = 0.003
  private partSpeeds: number[] = []
  private partLifeFrames: number[] = []
  private breakForce = 0
  private breakDir = { x: 0, y: 0, z: -1 }
  private breakPos = { x: 0, y: 0, z: 1 }
  private partDatas: EntityInfo[] = []

  constructor(option: any) {
    this.layer = option.layer ?? 4
    this.size = option.size ?? 0.05
    this.originPos = option.originPos ?? { x: 0, y: 0, z: 0 }
    this.side = option.side ?? 'left'
    this.duration = option.duration ?? Math.round(Math.random() * 30) + 20
    this.cornerRadius = option.cornerRadius ?? 0.01
    this.moveSpeed = option.moveSpeed ?? 0.003

    this.partSize = this.size / this.layer
    this.breakForce = Math.random() * 0.1 + 0.1
    let halfSize = this.size * 0.5
    this.breakPos = { x: 0, y: 0, z: halfSize }
    for (var i = 0; i < this.layer; i++) {
      for (var j = 0; j < this.layer; j++) {
        for (var k = 0; k < this.layer; k++) {
          const x = (k + 0.5) * this.partSize - halfSize
          const y = halfSize - (j + 0.5) * this.partSize
          const z = (i + 0.5) * this.partSize - halfSize
          let entityInfo = {
            id: Math.random(),
            side: this.side as 'left' | 'right',
            position: {
              x: x + this.originPos.x,
              y: y + this.originPos.y,
              z: z + this.originPos.z,
            },
            scale: { x: 0.25, y: 0.25, z: 0.25 },
            cornerRadius: this.cornerRadius,
            materials: [this.side === 'left' ? 'matGreen' : 'matRed'],
          }
          this.partDatas.push(entityInfo)
          this.partSpeeds.push(Math.random() * 0.01 + 0.02)
          this.partLifeFrames.push(
            Math.ceil((Math.random() * 0.8 + 0.2) * this.duration),
          )
        }
      }
    }
  }

  update() {
    this.frame++
    const halfSize = this.size * 0.5
    let fadePercent = 0
    let fadeNormal = { x: 0, y: 0, z: 0 }
    for (var i = 0; i < this.layer; i++) {
      for (var j = 0; j < this.layer; j++) {
        for (var k = 0; k < this.layer; k++) {
          const partIndex = k + j * this.layer + i * this.layer * this.layer
          if (this.frame < this.partLifeFrames[partIndex]) {
            fadePercent = Math.max(
              0,
              Math.min(this.frame / this.partLifeFrames[partIndex], 1),
            )
            const x = k * this.partSize - halfSize
            const y = halfSize - j * this.partSize
            const z = i * this.partSize - halfSize
            fadeNormal = { x, y, z }
            let dirPos = normalize3({
              x: fadeNormal.x - this.breakPos.x,
              y: fadeNormal.y - this.breakPos.y,
              z: fadeNormal.z - this.breakPos.z,
            })
            fadeNormal.x +=
              dirPos.x * this.partSpeeds[partIndex] +
              this.breakDir.x * this.breakForce
            fadeNormal.y +=
              dirPos.y * this.partSpeeds[partIndex] +
              this.breakDir.y * this.breakForce
            fadeNormal.z +=
              dirPos.z * this.partSpeeds[partIndex] +
              this.breakDir.z * this.breakForce
            this.partDatas[partIndex].position.x =
              x * 1.2 +
              0.5 * this.partSize +
              this.originPos.x +
              fadeNormal.x * fadePercent
            this.partDatas[partIndex].position.y =
              y * 1.2 -
              0.5 * this.partSize +
              this.originPos.y +
              fadeNormal.y * fadePercent
            this.partDatas[partIndex].position.z =
              z * 0.5 +
              0.5 * this.partSize +
              this.originPos.z +
              fadeNormal.z * fadePercent
            const scale = 1 - fadePercent
            this.partDatas[partIndex].scale = {
              x: scale * 0.25,
              y: scale * 0.25,
              z: scale * 0.25,
            }
          }
        }
      }
    }
    return this.frame < this.duration
  }

  getPartDatas() {
    return this.partDatas
  }
}

function normalize3(point: any) {
  const norm = Math.sqrt(
    point.x * point.x + point.y * point.y + point.z * point.z,
  )
  if (norm === 0) return { x: 0, y: 0, z: 0 }
  return { x: point.x / norm, y: point.y / norm, z: point.z / norm }
}
