# API 摘要

> Normative 需求见 [spec.zh.md](./specs/spatialized-element-motion/spec.zh.md)

## useAnimation（仅 native）

```typescript
const [animation, api, style] = useAnimation({
  from: { opacity: 0, transform: { translate: { y: 24 } } },
  to:   { opacity: 1, transform: { translate: { y: 0 } } },
  duration: 0.6,
})

<div enable-xr xr-animation={animation} />
<Model xr-animation={animation} />
<Reality xr-animation={animation} />
```

## Core

```typescript
const anim = await element.createAnimation(config)
await anim.play()
await anim.pause()   // → values
await anim.stop()    // → values
await anim.destroy()
```

Timeline 在 `createAnimation` 锁定；改 config 须 destroy + recreate。

## PlaybackApi

`play` `pause` `resume` `stop` `reset` `finish` · `playState` `isAnimating` `isPaused` `finished`

| 命令 | playState | 回调 |
|------|-----------|------|
| stop | idle | onStop |
| reset | idle | onReset |
| finish / 自然结束 | finished | onComplete |

## Kind 差异

| Kind | 绑定 | Native 写入 | style |
|------|------|-------------|-------|
| 2D | `enable-xr` | transform + opacity | 初始 from 预览 |
| Static3D | `<Model>` | modelTransform | `{}` |
| Dynamic3D | `<Reality>` | 容器 transform + opacity | `{}` |

## 能力

`supports('useAnimation', ['element'|'static3d'|'dynamic3d'])`

## 与 Model clip 区分

`ref.play()` — USD clip，与 `AnimationObject` 无关。
