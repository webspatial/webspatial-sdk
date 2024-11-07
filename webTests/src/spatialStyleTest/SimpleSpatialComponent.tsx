import { useState } from 'react';
export const SimpleSpatialComponent = () => {
  const [isPrimary, setIsPrimary] = useState(true)

  const onClick = () => {
    setIsPrimary(v => !v)
  }
  const style = isPrimary ? {
    '--xr-back': 60,
    color: 'blue',
  } : {
    '--xr-back': 160,
    color: 'red',
  }

  return <div enable-xr style={style} onClick={onClick}  > SimpleSpatialComponent  </div>
}
 