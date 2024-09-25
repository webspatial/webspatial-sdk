import { useEffect, useState } from 'react';
import styled from 'styled-components';

export const StyledTitle = styled.h1<{ $primary?: boolean; }>`
  font-size: 1.5em;
  text-align: center;
  color: ${props => props.$primary ? "blue" : "red"};
  back: ${props => props.$primary ? 20 : 150};
  background: #fff;
`;

//  back: ${props => props.$primary ? 120 : 150};

export const StyledTitle2 = styled.h1`
  font-size: 1.5em;
  text-align: center;
  color: #BF4F74;
  back: 123
`;

const SimpleComponent = (props: Object<any>) => {
  return <div {...props}> hello </div>
}



export const StyledTitleComponent = () => {
  const [isPrimary, setIsPrimary] = useState(true)

//   useEffect(() => {
//     console.log('dbg begin StyledTitleComponent')
//     return () => {
//         console.log('dbg end StyledTitleComponent')
//     }
// }, [])

  const onClick = () => {
    setIsPrimary(v => !v)
  }

  const style = {
    background: isPrimary ? 'yellow': 'green',
    // back: isPrimary ? 72 : 102
  }

  // const back = isPrimary ? 72 : 102

  return  <StyledTitle isspatial onClick={onClick} $primary={isPrimary}   > this is style component </StyledTitle>
  // return <SimpleComponent isspatial onClick={onClick} style={style} />
  // return <div isspatial onClick={onClick} style={style} > helo </div> 


  // return (<SpatialDiv spatialStyle={{position: {z: back}}}>
  //   <SimpleComponent onClick={onClick} style={style}></SimpleComponent>
  // {/* <StyledTitle   onClick={onClick} $primary={isPrimary}   > this is style component </StyledTitle> */}
  //  </SpatialDiv>)
  
}
