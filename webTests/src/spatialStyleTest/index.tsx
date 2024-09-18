import React from 'react'
import ReactDOM from 'react-dom/client'
import { SpatialStyleComponent } from './SpatialStyleComponent';
import styled from 'styled-components';
import { CSSModelSample } from './CSSModelSample';

const JackComponent = (props: any) => {
    const style = {
        back: 23
    }
    const style2 = {
        back: 13
    }
    return <div   className='text-blue bg-base-200	bg-clip-border px-6 py-6 '>
        this is JackComponent
        <p    > no!! </p>

        {props.children}

    </div>
}

const Title = styled.h1`
  font-size: 1.5em;
  text-align: center;
  color: #BF4F74;
  back: 122
`;

const Title2 = styled.h1`
  font-size: 1.5em;
  text-align: center;
  color: #BF4F74;
  back: 10
`;

function App() {
    const style = {
        background: 'yellow',
        back: 72
    }

    const style2 = {
        back: 52
    }

    return (
        <div   className='w-screen h-screen flex flex-row base-200' >
            {/* <div> number one </div>
            <div> number two </div> */}
            <Title style={style}  > this is style component </Title>
            {/* <Title2> this is another style component </Title2> */}
            <CSSModelSample />

            {/* <div className="text-blue   bg-base-200	bg-clip-border px-6 py-6  ">
                <a href="#" onClick={() => history.go(-1)}>Go Back</a>
            </div>
            <div className="flex flex-col flex-1">
                <SpatialStyleComponent />
            </div> */}
            why it
            {/* <JackComponent style = {style} > good luck < /JackComponent> */}
        </div>
    )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode >,
)