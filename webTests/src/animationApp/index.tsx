import React, {   useRef,   } from 'react'
import ReactDOM from 'react-dom/client'
import { Spatial, AnimationBuilder, Model, ModelRef } from 'web-spatial';

const spatial = new Spatial()
const spatialSupported = spatial.isSupported()

if (spatialSupported) {
    var session = (new Spatial()).requestSession();
    (session.getCurrentIFrameComponent()).setStyle({ glassEffect: true, cornerRadius: 50 })
}



function App() {
    const myDiv = useRef(null);

    const modelRef: ModelRef= useRef(null);
    const onAnimateModelFadeIn = () => {
        const animationBuilder = new AnimationBuilder();
        animationBuilder.fadeOut(false);
        animationBuilder.fadeDuration(0.1);
        modelRef.current?.animate(animationBuilder)
    }

    const onAnimateModelFadeOut = () => {
        const animationBuilder = new AnimationBuilder();
        animationBuilder.fadeOut(true);
        animationBuilder.fadeDuration(1.1);
        modelRef.current?.animate(animationBuilder)
    }

    return (
        <div className='w-screen h-screen flex flex-row' ref={myDiv}>
            <div className="text-blue bg-purple-500 bg-opacity-10   min-h-screen flex-1  justify-center px-6 py-12 lg:px-8">
                <ul>
                    <li><div onClick={onAnimateModelFadeIn} > FadeIn  </div> </li>
                    <li><div onClick={onAnimateModelFadeOut} > FadeOut  </div> </li>
                </ul>
            </div>
            <div className="flex-1">
                    {spatialSupported ?
                        <div className='w-full h-52'>
                            <Model ref={modelRef} className="w-full h-full bg-white bg-opacity-25 rounded-xl">
                                <source src="/src/assets/FlightHelmet.usdz" type="model/vnd.usdz+zip" ></source>
                            </Model>
                        </div>
                        :
                        <div className='w-full h-52'>
                            <div className="w-full h-full bg-white bg-opacity-25 rounded-xl">
                                Model goes here
                            </div>
                        </div>
                    }
            </div>
        </div>
    )
}



// await WebSpatial.setWebPanelStyle(WebSpatial.getCurrentWindowGroup(), WebSpatial.getCurrentWebPanel())
document.documentElement.style.backgroundColor = "transparent";
document.body.style.backgroundColor = "transparent"
ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode >,
)

