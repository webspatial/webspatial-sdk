import { useState } from 'react';
export const SimpleSpatialComponent = () => {
  const [isPrimary, setIsPrimary] = useState(true)

  const onClick = () => {
    setIsPrimary(v => !v)
  }
  const style = isPrimary ? {
    // '--xr-back': 60,
    transformOrigin: 'left top',
    // transform: 'scaleZ(3)   scaleX(3) rotate3d(0, 0, 1, 30deg)',
    transform: 'rotate3d(1, 0, 0, 30deg) ',
    // rotate3d(1, 0, 0, 30deg)

    color: 'red',
  } : {
    '--xr-back': 160,
    color: 'red',
  }

  return <div enable-xr style={style} className="inline-block" onClick={onClick}  > SimpleSpatialComponent  </div>
}
 