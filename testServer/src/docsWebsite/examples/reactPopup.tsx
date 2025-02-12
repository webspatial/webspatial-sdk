import { SpatialSession } from '@xrsdk/runtime'
import { useState } from 'react'
import { showSample } from './sampleLoader'
import { SpatialDiv } from '@xrsdk/react'

function MySample(_props: { session?: SpatialSession }) {
  const [popupEnabled, setPopupEnabled] = useState(false)

  return (
    <>
      {popupEnabled ? (
        <div
          style={{
            backgroundColor: '#110000aa',
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: '0px',
            left: '0px',
            padding: '0px',
            zIndex: '100',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <SpatialDiv
            spatialStyle={{
              position: { z: 50 },
              material: {
                type: "default"
              },
              cornerRadius: 70,
            }}
            style={{
              backgroundColor: '#FFFF0000',
              margin: 'auto',
              overflow: 'scroll',
            }}
          >
            <div className="card shadow-xl">
              <div className="card-body items-center text-center">
                <h2 className="card-title">PopUp!</h2>
                <p>This is a popup message</p>
                <div className="card-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setPopupEnabled(false)
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </SpatialDiv>
        </div>
      ) : (
        <div></div>
      )}
      <div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setPopupEnabled(true)
          }}
        >
          Trigger popup
        </button>
      </div>
    </>
  )
}
showSample(MySample)
