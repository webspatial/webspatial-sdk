import { Model, ModelLoadEvent, ModelRef } from '@webspatial/react-sdk'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Logger, useLogger } from './Logger'

const MODEL_SRC =
  'https://developer.apple.com/augmented-reality/quick-look/models/drummertoy/toy_drummer.usdz'

function describeCurrentTarget(event: ModelLoadEvent) {
  return {
    tagName: event.currentTarget.tagName,
    currentSrc: event.currentTarget.currentSrc,
    readyProperty: 'ready' in event.currentTarget,
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : JSON.stringify(error)
}

export default function NestedStatic3DModelReady() {
  const modelRef = useRef<ModelRef | null>(null)
  const [logs, logLine, clearLog] = useLogger()
  const [status, setStatus] = useState('waiting for Model onLoad')

  useEffect(() => {
    logLine(
      'page mounted',
      'Mounts <div enable-xr><Model enable-xr /></div> and reads event.currentTarget.ready from onLoad.',
    )
  }, [logLine])

  const handleLoad = useCallback(
    (event: ModelLoadEvent) => {
      const currentTarget = describeCurrentTarget(event)
      logLine('onLoad currentTarget', currentTarget)
      setStatus('onLoad fired; waiting for event.currentTarget.ready')

      let ready
      try {
        ready = event.currentTarget.ready
      } catch (error) {
        logLine(
          'event.currentTarget.ready getter threw',
          getErrorMessage(error),
        )
        setStatus('event.currentTarget.ready getter threw')
        return
      }

      if (!ready || typeof ready.then !== 'function') {
        logLine('event.currentTarget.ready unavailable')
        setStatus('event.currentTarget.ready unavailable')
        return
      }

      ready
        .then(readyEvent => {
          logLine(
            'event.currentTarget.ready resolved',
            describeCurrentTarget(readyEvent),
          )
          setStatus('event.currentTarget.ready resolved')
        })
        .catch(error => {
          logLine('event.currentTarget.ready rejected', getErrorMessage(error))
          setStatus('event.currentTarget.ready rejected')
        })
    },
    [logLine],
  )

  const handleError = useCallback(
    (event: ModelLoadEvent) => {
      logLine('onError currentTarget', describeCurrentTarget(event))
      setStatus('Model onError fired')
    },
    [logLine],
  )

  return (
    <div className="prose max-w-none p-10 text-gray-100">
      <h1>Nested Static 3D Model Ready</h1>
      <p className="max-w-3xl text-sm text-gray-300">
        Reproduces the nested static 3D model path where a spatial parent owns
        the branch and the Model load event currentTarget still needs a working
        ready promise.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-2 not-prose">
        <span className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm">
          {status}
        </span>
      </div>

      <div
        enable-xr
        className="mb-6 flex min-h-[260px] items-center justify-center rounded border border-cyan-500/60 bg-cyan-950/20 p-6 not-prose"
        style={{
          '--xr-depth': '180px',
          '--xr-back': '40px',
        }}
      >
        <Model
          ref={modelRef}
          enable-xr
          src={MODEL_SRC}
          poster="/img/toy_drummer.png"
          stagemode="orbit"
          style={{
            width: '280px',
            height: '220px',
            '--xr-depth': '120px',
            '--xr-back': '30px',
          }}
          onLoad={handleLoad}
          onError={handleError}
        >
          <img
            src="/img/toy_drummer.png"
            className="h-[220px] w-[280px] object-contain"
          />
        </Model>
      </div>

      <div className="mb-6 not-prose">
        <button
          className="btn"
          onClick={() => {
            modelRef.current?.ready
              .then(event => {
                logLine(
                  'ref.current.ready resolved',
                  describeCurrentTarget(event),
                )
              })
              .catch(error => {
                logLine('ref.current.ready rejected', getErrorMessage(error))
              })
          }}
        >
          Check ref.current.ready
        </button>
      </div>

      <Logger logs={logs} clearLog={clearLog} />
      <BlobModel
        src="/modelasset/cone.usdz"
        poster="/modelasset/cone.png"
        type="model/vnd.usdz+zip"
      />
    </div>
  )
}

type BlobModelProps = {
  src: string
  poster?: string
  type: string
}
function BlobModel({ src, poster, type }: BlobModelProps) {
  const [blobSrc, setBlobSrc] = useState<string>()
  useEffect(() => {
    let objectURL: string | undefined
    let cancelled = false
    fetch(src)
      .then(res => res.blob())
      .then(blob => {
        if (cancelled) return
        objectURL = URL.createObjectURL(blob)
        setBlobSrc(objectURL)
      })
    return () => {
      cancelled = true
      if (objectURL) URL.revokeObjectURL(objectURL)
    }
  }, [])
  return (
    <Model
      poster={poster}
      enable-xr
      style={{
        height: '200px',
        '--xr-depth': '100px',
        '--xr-back': '50px',
        marginBottom: '20px',
      }}
    >
      <source src={blobSrc} type={type} />
    </Model>
  )
}
