import { useState } from 'react';
import styled from 'styled-components';

export const StyledTitle = styled.h1<{ $primary?: boolean; }>`
  font-size: 1.5em;
  text-align: center;
  position: absolute;
  top: ${props => props.$primary ? '20px' : '50px'};
  color: ${props => props.$primary ? "blue" : "red"};
   
  background: #fff;
`;

// added absolute

//  back: ${props => props.$primary ? 120 : 150};

export const StyledTitle2 = styled.h1`
  font-size: 1.5em;
  text-align: center;
  color: #BF4F74;
  back: 123
`;

// const ExtStyledTitle2 = withSpatial(StyledTitle2)

// const SimpleComponent = (props: Object<any>) => {
//   return <div isspatial {...props}> hello </div>
// }

export const StyledTitleComponent = () => {
  const [isPrimary, setIsPrimary] = useState(true)

  const onClick = () => {
    setIsPrimary(v => !v)
  }

  // const onClick = () => {
  //   setIsPrimary(v => !v)
  // }

  const style = isPrimary ? {
    // back: 31
  }: {
    // back: 42  
  }

  return ( 
    <StyledTitle  isspatial style={style} onClick={onClick} $primary={isPrimary}   > this is style component </StyledTitle>)
 
  // return <SimpleComponent isspatial onClick={onClick} style={style} />
  // return <div isspatial onClick={onClick} style={style} > helo </div> 


  // return (<SpatialDiv spatialStyle={{position: {z: back}}}>
  //   <SimpleComponent onClick={onClick} style={style}></SimpleComponent>
  // {/* <StyledTitle   onClick={onClick} $primary={isPrimary}   > this is style component </StyledTitle> */}
  //  </SpatialDiv>)
}