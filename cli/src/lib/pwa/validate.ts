import { join } from 'path'
import { PWAGenerator } from '.'
import { CustomError } from '../utils/CustomError'
import { parseRouter } from '../utils/utils'
import { ImageHelper } from '../resource/imageHelper'
import { loadImageFromDisk, loadImageFromNet } from '../resource/load'
import { Cli } from '../Cli'

export function checkManifestJson(
  manifestJson: Record<string, any>,
  isDev: boolean = false,
) {
  const errors = []
  if (!manifestJson.name && !manifestJson['short_name'] && !isDev) {
    errors.push({
      code: 3006,
      message:
        'In the Web Spatial App Manifest, it is necessary to provide the name property or short_name property (preferably both)',
      // eslint-disable-next-line @typescript-eslint/camelcase
      message_staring_params: {},
    })
  }
  if (!manifestJson.icons?.length && !isDev) {
    errors.push({
      code: 3007,
      message:
        'In the Web Spatial App Manifest, the icons property must be provided and it should include at least one icon object',
      // eslint-disable-next-line @typescript-eslint/camelcase
      message_staring_params: {},
    })
  }
  if (!manifestJson['start_url']) {
    errors.push({
      code: 3008,
      message:
        'In the Web Spatial App Manifest, the start_url property must be provided',
      // eslint-disable-next-line @typescript-eslint/camelcase
      message_staring_params: {},
    })
  }
  if (errors.length) {
    throw new CustomError(errors)
  }
}

export function checkStartUrl(
  startUrl: string,
  manifestUrl: string,
  isNet: boolean,
  isDev: boolean = false,
): boolean {
  var isNetWeb = false
  if (isDev) {
    return startUrl.startsWith('https://') || startUrl.startsWith('http://')
  }
  if (isNet) {
    // Determine whether it is of the same origin as the manifest
    if (startUrl.startsWith('https://')) {
      const urlStart: URL = new URL(startUrl)
      const urlManifest: URL = new URL(manifestUrl)
      // The start_url and manifest need to be of the same origin
      if (urlStart.host !== urlManifest.host) {
        throw new CustomError({
          code: 4000,
          // eslint-disable-next-line @typescript-eslint/camelcase
          message:
            'In the WebSpatial App Manifest, the start_url must be the same origin with manifest',
          message_staring_params: {},
        })
      }
    }
    // Start_url must be HTTPS protocol
    else if (startUrl.startsWith('http://')) {
      throw new CustomError({
        code: 4000,
        // eslint-disable-next-line @typescript-eslint/camelcase
        message:
          'In the Web Spatial App Manifest, the start_url must use https',
        message_staring_params: {},
      })
    }
  } else {
    if (startUrl.startsWith('https://') || startUrl.startsWith('http://')) {
      throw new CustomError({
        code: 4000,
        // eslint-disable-next-line @typescript-eslint/camelcase
        message: 'Local manifest cannot package network project',
        message_staring_params: {},
      })
    }
  }
  return isNetWeb
}

