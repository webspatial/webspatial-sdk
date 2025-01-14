import { WebSpatial } from './private/WebSpatial'
import { WindowGroupOptions } from './types'
// Define types for scene configuration and scene data
type Config = WindowGroupOptions
type SceneShape = {
  name: string
  close: () => void
}
export class XRApp {
  /**
   * Get the scene config for a specific scene
   *
   */

  static async getSceneConfig(): Promise<Config[] | null>
  /**
   * Get all configs
   *
   */
  static async getSceneConfig(sceneName: string): Promise<Config | null>
  static async getSceneConfig(
    sceneName?: string,
  ): Promise<Config | Config[] | null> {
    const response = (await WebSpatial.getSceneConfig(sceneName)) as any
    return response?.data
  }

  /**
   * Set the scene config for a specific scene
   *
   */

  static async setSceneConfig(
    sceneName: string,
    cb: (arg?: Config) => Config,
  ): Promise<boolean> {
    try {
      const pre = (await WebSpatial.getSceneConfig(sceneName)) as Config
      const next = cb(pre)
      await WebSpatial.setSceneConfig(sceneName, next)
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }

  /**
   * Remove the scene config for a specific scene
   *
   */
  static async removeSceneConfig(sceneName: string): Promise<boolean> {
    try {
      await WebSpatial.removeSceneConfig(sceneName)
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }
}
