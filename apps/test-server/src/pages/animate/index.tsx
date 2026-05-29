import ReactDOM from 'react-dom/client'
import { enableDebugTool } from '@webspatial/react-sdk'
import './style.scss'
import { PopmotionTest } from './PopmotionTest'
import { TeenjsTest } from './TeenjsTest'
import { GSAPTest } from './GSAPTest'
import { AnimeTest } from './AnimeTest'
import { ReactSpringTest } from './ReactSpringTest'
import { ReactSpringModel3DTest } from './ReactSpringModel3DTest'

enableDebugTool()

export default function AnimateTest() {
  return (
    <div className="w-full h-full ">
      <div className="m-10">
        <PopmotionTest />

        <TeenjsTest />

        <GSAPTest />

        <AnimeTest />

        <ReactSpringTest />

        <ReactSpringModel3DTest />
      </div>
    </div>
  )
}
