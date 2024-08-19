import { SpatialDiv } from "web-spatial/src/webSpatialComponents"

export function NestedDivsTest() {
    return <>
        <SpatialDiv spatialStyle={{ position: { z: 1, x: 0, y: 0 }, glassEffect: true }} style={{ width: 500, height: 300, backgroundColor: "red" }}>
            <p>Hello world A</p>
            <SpatialDiv spatialStyle={{ position: { z: 3, x: 0, y: 0 }, glassEffect: true }} style={{ width: 200, height: 100, backgroundColor: "blue" }}>
                <p>Hello world B</p>
            </SpatialDiv>
        </SpatialDiv>
    </>
}