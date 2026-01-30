import ReactDOM from 'react-dom/client'
import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { enableDebugTool } from '@webspatial/react-sdk'
import './material.css'

enableDebugTool()

const materials = ['translucent', 'regular', 'thick', 'transparent', 'thin'] as const
type Material = (typeof materials)[number]
const backs = [0, 20, 50, 100] as const
type Back = (typeof backs)[number]

function clsFor(m: Material) {
  if (m === 'translucent') return 'defaultMat'
  if (m === 'regular') return 'regularMat'
  if (m === 'thick') return 'thickMat'
  if (m === 'transparent') return 'transparentMat'
  return 'thinMat'
}
function backCls(b: Back) {
  if (b === 0) return 'back0'
  if (b === 20) return 'back20'
  if (b === 50) return 'back50'
  return 'back100'
}

function MaterialApiTest() {
  const [material, setMaterial] = useState<Material>('translucent')
  const [back, setBack] = useState<Back>(50)

  useEffect(() => {
    const classEl = document.getElementById('classPanelEl')
    const inlineEl = document.getElementById('inlinePanelEl')
    const logVars = (el: Element | null, label: string) => {
      if (!el) return
      const cs = getComputedStyle(el as HTMLElement)
      console.log(
        `[${label}] computed --xr-background-material=`,
        cs.getPropertyValue('--xr-background-material').trim(),
      )
      console.log(`[${label}] computed --xr-back=`, cs.getPropertyValue('--xr-back').trim())
    }
    const attrObserver = new MutationObserver(muts => {
      muts.forEach(m => {
        if (m.type === 'attributes') {
          const target = m.target as HTMLElement
          const which = m.attributeName
          console.log(
            `[MutationObserver] ${target.id || target.tagName} attribute changed:`,
            which,
          )
          logVars(target, target.id || target.tagName)
        }
      })
    })
    if (classEl) {
      attrObserver.observe(classEl, { attributes: true, attributeFilter: ['class', 'style'] })
      logVars(classEl, 'classPanelEl:init')
    }
    if (inlineEl) {
      attrObserver.observe(inlineEl, { attributes: true, attributeFilter: ['class', 'style'] })
      logVars(inlineEl, 'inlinePanelEl:init')
    }
    const headObserver = new MutationObserver(muts => {
      muts.forEach(m => {
        console.log(`[HeadObserver] change:`, m.type, m.attributeName || '')
      })
    })
    headObserver.observe(document.head, { attributes: true, childList: true, subtree: true })
    return () => {
      attrObserver.disconnect()
      headObserver.disconnect()
    }
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 14 }}>Dev-only: class-based</p>
          <div
            enable-xr
            id="classPanelEl"
            className={clsFor(material) + ' ' + backCls(back)}
            style={
              {
                minHeight: 160,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'translateZ(30px) rotateX(15deg)',
              } as unknown as CSSProperties
            }
          >
            <span>{material}</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 14 }}>Prod-ready: inline style</p>
          <div
            enable-xr
            id="inlinePanelEl"
            style={
              {
                ['--xr-background-material']: material,
                ['--xr-back']: back,
                minHeight: 160,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'translateZ(30px) rotateX(15deg)',
              } as unknown as CSSProperties
            }
          >
            <span>{material}</span>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <label>
          <span>Material</span>
          <select value={material} onChange={e => setMaterial(e.target.value as Material)}>
            {materials.map(m => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label style={{ marginLeft: 12 }}>
          <span>Back</span>
          <select value={back} onChange={e => setBack(Number(e.target.value) as Back)}>
            {backs.map(b => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<MaterialApiTest />)
