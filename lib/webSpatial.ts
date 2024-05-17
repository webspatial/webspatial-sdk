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
  static async createWindowGroup(windowGroupID: string, style: WindowStyle = "Plain") {
    var cmd = new RemoteCommand()
    cmd.command = "createWindowGroup"
    cmd.data.windowStyle = style
    cmd.data.windowGroupID = windowGroupID

    await WebSpatial.sendCommand(cmd)
  }

  static async createWebPanel(windowGroupID: string, windowID: string, url: string, rawHTML = "") {
    var cmd = new RemoteCommand()
    cmd.command = "createWebPanel"
    cmd.data.url = url
    cmd.data.windowGroupID = windowGroupID
    cmd.data.windowID = windowID
    cmd.data.rawHTML = rawHTML

    await new Promise((res,rej)=>{
      WebSpatial.eventPromises[cmd.requestID] = res
      WebSpatial.sendCommand(cmd)
    })
  }

  static async updatePanelPose(windowGroupID: string, windowID: string, position: {x:number,y:number,z:number}, width:number, height:number) {
    var cmd = new RemoteCommand()
    cmd.command = "updatePanelPose"
    cmd.data.position = position
    cmd.data.width = width
    cmd.data.height = height
    cmd.data.windowGroupID = windowGroupID
    cmd.data.windowID = windowID

    await WebSpatial.sendCommand(cmd)
  }

  static async updatePanelContent(windowGroupID: string, windowID: string, html: string) {
    var cmd = new RemoteCommand()
    cmd.command = "updatePanelContent"
    cmd.data.html = html
    cmd.data.windowGroupID = windowGroupID
    cmd.data.windowID = windowID

    await WebSpatial.sendCommand(cmd)
  }



  static async createMesh(windowGroupID: string, windowID: string) {
    var cmd = new RemoteCommand()
    cmd.command = "createMesh"
    cmd.data.windowGroupID = windowGroupID
    cmd.data.windowID = windowID

    await WebSpatial.sendCommand(cmd)
  }

  static async createDOMModel(windowGroupID: string, windowID: string, modelID: string, modelURL: string) {
    var cmd = new RemoteCommand()
    cmd.command = "createDOMModel"
    cmd.data.windowGroupID = windowGroupID
    cmd.data.windowID = windowID
    cmd.data.modelID = modelID
    cmd.data.modelURL = modelURL

    await WebSpatial.sendCommand(cmd)
  }

  static async updateDOMModelPosition(windowGroupID: string, windowID: string, modelID: string, position: {x:number,y:number,z:number}) {
    var cmd = new RemoteCommand()
    cmd.command = "updateDOMModelPosition"
    cmd.data.windowGroupID = windowGroupID
    cmd.data.windowID = windowID
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
export default WebSpatial