export async function checkIcons(
  manifest: Record<string, any>,
  manifestUrl: string,
  isDev: boolean = false,
) {
  if (!manifest.icons?.length && isDev) {
    Cli.log.warn('icon not found, use default in run mode')
    return
  }
  const relativeUrl = parseRouter(manifestUrl)
  let maxSizeImage
  let maxSizeImageUrl
  let maxSizePurpose
  let maxSize = 0
  for (var i = 0; i < manifest.icons.length; i++) {
    const item = manifest.icons[i]
    let hasMaskable = item.purpose?.indexOf('maskable') >= 0
    if (!hasMaskable) continue
    let has1024 = false
    let imgUrl = item.src
    let image
    let imageSize = 0
    if (!validateURL(imgUrl)) {
      imgUrl = join(relativeUrl, imgUrl)
    }
    // If size has been configured, determine the size; otherwise, download the icon for judgment
    if (item.sizes) {
      const mulSize = item.sizes.split(' ')
      mulSize.forEach((size: string) => {
        let wh = size.split('x')
        if (Number(wh[0]) >= 1024 && Number(wh[1]) >= 1024) {
          has1024 = true
          if (Number(wh[0]) > imageSize) {
            imageSize = Number(wh[0])
          }
        }
      })
    } else {
      image = !imgUrl.startsWith('http')
        ? await loadImageFromDisk(imgUrl)
        : await loadImageFromNet(imgUrl)
      if (image.getWidth() >= 1024 && image.getHeight() >= 1024) {
        has1024 = true
        if (image.getWidth() > imageSize) {
          imageSize = image.getWidth()
        }
      }
    }

    // Download all the icons used, check their width and height, and if they meet the size and maskability requirements, finally check their alpha
    if (has1024 && hasMaskable) {
      if (imageSize > maxSize) {
        maxSize = imageSize
        maxSizeImage = image
        maxSizeImageUrl = imgUrl
        maxSizePurpose = item.purpose
      }
    }
  }
  // There is no icon that satisfies both size>=1024 and purpose including Maskable
  if (maxSize === 0) {
    if (isDev) {
      Cli.log.warn(
        'In the Web Spatial App on VisionPro, the icon must be greater than or equal to 1024x1024, and the purpose parameter must include maskable',
      )
      return
    }
    throw new CustomError({
      code: 4000,
      // eslint-disable-next-line @typescript-eslint/camelcase
      message:
        'In the Web Spatial App on VisionPro, the icon must be greater than or equal to 1024x1024, and the purpose parameter must include maskable',
      message_staring_params: {},
    })
  } else if (maxSizeImageUrl) {
    maxSizeImage = !maxSizeImageUrl.startsWith('http')
      ? await loadImageFromDisk(maxSizeImageUrl)
      : await loadImageFromNet(maxSizeImageUrl)
  }
  // Check if the image is completely opaque
  if (maxSizeImage && !ImageHelper.isFullyOpaque(maxSizeImage)) {
    if (isDev) {
      Cli.log.warn(
        'In the Web Spatial App on VisionPro, the icon must be greater than or equal to 1024x1024, and the purpose parameter must include maskable',
      )
      return
    }
    throw new CustomError({
      code: 4000,
      // eslint-disable-next-line @typescript-eslint/camelcase
      message:
        'In the Web Spatial App on VisionPro, must be a fully opaque bitmap.',
      message_staring_params: {},
    })
  }
  manifest.icons = [
    {
      src: maxSizeImageUrl,
      sizes: maxSize + 'x' + maxSize,
      purpose: maxSizePurpose,
    },
  ]
}

export function checkId(manifest: Record<string, any>, bundleId: string) {
  if (bundleId) {
    if (!validateBundleId(bundleId)) {
      throw new CustomError({
        code: 4000,
        // eslint-disable-next-line @typescript-eslint/camelcase
        message:
          'In the Web Spatial App Manifest, the bundle ID must be in reverse domain format (e.g. com.example.app) and no longer than 128 characters',
        message_staring_params: {},
      })
    }
    return
  }
  if (!manifest.id) {
    manifest.id = manifest.start_url
  }
  if (!validateURL(manifest.id) && !bundleId) {
    throw new CustomError({
      code: 4000,
      // eslint-disable-next-line @typescript-eslint/camelcase
      message:
        'In the Web Spatial App Manifest, the id or start_url must be a valid URL, or provide it use --bundle-id',
      message_staring_params: {},
    })
  }
}

export function validateBundleId(bundleId: string): boolean {
  // iOS official specification regex (supports reverse domain name format validation)
  // 1. Allowed: letters/numbers/hyphens/underscores/dots
  // 2. Disallow: consecutive dots/leading or trailing dots
  // 3. Each part starts with a letter or underscore
  // 4. Total length 1-128 characters
  const iosBundleIdRegex =
    /^(?=.{1,128}$)(?!.*\.\.)(?!^\.|.*\.$)[A-Za-z_][A-Za-z0-9_-]*(?:\.[A-Za-z_][A-Za-z0-9_-]*)+$/
  return iosBundleIdRegex.test(bundleId)
}

export function validateURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch (error) {
    return false
  }
}
