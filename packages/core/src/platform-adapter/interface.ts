import type { SpatialSceneCreationOptionsInternal } from '../types/internal'
import type { AttachmentEntityOptions } from '../types/types'

export interface CommandResult<TData = any> {
  success: boolean
  data: TData
  errorCode: string | undefined
  errorMessage: string | undefined
}

export type WebSpatialProtocolResult = CommandResult<
  | {
      // Platform-dependent window proxy shape:
      // - browser WindowProxy (visionOS/PICO)
      // - puppeteer simulated window object
      // Keep broad to avoid over-constraining platform adapters/callers.
      windowProxy: any
      id: string
    }
  | undefined
>

/**
 * Host/runtime bridge: JSB plus explicit spatial host capabilities.
 * Implementations may use webspatial://, iframes, native events, etc.
 */
export interface PlatformAbility {
  callJSB(cmd: string, msg: string): Promise<CommandResult>

  /**
   * Open a spatial scene synchronously (e.g. window.open polyfill).
   * Implementations may use webspatial://createSpatialScene under the hood.
   */
  openSpatialSceneSync(
    url: string,
    config: SpatialSceneCreationOptionsInternal | undefined,
    target?: string,
    features?: string,
  ): WebSpatialProtocolResult

  /** Create a native-backed spatial 2D surface (spatial div). */
  createNativeSpatialDiv(): Promise<WebSpatialProtocolResult>

  /** Create a native attachment surface; options reserved for future protocol fields. */
  createNativeAttachment(
    options?: AttachmentEntityOptions,
  ): Promise<WebSpatialProtocolResult>
}
