import ReactDOM from 'react-dom/client'
import { enableDebugTool } from '@xrsdk/react'
import {
  motion,
  useAnimate,
  useMotionValue,
  useMotionValueEvent,
} from 'motion/react'
import './style.scss'

enableDebugTool()

import React, { useEffect, useRef, useState } from 'react'

function App() {
  // const [animate, setAnimate] = useState(false)

  const x = useMotionValue(100)

  useMotionValueEvent(x, 'animationStart', () => {
    console.log('animation started on x')
  })

  useMotionValueEvent(x, 'change', latest => {
    console.log('x changed to', latest)
  })

  const onClick = () => {
    x.set(11 + x.get())

    const isEven = x.get() % 2 === 0

    animate(
      scope.current,
      {
        // x: isEven ? 100 : 50,
        // opacity: isEven ? [1, 0.5, 1] : [0, 0.5, 0],
        // opacity: isEven ? 1 : 0,
        left: isEven ? 100 : 50,
      },
      { duration: 10 },
    )
  }

  const ref = useRef(null)
  const ref0 = useRef(null)
  useEffect(() => {
    ;(window as any).ref = scope
    ;(window as any).ref0 = ref0
  }, [])

  const tobeCompareStyle = {
    transform: 'translateX(100px)',
  }

  const [scope, animate] = useAnimate()
  // useEffect(() => {
  //   animate(
  //     scope.current,
  //     {
  //       x: 100,
  //     },
  //     { duration: 10 },
  //   )
  // }, [])

  return (
    <>
      {/* <motion.div ref={ref0} enable-xr className="box" style={{ x }} /> */}

      <div enable-xr ref={scope} className="box" />

      {/* <div
        enable-xr
        ref={ref}
        className="box transformXX"
        style={tobeCompareStyle}
      /> */}

      <div className="jumpbtn" onClick={onClick}>
        jump
      </div>
    </>
  )

  // return (
  //   <div style={{ textAlign: 'center', marginTop: '50px' }}>
  //     {/* 动画目标元素 */}
  //     <motion.div
  //       style={{
  //         width: 100,
  //         height: 100,
  //         backgroundColor: '#3498db',
  //         margin: '0 auto',
  //       }}
  //       animate={{
  //         translateX: animate ? 200 : 0, // 根据状态决定是否移动
  //         // rotate: animate ? 45 : 0, // 根据状态决定是否旋转
  //         // opacity: animate ? 0.5 : 1, // 根据状态决定透明度
  //       }}
  //       transition={{
  //         duration: 1, // 动画持续 1 秒
  //         ease: 'easeInOut', // 缓动函数
  //       }}
  //     />

  //     {/* 触发动画的按钮 */}
  //     <button
  //       onClick={() => setAnimate(!animate)} // 切换动画状态
  //       style={{ marginTop: '20px', padding: '10px 20px' }}
  //     >
  //       {animate ? 'Reset' : 'Animate'}
  //     </button>
  //   </div>
  // )
}

export default App

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
