import { useState } from 'react';
export const SimpleSpatialComponent = () => {
  const [isPrimary, setIsPrimary] = useState(true)

  const onClick = () => {
    setIsPrimary(v => !v)
  }
  const style = isPrimary ? {
    '--xr-back': 60,
    
    // transform: 'translateX(10px) translateZ(10px) rotateZ(30deg)',

    transform: 'rotateZ(30deg) ',

    color: 'blue',
  } : {
    '--xr-back': 160,
    color: 'red',
  }

  return <div enable-xr style={style} className="inline-block" onClick={onClick}  > SimpleSpatialComponent  </div>
}
 