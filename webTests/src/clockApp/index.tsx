import React from 'react'
import ReactDOM from 'react-dom/client'
import { Spatial, SpatialSession } from 'web-spatial/src/index';
import { SpatialIFrame } from 'web-spatial/src/webSpatialComponents';

var spatial: Spatial | null = new Spatial();
if (!spatial.isSupported()) {
    spatial = null
}

// Create session if spatial is supported
var session: SpatialSession | undefined
if (spatial) {
    session = spatial.requestSession()
}

var pageName = (new URLSearchParams(window.location.search)).get("pageName");
var transparent = (new URLSearchParams(window.location.search)).get("transparent");
if (session) {
    session.getCurrentIFrameComponent().setStyle({ transparentEffect: !!transparent, glassEffect: !transparent, cornerRadius: transparent ? 0 : 70 })
    if (!pageName) {
        session.getCurrentWindowGroup().setStyle({ dimensions: { x: 880, y: 200 } })
    }
} else {
    console.log("not supported")
}
document.documentElement.style.backgroundColor = "#FFFFFF00";

// Animation frame effect
const useAnimationFrame = (callback: any) => {
    // Use useRef for mutable variables that we want to persist
    // without triggering a re-render on their change
    const requestRef = React.useRef(null as any);
    const previousTimeRef = React.useRef(null as any);

    const animate = (time: number) => {
        if (previousTimeRef.current != undefined) {
            const deltaTime = time - previousTimeRef.current;
            callback(deltaTime)
        }
        previousTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
    }

    React.useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, []); // Make sure the effect runs only once
}

// Localstorage syncing
function loadSettingsDataFromStorage() {
    var dataString = localStorage.getItem('settingsData')
    if (dataString) {
        return JSON.parse(dataString)
    }
    return {}
}
function saveSettingsDataToStorage(data: object) {
    localStorage.setItem("settingsData", JSON.stringify(data))
}
const useSettingsData = () => {
    const [settingsData, setSettingsData] = React.useState(loadSettingsDataFromStorage());
    React.useEffect(() => {
        setSettingsData(loadSettingsDataFromStorage())
        window.addEventListener("storage", function () {
            setSettingsData(loadSettingsDataFromStorage())
        }, false);
    }, []);
    return [settingsData, setSettingsData]
}

function Time(props: { makeShadow?: boolean }) {
    const [settingsData] = useSettingsData()

    const today = new Date();
    let h = today.getHours();
    let m = today.getMinutes();
    let s = today.getSeconds();
    const [hours, setHours] = React.useState(h)
    const [minutes, setMinutes] = React.useState(m)
    const [seconds, setSeconds] = React.useState(s)

    useAnimationFrame((deltaTime: number) => {
        // Pass on a function to the setter of the state
        // to make sure we always have the latest state
        //setCount(prevCount => (prevCount + deltaTime * 0.01) % 100)

        const today = new Date();
        let h = today.getHours();
        let m = today.getMinutes();
        let s = today.getSeconds();
        setHours(h)
        setMinutes(m)
        setSeconds(s)
    })

    return <div className={'w-full text-center font-mono select-none ' + (props.makeShadow ? " absolute text-black" : " text-white")} style={props.makeShadow ? { zIndex: -1, filter: "blur(7px)", opacity: "50%" } : {}}>
        <span className=' text-sm'>{hours > 12 ? "PM" : "AM"}</span><span className='text-9xl'>{hours % 12 ? hours % 12 : 12}:{minutes < 10 ? "0" + minutes : minutes}{!settingsData.showSeconds ? "" : (":" + (seconds < 10 ? "0" + seconds : seconds))}</span>
    </div>

}


