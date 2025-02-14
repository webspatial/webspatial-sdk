import { join } from 'path'
import { PWAGenerator } from '.'
import { CustomError } from '../utils/CustomError'
import { parseRouter } from '../utils/utils'
import { ImageHelper } from '../resource/imageHelper'
import { loadImageFromDisk, loadImageFromNet } from '../resource/load'

export function checkManifestJson(manifestJson: Record<string, any>) {
  const errors = []
  if (!manifestJson.name && !manifestJson['short_name']) {
    errors.push({
      code: 3006,
      message:
        'In the Spatial Web App Manifest, it is necessary to provide the name property or short_name property (preferably both)',
      // eslint-disable-next-line @typescript-eslint/camelcase
      message_staring_params: {},
    })
  }
  if (!manifestJson.icons?.length) {
    errors.push({
      code: 3007,
      message:
        'In the Spatial Web App Manifest, the icons property must be provided and it should include at least one icon object',
      // eslint-disable-next-line @typescript-eslint/camelcase
      message_staring_params: {},
    })
  }
  if (!manifestJson['start_url']) {
    errors.push({
      code: 3008,
      message:
        'In the Spatial Web App Manifest, the start_url property must be provided',
      // eslint-disable-next-line @typescript-eslint/camelcase
      message_staring_params: {},
    })
  }
  if (!PWAGenerator.DisplayModes.includes(manifestJson.display)) {
    errors.push({
      code: 3009,
      message:
        'In the Spatial Web App Manifest, the display property must be provided, and its value' +
        ` can only be one of "minimal-ui" or "standalone" (your current configuration is ${manifestJson.display})`,
      // eslint-disable-next-line @typescript-eslint/camelcase
      message_staring_params: { display: manifestJson.display },
    })
  }
  if (errors.length) {
    throw new CustomError(errors)
  }
}

export function checkStartUrl(
  manifest: Record<string, any>,
  manifestUrl: string,
  isNet: boolean,
) {
  if (isNet) {
    // 判断是否与manifest同源
    // Determine whether it is of the same origin as the manifest
    if (manifest.start_url.indexOf('https://') == 0) {
      const urlStart: URL = new URL(manifest.start_url)
      const urlManifest: URL = new URL(manifestUrl)
      // start_url 与 manifest 需要同源
      if (urlStart.host !== urlManifest.host) {
        throw new CustomError({
          code: 4000,
          // eslint-disable-next-line @typescript-eslint/camelcase
          message:
            'In the Web App Manifest, the start_url must be the same origin with manifest',
          message_staring_params: {},
        })
      }
    }
    // Start_url must be HTTPS protocol
    else if (manifest.start_url.indexOf('http://') == 0) {
      throw new CustomError({
        code: 4000,
        // eslint-disable-next-line @typescript-eslint/camelcase
        message: 'In the Web App Manifest, the start_url must use https',
        message_staring_params: {},
      })
    }
  }
}

export async function checkIcons(
  manifest: Record<string, any>,
  manifestUrl: string,
) {
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
    throw new CustomError({
      code: 4000,
      // eslint-disable-next-line @typescript-eslint/camelcase
      message:
        'In the Spatial Web App on VisionPro, the icon must be greater than or equal to 1024x1024, and the purpose parameter must include maskable',
      message_staring_params: {},
    })
  } else if (maxSizeImageUrl) {
    maxSizeImage = !maxSizeImageUrl.startsWith('http')
      ? await loadImageFromDisk(maxSizeImageUrl)
      : await loadImageFromNet(maxSizeImageUrl)
  }
  // Check if the image is completely opaque
  if (maxSizeImage && !ImageHelper.isFullyOpaque(maxSizeImage)) {
    throw new CustomError({
      code: 4000,
      // eslint-disable-next-line @typescript-eslint/camelcase
      message:
        'In the Spatial Web App on VisionPro, must be a fully opaque bitmap.',
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

export function validateURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch (error) {
    return false
  }
}
