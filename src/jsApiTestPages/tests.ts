import WebSpatial from '../../lib/webSpatial'

var main = async()=>{
    const urlParams = new URLSearchParams(window.location.search);
    var page = urlParams.get("pageName")
    page = (page ? page : "default")
    await WebSpatial.log("Page loaded: "+page)

    if(page == "default"){
        await WebSpatial.log("Nothing to do")
    }else if(page == "webView"){
        await WebSpatial.log("Trying to load webview")
        var panel = await WebSpatial.createWebPanel(WebSpatial.getCurrentWindowGroup(), "http://google.com")
        await WebSpatial.updatePanelPose(WebSpatial.getCurrentWindowGroup(), panel, {x:300,y:300,z:300}, 300, 300)
        await WebSpatial.log("Create complete")
    }   
}
main()

