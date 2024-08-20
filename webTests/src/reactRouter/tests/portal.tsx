import { SpatialDiv } from "web-spatial/src/webSpatialComponents"

export function PortalTest() {
    return <>
        <div>
            <SpatialDiv spatialStyle={{ position: { z: 100, x: 0, y: 0 } }} style={{ position: "absolute", top: "45%", left: "45%", width: "10%", height: "10%", backgroundColor: "white" }}>
                <p>This is a popup</p>
            </SpatialDiv>
            <div style={{ color: "red" }}>
                <SpatialDiv spatialStyle={{ position: { z: 20, x: 0, y: 0 } }}>
                    <p>This text should be red</p>
                </SpatialDiv>
            </div>
            <SpatialDiv className='p-10' spatialStyle={{ position: { z: 50, x: 100, y: 50 } }} style={{ backgroundColor: "gray", width: "50%" }}>
                <div onClick={() => { document.body.style.backgroundColor = 'gray' }}>
                    <p>This text is inside a portal iframe</p>
                    <a href="/">click me</a>
                </div>
            </SpatialDiv>
            <div className='p-10' style={{ backgroundColor: "gray", width: "50%" }}>
                <div onClick={() => { document.body.style.backgroundColor = 'gray' }}>
                    <p>This text is inside a div notiframe</p>
                </div>
            </div>
            <div className='p-10' >
                <div onClick={() => { document.body.style.backgroundColor = 'gray' }}>
                    <p>This text is inside a div notiframe</p>
                </div>
            </div>
            <SpatialDiv className='p-10' spatialStyle={{ position: { z: 50, x: 0, y: 0 }, glassEffect: true, materialThickness: "thick" }} >
                <p> Another spatial div with a lot of text Another spatial div with a lot of text Another spatial div with a lot of text Another spatial div with a lot of text Another spatial div with a lot of text Another spatial div with a lot of text Another spatial div with a lot of text Another spatial div with a lot of text Another spatial div with a lot of text Another spatial div with a lot of text Another spatial div with a lot of text Another spatial div with a lot of text Another spatial div with a lot of text Another spatial div with a lot of text Another spatial div with a lot of text Another spatial div with a lot of text Another spatial div with a lot of text Another spatial div with a lot of text Another spatial div with a lot of text Another spatial div with a lot of text Another spatial div with a lot of text</p>
            </SpatialDiv>
        </div>

    </>
}