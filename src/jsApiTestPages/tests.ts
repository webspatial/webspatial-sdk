import WebSpatial from '../../lib/webSpatial'

var main = async()=>{
    const urlParams = new URLSearchParams(window.location.search);
    var page = urlParams.get("pageName")
    page = (page ? page : "default")
    await WebSpatial.log("        --------------Page loaded: "+page)

    if(page == "default"){
        await WebSpatial.log("Nothing to do")
    }else if(page == "webView"){
        await WebSpatial.log("Trying to load webview")
        var panel = await WebSpatial.createWebPanel(WebSpatial.getCurrentWindowGroup(), "http://testIP:5173/testList.html")
        await WebSpatial.updatePanelPose(WebSpatial.getCurrentWindowGroup(), panel, {x:700,y:300,z:300}, 300, 300)
        await WebSpatial.log("Create complete")
        setTimeout(async () => {
            await WebSpatial.destroyWebPanel(WebSpatial.getCurrentWindowGroup(), panel)
            await WebSpatial.log("destroy complete")
        }, 2000);
    }else if(page == "glassBackground"){
        await WebSpatial.setWebPanelStyle(WebSpatial.getCurrentWindowGroup(), WebSpatial.getCurrentWebPanel())
        document.documentElement.style.backgroundColor = "transparent";
        document.body.style.backgroundColor = "transparent"
        await WebSpatial.log("set to glass background")
    }
}
main()

