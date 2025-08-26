import ReactDOM from 'react-dom/client'

import { enableDebugTool } from '@webspatial/react-sdk'
import { useEffect, useRef } from 'react'

enableDebugTool()

function App() {
  const ref = useRef<HTMLModelElement>()
  ;(window as any).refModel = ref
  const style = {
    width: '800px',
    height: '800px',
    backgroundColor: 'blue',
  }
  // const src = 'http://localhost:5173/public/modelasset/cone.usdz'
  const src = 'http://localhost:5173/public/modelasset/cone.glb'
  const poster = 'http://localhost:5173/public/vite.svg'
  const imgSrc = 'http://localhost:5173/public/vite.svg'

  useEffect(() => {
    async function testReady() {
      if (ref.current) {
        console.log('ref.current.ready', ref.current.ready)
        try {
          await ref.current.ready.then(data => {
            console.log('on ready', data, data.entityTransform)
          })
          console.log('on ready', ref.current.currentSrc, ref.current.loading)
        } catch (error) {
          console.log(
            'on failure',
            ref.current,
            ref.current.currentSrc,
            ref.current.loading,
          )
        }
      }
    }

    testReady()
  }, [ref])

  const refHiddenModel = useRef<HTMLElement>()
  useEffect(() => {
    if (refHiddenModel.current) {
      const observer = new IntersectionObserver(
        (entries, observerInstance) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              console.log('element enter view！', entry.target)

              // observerInstance.unobserve(entry.target);
            } else {
              console.log('element leave view')
            }
          })
        },
        {
          root: null, // 使用视口作为根
          rootMargin: '0px', // 无外扩
          threshold: 0.5, // 当50%的目标元素可见时触发回调
        },
      )
      observer.observe(refHiddenModel.current)
    }
  }, [refHiddenModel])

  return (
    <>
      <div> this page is verifying spatial model content</div>
      <model
        style={style}
        ref={ref}
        poster={poster}
        onLoad={event => {
          console.log('dbg model onload', event)
        }}
        onError={error => {
          console.log('dbg model onerror', error)
        }}
      >
        <source
          src="http://localhost:5173/public/modelasset/cone.glb"
          type="model/gltf-binary"
        />
        <source src="/spublic/modelasset/cone.usdz" type="model/vnd.usdz+zip" />
        <div> this is the model </div>
      </model>
      <div> this is the end of page </div>
      <img
        src={imgSrc}
        onLoad={event => {
          console.log('dbg img onload', event)
        }}
      />

      <video
        id="video"
        style={{
          width: '800px',
          height: '800px',
        }}
        onError={error => {
          console.log('dbg video onerror', error)
        }}
      >
        <source src={'this.props.src'} type="video/mp4" />
        <source src={'t222'} type="video/mp4" />
      </video>

      <div
        ref={refHiddenModel}
        style={{
          visibility: 'hidden',
          height: '100px',
          width: '100px',
          backgroundColor: 'red',
        }}
      >
        this is the end of video
      </div>
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
