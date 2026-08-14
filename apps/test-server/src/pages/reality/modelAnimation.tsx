import React, { useEffect, useRef, useState } from 'react'
import {
  ModelAsset,
  ModelEntity,
  Reality,
  SceneGraph,
  Entity,
} from '@webspatial/react-sdk'
import type {
  ModelAnimationClip,
  ModelAssetLoadEvent,
  ModelEntityRef,
} from '@webspatial/react-sdk'
import { useEntityAnimation } from '@webspatial/react-sdk/experimental'

// Manual validation page for ModelEntity built-in animation playback:
// - clip discovery via <ModelAsset onLoad>
// - play / pause / seek / playbackRate / loop per instance
// - two entities sharing one asset, driven independently
// - built-in clip playback combined with a root transform animation
export default function RealityModelAnimation() {
  const [clips, setClips] = useState<readonly ModelAnimationClip[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const refA = useRef<ModelEntityRef>(null)
  const refB = useRef<ModelEntityRef>(null)

  // Live state readout, polled from the refs (currentTime extrapolates
  // between native samples, so 4 Hz is plenty for a progress readout).
  const [stateA, setStateA] = useState('')
  const [stateB, setStateB] = useState('')
  useEffect(() => {
    const timer = setInterval(() => {
      const read = (ref: React.RefObject<ModelEntityRef | null>) => {
        try {
          const anim = ref.current?.modelAnimation
          if (!anim) return 'not ready'
          const clip = anim.currentClip
          if (!clip) return 'no clip selected'
          return `${clip.name ?? clip.id} ${anim.currentTime.toFixed(2)}s / ${anim.duration.toFixed(2)}s rate=${anim.playbackRate} ${anim.paused ? 'paused' : 'playing'}`
        } catch {
          return 'not ready'
        }
      }
      setStateA(read(refA))
      setStateB(read(refB))
    }, 250)
    return () => clearInterval(timer)
  }, [])

  // Root transform animation on entity A, running concurrently with the
  // built-in clip animation.
  const [transformAnimation, transformApi] = useEntityAnimation({
    from: { position: { x: -0.2, y: 0, z: 0 } },
    to: { position: { x: 0.2, y: 0, z: 0 } },
    duration: 4.0,
    timingFunction: 'easeInOut',
    autoStart: false,
    loop: true,
  })

  const onAssetLoad = (event: ModelAssetLoadEvent) => {
    setClips(event.animations)
  }

  const control = (
    ref: React.RefObject<ModelEntityRef | null>,
    action: (anim: NonNullable<ModelEntityRef['modelAnimation']>) => void,
  ) => {
    try {
      const anim = ref.current?.modelAnimation
      if (anim) action(anim)
    } catch (error) {
      console.error('modelAnimation control failed', error)
    }
  }

  const btnStyle: React.CSSProperties = {
    padding: '6px 12px',
    margin: '0 6px 6px 0',
    border: '1.5px solid #aaa',
    borderRadius: 8,
    background: '#f6f6f6',
    cursor: 'pointer',
    fontSize: 14,
  }

  const renderControls = (
    label: string,
    ref: React.RefObject<ModelEntityRef | null>,
    state: string,
  ) => (
    <div style={{ marginBottom: 12 }}>
      <strong>{label}</strong>{' '}
      <code data-testid={`state-${label}`}>{state}</code>
      <div>
        <button style={btnStyle} onClick={() => control(ref, a => a.play())}>
          Play
        </button>
        <button
          style={btnStyle}
          onClick={() => control(ref, a => a.play(undefined, { loop: true }))}
        >
          Play (loop)
        </button>
        {clips.map(clip => (
          <button
            key={clip.id}
            style={btnStyle}
            onClick={() => control(ref, a => a.play(clip.id, { loop: true }))}
          >
            Play {clip.name ?? clip.id}
          </button>
        ))}
        <button style={btnStyle} onClick={() => control(ref, a => a.pause())}>
          Pause
        </button>
        <button style={btnStyle} onClick={() => control(ref, a => a.seek(0))}>
          Seek 0
        </button>
        <button
          style={btnStyle}
          onClick={() => control(ref, a => a.seek(a.duration / 2))}
        >
          Seek 50%
        </button>
        <button
          style={btnStyle}
          onClick={() => control(ref, a => a.setPlaybackRate(0.5))}
        >
          0.5×
        </button>
        <button
          style={btnStyle}
          onClick={() => control(ref, a => a.setPlaybackRate(1))}
        >
          1×
        </button>
        <button
          style={btnStyle}
          onClick={() => control(ref, a => a.setPlaybackRate(2))}
        >
          2×
        </button>
      </div>
    </div>
  )

  return (
    <div>
      <h2>ModelEntity Animation Test</h2>
      <div style={{ marginBottom: 12 }}>
        <strong>Discovered clips:</strong>{' '}
        {loadError ? (
          <span style={{ color: 'red' }}>{loadError}</span>
        ) : clips.length === 0 ? (
          'none (yet)'
        ) : (
          <ul data-testid="clip-list">
            {clips.map(clip => (
              <li key={clip.id}>
                <code>{clip.id}</code> name={clip.name ?? 'null'} duration=
                {clip.duration.toFixed(2)}s
              </li>
            ))}
          </ul>
        )}
      </div>

      {renderControls('A', refA, stateA)}
      {renderControls('B', refB, stateB)}

      <div style={{ marginBottom: 12 }}>
        <strong>Root transform animation (entity A)</strong>
        <div>
          <button style={btnStyle} onClick={() => transformApi.play()}>
            Play transform
          </button>
          <button style={btnStyle} onClick={() => transformApi.pause()}>
            Pause transform
          </button>
          <button style={btnStyle} onClick={() => transformApi.cancel()}>
            Cancel transform
          </button>
        </div>
      </div>

      <Reality style={{ width: 640, height: 400 }}>
        <ModelAsset
          id="animatedModel"
          src="/modelasset/Fox_animated.glb"
          onLoad={onAssetLoad}
          onError={error => setLoadError(String(error))}
        />
        <SceneGraph>
          <Entity position={{ x: 0, y: 0, z: 0 }}>
            <ModelEntity
              id="animEntA"
              ref={refA}
              model="animatedModel"
              animation={transformAnimation}
              position={{ x: -0.2, y: 0, z: 0 }}
              scale={{ x: 0.002, y: 0.002, z: 0.002 }}
            />
            <ModelEntity
              id="animEntB"
              ref={refB}
              model="animatedModel"
              position={{ x: 0.2, y: 0, z: 0 }}
              scale={{ x: 0.002, y: 0.002, z: 0.002 }}
            />
          </Entity>
        </SceneGraph>
      </Reality>
    </div>
  )
}
