export class WindowGroup {
  id = ""
}

export class WebPanel {
  id = ""
  windowGroupId=""
}

class RemoteCommand {
    private static requestCounter = 0
    command = "cmd"
    data = {} as any
    requestID = ++RemoteCommand.requestCounter
}
  
type WindowStyle = "Plain" | "Volumetric" | "Immersive"

class WebSpatial {
  public static eventPromises:any = {}

  static init(){
    (window as any).__SpatialWebEvent = (e:any)=>{
      var res = WebSpatial.eventPromises[e.requestID];
      if(res){
          res(e)
      }
    }
  }

  static async sendCommand(cmd: RemoteCommand) {
    var msg = JSON.stringify(cmd);
    (window as any).webkit.messageHandlers.bridge.postMessage(msg)
  }
  
  static getImmersiveWindowGroup(){
    var wg = new WindowGroup()
    wg.id = "Immersive"
    return wg
  }

  static getCurrentWindowGroup(){
    var wg = new WindowGroup()
    wg.id = "root"
    return wg
  }

  static getCurrentWebPanel(){
    var wg = new WebPanel()
    wg.id = "root"
    wg.windowGroupId = WebSpatial.getCurrentWindowGroup().id
    return wg
  }

  static async createWindowGroup(style: WindowStyle = "Plain") {
    var cmd = new RemoteCommand()
    cmd.command = "createWindowGroup"
    cmd.data.windowStyle = style

    var result = await new Promise((res,rej)=>{
      WebSpatial.eventPromises[cmd.requestID] = res
      WebSpatial.sendCommand(cmd)
    })
    var res = new WindowGroup()
    res.id = (result as any).data.createdID
    return res
  }

  static async createWebPanel(windowGroup: WindowGroup, url: string, rawHTML = "") {
    var cmd = new RemoteCommand()
    cmd.command = "createWebPanel"
    cmd.data.url = url
    cmd.data.windowGroupID = windowGroup.id
    cmd.data.rawHTML = rawHTML

    var result = await new Promise((res,rej)=>{
      WebSpatial.eventPromises[cmd.requestID] = res
      WebSpatial.sendCommand(cmd)
    })
    var res = new WebPanel()
    res.id = (result as any).data.createdID
    res.windowGroupId = windowGroup.id
    return res
  } 
   static async destroyWebPanel(windowGroup: WindowGroup, webPanel:WebPanel) {
    var cmd = new RemoteCommand()
    cmd.command = "destroyWebPanel"
    cmd.data.windowGroupID = windowGroup.id
    cmd.data.webPanelID = webPanel.id
    
    WebSpatial.sendCommand(cmd)
  }

  static async updatePanelPose(windowGroup: WindowGroup, webPanel:WebPanel, position: {x:number,y:number,z:number}, width:number, height:number) {
    var cmd = new RemoteCommand()
    cmd.command = "updatePanelPose"
    cmd.data.position = position
    cmd.data.width = width
    cmd.data.height = height
    cmd.data.windowGroupID = windowGroup.id
    cmd.data.windowID = webPanel.id

    await WebSpatial.sendCommand(cmd)
  }

  static async updatePanelContent(windowGroup: WindowGroup, webPanel:WebPanel, html: string) {
    var cmd = new RemoteCommand()
    cmd.command = "updatePanelContent"
    cmd.data.html = html
    cmd.data.windowGroupID = windowGroup.id
    cmd.data.windowID = webPanel.id

    await WebSpatial.sendCommand(cmd)
  }



  static async createMesh(windowGroup: WindowGroup, meshName:String) {
    var cmd = new RemoteCommand()
    cmd.command = "createMesh"
    cmd.data.windowGroupID = windowGroup.id
    cmd.data.windowID = meshName

    await WebSpatial.sendCommand(cmd)
  }

  static async createDOMModel(windowGroup: WindowGroup, webPanel:WebPanel, modelID: string, modelURL: string) {
    var cmd = new RemoteCommand()
    cmd.command = "createDOMModel"
    cmd.data.windowGroupID = windowGroup.id
    cmd.data.windowID = webPanel.id
    cmd.data.modelID = modelID
    cmd.data.modelURL = modelURL

    await WebSpatial.sendCommand(cmd)
  }

  static async updateDOMModelPosition(windowGroup: WindowGroup, webPanel:WebPanel, modelID: string, position: {x:number,y:number,z:number}) {
    var cmd = new RemoteCommand()
    cmd.command = "updateDOMModelPosition"
    cmd.data.windowGroupID = windowGroup.id
    cmd.data.windowID = webPanel.id
    cmd.data.modelID = modelID
    cmd.data.modelPosition = position

    await WebSpatial.sendCommand(cmd)
  }

  static async log(log: any) {
    var cmd = new RemoteCommand()
    cmd.command = "log"
    if(log !== null && log !== undefined && log.toString){
      cmd.data.logString = log.toString()
    }else if(log !== null && log !== undefined && typeof log === 'object'){
      cmd.data.logString = JSON.stringify(log)
    }else{
      cmd.data.logString = log
    }
    
    await WebSpatial.sendCommand(cmd)
  }

  static async openImmersiveSpace() {
    var cmd = new RemoteCommand()
    cmd.command = "openImmersiveSpace"
    await WebSpatial.sendCommand(cmd)
  }

  static async dismissImmersiveSpace() {
    var cmd = new RemoteCommand()
    cmd.command = "dismissImmersiveSpace"
    await WebSpatial.sendCommand(cmd)
  }

  static async resizeCompleted() {
    var cmd = new RemoteCommand()
    cmd.command = "resizeCompleted"
    await WebSpatial.sendCommand(cmd)
  }

  static onFrame(fn: any) {
    var loop = () => {
      setTimeout(() => {
        loop()
      }, 1000 / 90);
      fn(window.performance.now())
    }
    loop()

  }
}
WebSpatial.init()
if((window as any).WebSpatailEnabled){
  window.addEventListener("resize", ()=>{
    WebSpatial.resizeCompleted()
  });

  let pos = 0
  let last = 0;
  (window as any)._magicUpdate = ()=>{
    const now = Date.now();
    let dt = now - last;
    last = now
    if((dt/1000) < 1/10){
      pos += 1 * (dt/1000)
      return Math.sin(pos) * 0.3
    }else{
      return 0
    }
  }
}

export default WebSpatial