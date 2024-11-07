import { useState } from 'react';
export const SimpleSpatialComponent = () => {
  const [isPrimary, setIsPrimary] = useState(true)

  const onClick = () => {
    setIsPrimary(v => !v)
  }
  const style = isPrimary ? {
    '--xr-back': 60,
    
    transform: 'rotate3d(0, 1, 0, 80deg) translateZ(120px)',

    color: 'blue',
  } : {
    '--xr-back': 160,
    color: 'red',
  }

  return <div enable-xr style={style} className="inline-block" onClick={onClick}  > SimpleSpatialComponent  </div>
}
 