import { Component, type ReactNode, useState } from 'react'
import { BoxEntity, Reality, SceneGraph } from '@webspatial/react-sdk'
import { useEntityAnimation } from '@webspatial/react-sdk/experimental'
import {
  EntityAnimationPageShell,
  EntityPropsPanel,
  Log,
  btnCls,
  btnPrimary,
  fmtVec3,
  useLog,
} from './shared'

class BindingErrorBoundary extends Component<
  {
    children: ReactNode
    resetKey: number
    onError: (message: string) => void
  },
  { error: string | null }
> {
  state = { error: null }

  static getDerivedStateFromError(error: unknown) {
    return { error: error instanceof Error ? error.message : String(error) }
  }

  componentDidCatch(error: unknown) {
    this.props.onError(error instanceof Error ? error.message : String(error))
  }

  componentDidUpdate(prevProps: Readonly<{ resetKey: number }>) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div
          data-testid="entity-motion-second-binding-error"
          className="rounded-xl border border-red-800 bg-red-950/30 p-4 text-sm text-red-300"
        >
          Second binding rejected: {this.state.error}
        </div>
      )
    }
    return this.props.children
  }
}

export default function EntityAnimationBindingOwnershipPage() {
  const logger = useLog()
  const [bindingEnabled, setBindingEnabled] = useState(true)
  const [secondEnabled, setSecondEnabled] = useState(false)
  const [secondAttempt, setSecondAttempt] = useState(0)
  const [bindingError, setBindingError] = useState('none')
  const [reactPosition, setReactPosition] = useState({
    x: 0,
    y: 0,
    z: 0,
  })

  const [animation, api, entityProps] = useEntityAnimation({
    from: { position: { x: -0.12, y: 0, z: 0 } },
    to: { position: { x: 0.12, y: 0, z: 0 } },
    duration: 2,
    autoStart: false,
    onStart: () => logger.log('first:onStart'),
    onComplete: value =>
      logger.log(`first:onComplete pos=${fmtVec3(value.position)}`),
    onError: error =>
      logger.log(`first:onError [${error.code}] ${error.reason}`),
  })

  return (
    <EntityAnimationPageShell
      title="Binding and Ownership"
      description="Verify that unbinding clears the confirmed mirror and returns transform ownership to React. Reusing the same animation object for a second Entity must fail without disturbing the first Entity."
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6">
        <div className="flex flex-wrap gap-2">
          <button className={btnPrimary} onClick={() => api.play()}>
            Play first Entity
          </button>
          <button
            className={btnCls}
            onClick={() => {
              if (bindingEnabled) setSecondEnabled(false)
              setBindingEnabled(value => !value)
              logger.log(bindingEnabled ? 'unbind first' : 'bind first')
            }}
          >
            {bindingEnabled ? 'Unbind first' : 'Bind first'}
          </button>
          <button
            className={btnCls}
            disabled={!bindingEnabled}
            onClick={() => {
              setBindingError('none')
              setSecondAttempt(value => value + 1)
              setSecondEnabled(value => !value)
            }}
          >
            {secondEnabled ? 'Remove second' : 'Bind same animation to second'}
          </button>
          <button
            className={btnCls}
            onClick={() => {
              setReactPosition(value => ({ ...value, x: value.x + 0.1 }))
              logger.log('React position.x += 0.1')
            }}
          >
            React position.x += 0.1
          </button>
        </div>

        <div
          data-testid="entity-motion-binding-ownership-state"
          data-webspatial-binding-enabled={String(bindingEnabled)}
          data-webspatial-second-enabled={String(secondEnabled)}
          data-webspatial-binding-error={bindingError}
          data-webspatial-entity-props={JSON.stringify(entityProps)}
          className="mt-3 font-mono text-xs text-gray-500"
        >
          firstBinding={String(bindingEnabled)} secondBinding=
          {String(secondEnabled)} playState={api.playState}
          <br />
          React position={fmtVec3(reactPosition)} entityProps=
          {JSON.stringify(entityProps)} error={bindingError}
        </div>

        <Reality style={{ width: '100%', height: '220px' }}>
          <SceneGraph>
            <BoxEntity
              width={0.1}
              height={0.1}
              depth={0.1}
              position={reactPosition}
              {...(bindingEnabled ? entityProps : {})}
              animation={bindingEnabled ? animation : undefined}
            />
          </SceneGraph>
        </Reality>

        {secondEnabled ? (
          <BindingErrorBoundary
            resetKey={secondAttempt}
            onError={message => {
              setBindingError(message)
              logger.log(`second binding rejected: ${message}`)
            }}
          >
            <Reality style={{ width: '100%', height: '180px' }}>
              <SceneGraph>
                <BoxEntity
                  width={0.08}
                  height={0.08}
                  depth={0.08}
                  position={{ x: 0, y: 0.15, z: 0 }}
                  animation={animation}
                />
              </SceneGraph>
            </Reality>
          </BindingErrorBoundary>
        ) : null}

        <EntityPropsPanel entityProps={entityProps} />
        <Log lines={logger.lines} />
        <p className="mt-3 text-xs text-gray-500">
          After Unbind first, entityProps must become empty and the React
          position button must move the first box. A second binding attempt must
          show a rejection while the first box remains controllable.
        </p>
      </section>
    </EntityAnimationPageShell>
  )
}
