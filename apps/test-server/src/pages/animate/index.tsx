import { enableDebugTool } from '@webspatial/react-sdk'
import { AnimeTest } from './AnimeTest'
import { GSAPTest } from './GSAPTest'
import { PopmotionTest } from './PopmotionTest'
import { ReactSpringModel3DTest } from './ReactSpringModel3DTest'
import { ReactSpringTest } from './ReactSpringTest'
import './style.scss'
import { TeenjsTest } from './TeenjsTest'

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
