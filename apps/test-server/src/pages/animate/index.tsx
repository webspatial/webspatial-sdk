import { Link } from 'react-router-dom'
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
        <p className="text-gray-300 mb-4 text-sm">
          Plan B RFC:{' '}
          <Link className="text-blue-400 underline" to="/spatial-div-motion">
            Spatialized Motion (2D + 3D containers)
          </Link>
          {' · '}
          Plan A reference:{' '}
          <Link
            className="text-amber-400 underline"
            to="/spatial-div-animation"
          >
            SpatialDiv Animation archive
          </Link>
        </p>
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
