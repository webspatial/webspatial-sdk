import React from 'react'
import ReactDOM from 'react-dom/client'
import { Spatial } from '@xrsdk/runtime'
import { AnimatedSpatialDiv } from './AnimatedSpatialDiv'
import { AnimatedModel } from './AnimatedModel'

const spatial = new Spatial()
const spatialSupported = spatial.isSupported()

if (spatialSupported) {
  var session = new Spatial().requestSession()
  session
    .getCurrentWindowComponent()
    .setStyle({ glassEffect: true, cornerRadius: 50 })
}

function App() {
  return (
    <div className="w-screen h-screen flex flex-row base-200">
      <div className="text-blue   bg-base-200	bg-clip-border px-6 py-6  ">
        <a href="#" onClick={() => history.go(-1)}>
          Go Back
        </a>
      </div>
      <div className="flex flex-col flex-1">
        <div className="flex flex-row pt-5 gap-2 h-64">
          <AnimatedModel
            className="flex-1 h-full"
            spatialOffset={{ z: 0, x: 0, y: 0 }}
            spaceTranslateX={10}
            opacityFromTo={[1, 0]}
          >
            <source
              src="/src/assets/FlightHelmet.usdz"
              type="model/vnd.usdz+zip"
            ></source>
          </AnimatedModel>

          <AnimatedModel
            className="flex-1 h-full"
            spatialOffset={{ z: 0, x: 0, y: 0 }}
            spaceTranslateZ={100}
          >
            <source
              src="/src/assets/FlightHelmet.usdz"
              type="model/vnd.usdz+zip"
            ></source>
          </AnimatedModel>

          <AnimatedModel
            className="flex-1 h-full"
            spatialOffset={{ z: 0, x: 0, y: 0 }}
            spaceTranslateZ={100}
            opacityFromTo={[1, 0]}
          >
            <source
              src="/src/assets/FlightHelmet.usdz"
              type="model/vnd.usdz+zip"
            ></source>
          </AnimatedModel>
        </div>

        <div className="flex flex-row pt-5 gap-2">
          <div className="flex-1">
            <AnimatedSpatialDiv
              debugShowStandardInstance={false}
              spatialStyle={{ position: { z: 30, x: 0 } }}
              spaceTranslateX={100}
              loop={true}
              className=" h-12"
            >
              <div className="w-full h-full rounded-xl bg-red-400 text-yellow-500	 text-center	 content-center">
                spaceTranslateX
              </div>
            </AnimatedSpatialDiv>
          </div>

          <div className="flex-1">
            <AnimatedSpatialDiv
              debugShowStandardInstance={false}
              loop={true}
              spatialStyle={{ position: { z: 40, x: 0 } }}
              spaceTranslateY={50}
              className="  h-12"
            >
              <div className="w-full h-full rounded-xl bg-red-400 text-yellow-500	 text-center	 content-center">
                spaceTranslateY
              </div>
            </AnimatedSpatialDiv>
          </div>

          <div className="flex-1">
            <AnimatedSpatialDiv
              spatialStyle={{ position: { z: 50, x: 0 } }}
              spaceTranslateZ={150}
              className="  h-12"
            >
              <div className="w-full h-full rounded-xl bg-red-400 text-yellow-500	 text-center	 content-center">
                spaceTranslateZ
              </div>
            </AnimatedSpatialDiv>
          </div>
        </div>

        {/* <div className='flex flex-row mt-5 gap-4 	'>
                    <AnimatedSpatialDiv
                        duration={1000}
                        spatialStyle={
                            {
                                position: { z: 150, x: 0 },
                                rotation: { x: 0, y: 0, z: 0, w: 1 }
                            }
                        }
                        spaceRotationX={Math.PI * 30 / 180}
                        className='h-12 flex-1'>

                        <div className="w-full h-full rounded-xl bg-blue-400 text-gray-500 text-center content-center  ">
                            spaceRotationX
                        </div>

                    </AnimatedSpatialDiv>

                    <AnimatedSpatialDiv
                        duration={1000}
                        spatialStyle={
                            {
                                position: { z: 150, x: 0 },
                                rotation: { x: 0, y: 0, z: 0, w: 1 }
                            }
                        }
                        spaceRotationY={Math.PI * 30 / 180}
                        className='h-12 flex-1'>

                        <div className="w-full h-full rounded-xl bg-blue-400 text-gray-500 text-center content-center ">
                            spaceRotationY
                        </div>

                    </AnimatedSpatialDiv>

                    <AnimatedSpatialDiv
                        duration={1000}
                        spatialStyle={
                            {
                                position: { z: 150, x: 0 },
                                rotation: { x: 0, y: 0, z: 0, w: 1 }
                            }
                        }
                        spaceRotationZ={Math.PI * 30 / 180}
                        className='h-12 flex-1'>

                        <div className="w-full h-full rounded-xl bg-blue-400 text-gray-500 text-center	content-center ">
                            spaceRotationZ
                        </div>

                    </AnimatedSpatialDiv>
                </div> */}
      </div>
    </div>
  )
}

// await WebSpatial.setWebPanelStyle(WebSpatial.getCurrentWindowGroup(), WebSpatial.getCurrentWebPanel())
document.documentElement.style.backgroundColor = 'transparent'
document.body.style.backgroundColor = 'transparent'
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
