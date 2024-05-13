class RemoteCommand {
    command = "cmd"
    data = {} as any
  }
  
  type WindowStyle = "Plain" | "Volumetric" | "Immersive"
  
  class WebSpatial {
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
  
    static async createWebPanel(windowGroupID: string, windowID: string, url: string) {
      var cmd = new RemoteCommand()
      cmd.command = "createWebPanel"
      cmd.data.url = url
      cmd.data.windowGroupID = windowGroupID
      cmd.data.windowID = windowID
  
      await WebSpatial.sendCommand(cmd)
    }
  
    static async updatePanelPose(windowGroupID: string, windowID: string, x: string) {
      var cmd = new RemoteCommand()
      cmd.command = "updatePanelPose"
      cmd.data.x = x
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
  
    static async log(log: string) {
      var cmd = new RemoteCommand()
      cmd.command = "log"
      cmd.data.logString = log
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
        }, 1000 / 60);
        fn(window.performance.now())
      }
      loop()
  
    }
  }

  export default WebSpatial