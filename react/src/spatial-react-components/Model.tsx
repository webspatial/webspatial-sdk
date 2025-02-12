import '@google/model-viewer'
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any
    }
  }
}
import React, {
  ReactElement,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  Ref,
  useState,
} from 'react'
// import { AnimationBuilder } from '../core'
import { initializeSpatialOffset } from './utils'
import { SpatialModelUIManager } from './SpatialModelUIManager'
import { _incSpatialUIInstanceIDCounter } from './_SpatialUIInstanceIDCounter'
import { vecType } from './types'
import { getSession } from '../utils'

// 定义子组件的 props 类型
export interface ModelProps {
  className: string
  children: ReactElement | Array<ReactElement>
  spatialOffset?: { x?: number; y?: number; z?: number }
  opacity?: number
  onLoad?: (event: { target: { currentSrc: string; ready: boolean } }) => void
}

export type ModelRef = Ref<{
  // animate :(animationBuilder: AnimationBuilder) => void,
  getBoundingClientRect: () => DOMRect
}>

{
  /* <model interactive width="670" height="1191">
<source src="assets/FlightHelmet.usdz" type="model/vnd.usdz+zip" />
<source src="assets/FlightHelmet.glb" type="model/gltf-binary" />
<picture>
  <img src="assets/FlightHelmet.png" width="670" height="1191" />
</picture>
</model> */
}

/**
 * Allows embedding 3D graphical content inline within the webpage. Behaves similar to an img element but displays a 3D model instead
 *
 * Intended to behave similar to https://immersive-web.github.io/model-element/
 */
export const Model = forwardRef((props: ModelProps, ref: ModelRef) => {
  props = { ...{ spatialOffset: { x: 0, y: 0, z: 0 } }, ...props }
  var [glbSrc, setGlbSrc] = useState('')
  initializeSpatialOffset(props.spatialOffset!)

  const opacity = props.opacity ?? 1

  let session = getSession()
  if (!session) {
    const myModelViewer = useRef(null)
    useEffect(() => {
      React.Children.toArray(props.children).some((element: any) => {
        var src = element.props.src as string
        var fileExt = src.split('.').pop()
        if (fileExt == 'glb' || fileExt == 'gltf') {
          setGlbSrc(src)
          return true // exit early
        }
        return false
      })
      ;(myModelViewer.current! as any).addEventListener(
        'load',
        (event: any) => {
          if (props.onLoad) {
            props.onLoad({
              target: {
                ready: event.returnValue,
                currentSrc: event.detail.url,
              },
            })
          }
        },
      )
    }, [])
    return (
      <div className={props.className}>
        <model-viewer
          ref={myModelViewer}
          style={{
            width: '100%',
            height: '100%',
          }}
          src={glbSrc}
          camera-controls
          touch-action="pan-y"
        ></model-viewer>
      </div>
    )
  }

  // const animate = (animationBuilder: AnimationBuilder) => {
  //     const spatialModelUIManager = instanceState.current[currentInstanceID.current];
  //     spatialModelUIManager.modelComponent?.applyAnimationToResource(animationBuilder)
  // }

  useImperativeHandle(ref, () => ({
    // animate,
    getBoundingClientRect() {
      return (myDiv.current! as HTMLElement).getBoundingClientRect()
    },
  }))

  let instanceState = useRef({} as { [id: string]: SpatialModelUIManager })
  let currentInstanceID = useRef(0)

  const myDiv = useRef(null)
  async function resizeDiv() {
    instanceState.current[currentInstanceID.current].resize(
      myDiv.current! as HTMLElement,
      props.spatialOffset as vecType,
    )
  }
  async function setContent(savedId: number, src: string) {
    await instanceState.current[savedId].init(src)
    await resizeDiv()
  }

  async function setOpacity(opacity: number) {
    await instanceState.current[currentInstanceID.current]?.setOpacity(opacity)
  }

  useEffect(() => {
    // Created
    currentInstanceID.current = _incSpatialUIInstanceIDCounter()
    instanceState.current[currentInstanceID.current] =
      new SpatialModelUIManager()
    window.addEventListener('resize', resizeDiv)
    ;(async () => {
      var savedId = currentInstanceID.current
      var srcAr = new Array<string>()
      React.Children.forEach(props.children, async element => {
        srcAr.push(element.props.src)
      })
      await setContent(savedId, srcAr[0])
      await setOpacity(opacity)
    })()
    return () => {
      // destroyed
      var savedId = currentInstanceID.current
      removeEventListener('resize', resizeDiv)
      ;(async () => {
        await instanceState.current[savedId].destroy()
        delete instanceState.current[savedId]
      })()
    }
  }, [])

  useEffect(() => {
    resizeDiv()
    return () => {}
  }, [props.spatialOffset])

  useEffect(() => {
    setOpacity(opacity)
  }, [opacity])

  return <div ref={myDiv} className={props.className} />
})
