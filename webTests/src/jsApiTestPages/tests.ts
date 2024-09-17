import { Euler, Quaternion, Vector3 } from 'three';
import { Spatial, SpatialEntity } from "web-spatial"


var main = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    var page = urlParams.get("pageName")
    page = (page ? page : "default")

    var spatial = new Spatial()
    let session = await spatial.requestSession()
    await session.log("        --------------Page loaded: " + page)

    if (page == "default") {
        await session.log("Nothing to do")
    } else if (page == "webView") {
        await session.log("Trying to load webview")

        {
            var e = await session.createEntity()
            e.transform.position.x = 500
            e.transform.position.y = 300
            e.transform.position.z = 300

            var wc = (await session.getCurrentWindowComponent())
            var ent = await wc.getEntity()
            await e.setParent(ent!)

            await e.updateTransform()
            let i = await session.createWindowComponent()
            await Promise.all([
                i.loadURL("/src/embed/basic.html"),
                i.setScrollEnabled(false),
                e.setCoordinateSpace("Dom"),
                i.setResolution(300, 300),
            ])
            await e.setComponent(i)

            var loop = (time: DOMHighResTimeStamp) => {
                if (e.isDestroyed()) {
                    return
                }
                session.requestAnimationFrame(loop)
                e.transform.position.x = 500 + Math.sin(time / 1000) * 200
                e.updateTransform()
            }
            session.requestAnimationFrame(loop)


            setTimeout(async () => {
                await e.destroy()
                await i.destroy()
                await session.log("destroy complete")
            }, 5000);


            return
        }
    } else if (page == "glassBackground") {
        await (await session.getCurrentWindowComponent()).setStyle({ glassEffect: true, cornerRadius: 50 })
        // await WebSpatial.setWebPanelStyle(WebSpatial.getCurrentWindowGroup(), WebSpatial.getCurrentWebPanel())
        document.documentElement.style.backgroundColor = "transparent";
        document.body.style.backgroundColor = "transparent"
        await session.log("set to glass background")
    } else if (page == "modelUI") {
        var e = await session.createEntity()
        e.transform.position.x = 500
        e.transform.position.y = 300
        e.transform.position.z = 50
        await e.updateTransform()

        var wc = (await session.getCurrentWindowComponent())
        var ent = await wc.getEntity()
        await e.setParent(ent!)

        let i = await session.createModelUIComponent()
        await Promise.all([
            i.setURL("/src/assets/FlightHelmet.usdz"), // 
            i.setResolution(200, 200),
            e.setComponent(i)
        ])
    } else if (page == "model") {
        session.log("create entitys")

        {
            var entities = new Array<{ e: SpatialEntity, v: number }>()

            var box = await session.createMeshResource({ shape: "box" })
            var model = await session.createModelComponent({ url: "/src/assets/FlightHelmet.usdz" })

            for (var i = 0; i < 7; i++) {
                var e = await session.createEntity()
                e.transform.position = new DOMPoint(-0.35 + (i * 0.1), 0, 0.2 + 0.00001 * i)
                e.transform.scale = new DOMPoint(0.07, 0.07, 0.07)
                await e.updateTransform()

                if (i == 3) {
                    await e.setComponent(model)
                } else {
                    var mat = await session.createPhysicallyBasedMaterial()
                    mat.baseColor.r = Math.random()
                    await mat.update()
                    var customModel = await session.createModelComponent()
                    customModel.setMaterials([mat])
                    customModel.setMesh(box)
                    await e.setComponent(customModel)
                }
                await e.setParentWindowGroup(await session.getCurrentWindowGroup())
                entities.push({ e: e, v: 0 })
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

            var dt = 0
            var curTime = Date.now()
            var loop = (time: DOMHighResTimeStamp) => {
                session.requestAnimationFrame(loop)
                dt = Date.now() - curTime
                curTime = Date.now()
                var floor = -0.10
                for (var i = 0; i < entities.length; i++) {
                    var entity = entities[i].e
                    entities[i].v -= 5 * (dt / 1000)
                    entity.transform.position.y += (dt / 1000) * entities[i].v
                    if (entity.transform.position.y < floor) {
                        entity.transform.position.y = floor
                        entities[i].v = -entities[i].v * 0.5
                    }
                    q.setFromEuler(new Euler(0, time / 1000, 0))
                    entity.transform.orientation.x = q.x
                    entity.transform.orientation.y = q.y
                    entity.transform.orientation.z = q.z
                    entity.transform.orientation.w = q.w
                    entity.transform.scale.y = (Math.pow(((Math.sin(time / 100) + 1) / 2), 5) * 0.02) + 0.07 // 0.07 * (Math.abs((entities[i].v / 2)) + 1)
                    entity.updateTransform()
                }
            }
            session.requestAnimationFrame(loop)


            session.log("entity created")
            return
        }



    } else if (page == "pingNativePerf") {
        session.log("Attempt ping start.")
        var pingCount = 200

        // Initialize message
        var charCount = 300;
        var str = ''
        for (let i = 0; i < charCount; i++) {
            str += 'x'
        }

        let b = document.createElement("h1")
        document.body.appendChild(b)

        var counter = 0
        let loop = async (time: DOMHighResTimeStamp) => {
            var results = "Updates per frame: " + pingCount + "<br>"

            // With transactions
            var startTime = Date.now()
            await session.transaction(() => {
                for (let i = 0; i < pingCount; i++) {
                    session.ping(str)
                }
            })
            var delta = Date.now() - startTime;
            results += "[With transactions]<br> Average ping time: " + (delta / pingCount).toFixed(3) + "ms\nTotal time: " + (delta).toFixed(3) + "ms Counter:" + (counter++) + "<br><br>\n\n"


            // Without transactions
            var startTime = Date.now()
            for (let i = 0; i < pingCount; i++) {
                if (i == pingCount - 1) {
                    await session.ping(str)
                } else {
                    session.ping(str)
                }
            }
            var delta = Date.now() - startTime;
            results += "[Without transactions]<br> Average ping time: " + (delta / pingCount) + "ms\nTotal time: " + (delta) + "ms Counter:" + (counter++) + "\n"

            // Populate results and request animation frame
            b.innerHTML = results
            session.requestAnimationFrame(loop)
        }
        session.requestAnimationFrame(loop)

        session.log("Got response")
    } else if (page == "winodwInnerHTML") {
        if (!spatial.isSupported()) {
            return
        }

        for (let j = 0; j < 2; j++) {
            let x = window.open()

            if (x) {
                await session.log("load complete")

                x.document.body.innerHTML = "Hello World"

                x.document.onclick = () => {
                    window.document.body.style.backgroundColor = "yellow"
                }

                let e = await session.createEntity()
                e.transform.position.x = 500
                e.transform.position.y = 300
                e.transform.position.z = 300

                var wc = (await session.getCurrentWindowComponent())
                var ent = await wc.getEntity()
                await e.setParent(ent!)

                await e.updateTransform()
                let i = await session.createWindowComponent()
                x.document.documentElement.style.backgroundColor = "transparent";
                x.document.documentElement.style.color = "white"
                x.document.documentElement.style.fontSize = "5em"
                await i.setStyle({ transparentEffect: true, glassEffect: false, cornerRadius: 0 })
                await Promise.all([
                    i.setFromWindow(x),
                    i.setScrollEnabled(false),
                    e.setCoordinateSpace("Dom"),
                    i.setResolution(300, 300),
                ])
                await e.setComponent(i)

                let offset = j


                e.transform.position.x = (500 + Math.sin(0 / 1000) * 200) + (offset * 200)
                e.updateTransform()
            }
        }
    } else if (page == "getStats") {
        let b = document.createElement("code")
        b.style.whiteSpace = "pre-wrap"
        b.style.fontSize = "1em"
        b.innerHTML = "LOADING"
        document.body.appendChild(b)
        var d = await session.getStats()
        b.innerHTML = "// webviewRefs should be 1\n" + JSON.stringify(d, null, 4)
    }
}
main()

