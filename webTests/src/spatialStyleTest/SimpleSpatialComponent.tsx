import { useState } from 'react';
export const SimpleSpatialComponent = () => {
  const [isPrimary, setIsPrimary] = useState(true)

  const onClick = () => {
    setIsPrimary(v => !v)
  }

  const style = isPrimary ? {
    back: 30,
    color: 'blue',
  } : {
    back: 60,
    color: 'red',
  }


  return (<div isspatial style={style} onClick={onClick}> SimpleSpatialComponent </div>)
}