function App() {
    const [settingsData] = useSettingsData()

    React.useEffect(() => {
        (async () => {
            if (session) {
                await (await session.getCurrentWindowGroup()).setStyle({ dimensions: { x: 880, y: 200 } });
            }
        })()
    }, []);

    React.useEffect(() => {
        document.documentElement.style.backgroundColor = (settingsData.bgColor ? settingsData.bgColor : "#1155aa") + "55";
    }, [settingsData])


    return (
        <div className='w-full text-white text-center font-mono select-none'>
            {
                settingsData.disableZOffset ?
                    <Time makeShadow={false} />
                    :
                    <div>
                        <Time makeShadow={true} />
                        <SpatialIFrame src="index.html?pageName=Time&transparent=true" className="" spatialOffset={{ z: 50 }}>
                            <Time makeShadow={false} />
                        </SpatialIFrame>
                    </div>
            }


            <h1 className='w-full flex flex-row-reverse'>
                {/* <a href="#" className='w-1/3 text-md py-5'>⏲️</a>
                <a href="#" className='w-1/3 text-md py-5'>🕗</a> */}
                <a href="#" onClick={async () => {
                    if (session) {
                        var wg = await session.createWindowGroup("Plain")
                        await wg.setStyle({ dimensions: { x: 300, y: 500 } });

                        var ent = await session.createEntity()
                        ent.transform.position.x = 0
                        ent.transform.position.y = 0
                        ent.transform.position.z = 0
                        await ent.updateTransform()

                        var i = await session.createIFrameComponent(wg)
                        await i.setResolution(300, 300)
                        await i.loadURL("index.html?pageName=Settings")
                        await i.setAsRoot(true)
                        await i.setInline(true)
                        await ent.setComponent(i)

                        await ent.setParentWindowGroup(wg)
                    }
                }} className='w-1/3 text-md py-5'>⚙️</a>
            </h1>


        </div>
    )
}

function Settings() {
    const [settingsData, setSettingsData] = useSettingsData()

    React.useEffect(() => {
        document.documentElement.style.backgroundColor = (settingsData.bgColor ? settingsData.bgColor : "#1155aa") + "55";
    }, [settingsData])

    return (
        <div className='w-full text-white text-center font-mono select-none'>
            <div className='w-full text-3xl'>Settings</div>
            <div className='flex w-full justify-center'>
                <div className='text-3xl text-left w-auto p'>
                    <div className="flex flex-col ">
                        <div className="form-control w-52">
                            <label className="label cursor-pointer">
                                <span className="label-text">Show seconds</span>
                                <input type="checkbox" className="toggle" checked={settingsData.showSeconds == true}
                                    onChange={(e) => {
                                        let newSettings = { ...settingsData }
                                        newSettings.showSeconds = !newSettings.showSeconds
                                        saveSettingsDataToStorage(newSettings)
                                        setSettingsData(newSettings)
                                    }} />
                            </label>
                            <label className="label cursor-pointer">
                                <span className="label-text">Disable floating clock text</span>
                                <input type="checkbox" className="toggle" checked={settingsData.disableZOffset == true}
                                    onChange={(e) => {
                                        let newSettings = { ...settingsData }
                                        newSettings.disableZOffset = !newSettings.disableZOffset
                                        saveSettingsDataToStorage(newSettings)
                                        setSettingsData(newSettings)
                                    }} />
                            </label>
                            <label className="label cursor-pointer">
                                <span className="label-text">Color</span>
                                <input type="color" onChange={(e) => {
                                    console.log(e)
                                    let newSettings = { ...settingsData }
                                    newSettings.bgColor = e.target.value
                                    saveSettingsDataToStorage(newSettings)
                                    setSettingsData(newSettings)
                                }} />
                            </label>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

// Components map
var names = {
    "App": App,
    "Settings": Settings,
    "Time": Time,
} as { [x: string]: any }

var pageName = (new URLSearchParams(window.location.search)).get("pageName");

var MyTag = names[pageName ? pageName : "App"] as any;

// Create react root
var root = document.createElement("div")
document.body.appendChild(root)
ReactDOM.createRoot(root).render(
    <MyTag></MyTag>
)