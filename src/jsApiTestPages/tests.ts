import { Euler, Quaternion, Vector3 } from 'three';
import WebSpatial, { SpatialEntity } from '../../lib/webSpatial'

var main = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    var page = urlParams.get("pageName")
    page = (page ? page : "default")
    await WebSpatial.log("        --------------Page loaded: " + page)

    if (page == "default") {
        await WebSpatial.log("Nothing to do")
    } else if (page == "webView") {
        await WebSpatial.log("Trying to load webview")
        var panel = await WebSpatial.createWebPanel(WebSpatial.getCurrentWindowGroup(), "http://testIP:5173/testList.html")
        await WebSpatial.updatePanelPose(WebSpatial.getCurrentWindowGroup(), panel, { x: 700, y: 300, z: 300 }, 300, 300)
        await WebSpatial.log("Create complete")
        setTimeout(async () => {
            await WebSpatial.destroyWebPanel(WebSpatial.getCurrentWindowGroup(), panel)
            await WebSpatial.log("destroy complete")
        }, 2000);
    } else if (page == "glassBackground") {
        await WebSpatial.setWebPanelStyle(WebSpatial.getCurrentWindowGroup(), WebSpatial.getCurrentWebPanel())
        document.documentElement.style.backgroundColor = "transparent";
        document.body.style.backgroundColor = "transparent"
        await WebSpatial.log("set to glass background")
    } else if (page == "model") {
        WebSpatial.log("create entity")


        var entities = new Array<{ e: SpatialEntity, v: number }>()

        for (var i = 0; i < 7; i++) {
            let entity = await WebSpatial.createEntity();
            entity.position.x = -0.35 + (i * 0.1)
            entity.position.z = 0.2 + 0.00001 * i
            entity.scale = { x: 0.07, y: 0.07, z: 0.07 }
            WebSpatial.updateEntityPose(entity)

            let mesh = await WebSpatial.createResource("MeshResource", { shape: Math.random() < 0.3 ? "sphere" : "box" });
            let material = await WebSpatial.createResource("PhysicallyBasedMaterial");
            material.data.baseColor = { r: Math.random(), g: Math.random() * 0.3, b: Math.random() * 0.3, a: 1.0 }
            material.data.metallic = { value: Math.random() * 0.3 }
            material.data.roughness = { value: Math.random() }
            WebSpatial.updateResource(material)
            let modelComponent = await WebSpatial.createResource("ModelComponent");
            modelComponent.data.meshResource = mesh.id
            modelComponent.data.materials = [material.id]
            WebSpatial.updateResource(modelComponent)

            WebSpatial.setComponent(entity, modelComponent)
            entities.push({ e: entity, v: 0 })
        }

        var b = document.createElement("button")
        b.innerHTML = "Click me"
        document.body.appendChild(b)

        b.onclick = () => {
            for (var i = 0; i < entities.length; i++) {
                entities[i].v = Math.sqrt((i + 40) * 0.035)
            }
        }

        var q = new Quaternion()

        WebSpatial.onFrame((time: number, dt: number) => {
            var floor = -0.10
            for (var i = 0; i < entities.length; i++) {
                var entity = entities[i].e
                entities[i].v -= 5 * (dt / 1000)
                entity.position.y += (dt / 1000) * entities[i].v
                if (entity.position.y < floor) {
                    entity.position.y = floor
                    entities[i].v = -entities[i].v * 0.5
                }
                q.setFromEuler(new Euler(0, time / 1000, 0))
                entity.orientation.x = q.x
                entity.orientation.y = q.y
                entity.orientation.z = q.z
                entity.orientation.w = q.w
                WebSpatial.updateEntityPose(entity)
            }

        })
        WebSpatial.log("entity created")
    } else if (page == "pingNativePerf") {
        WebSpatial.log("Attempt ping start")
        var startTime = Date.now()
        var pingCount = 100
        var charCount = 10000;
        var str = ''
        for (let i = 0; i < charCount; i++) {
            str += 'x'
        }
        for (let i = 0; i < pingCount; i++) {
            await WebSpatial.ping(str)
        }
        var delta = Date.now() - startTime;
        let b = document.createElement("h1")
        b.innerHTML = "Average ping time: " + (delta / pingCount) + "ms"
        document.body.appendChild(b)
        WebSpatial.log("Got response")
    }
}
main()

