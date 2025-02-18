import * as fs from 'fs'
import { fetchUtils } from '../utils/FetchUtils-1'
import { CustomError } from '../utils/CustomError'
import Jimp = require('jimp')
import { ImageHelper } from './imageHelper'

export async function loadJsonFromNet(
  url: String,
): Promise<Record<string, any>> {
  const response = await fetchUtils.fetch(url, { encoding: 'binary' })
  if (response.status !== 200) {
    throw new CustomError({
      code: 3004,
      message:
        `Failed to download Web Manifest ${url}.` +
        `The response status is ${response.status}, please check the Web Manifest access address`,
      // eslint-disable-next-line @typescript-eslint/camelcase
      message_staring_params: {
        web_manifest_url: url,
        status: response.status,
      },
    })
  }
  try {
    let body
    if (response.text) {
      body = await response.text()
    } else {
      if (
        ['gzip', 'deflate', 'br'].includes(response.headers['content-encoding'])
      ) {
        body = fetchUtils
          .decompressResponseBuffer(
            Buffer.from(response.data, 'binary'),
            response.headers['content-encoding'],
          )
          .toString()
      } else {
        body = Buffer.from(response.data, 'binary').toString()
      }
    }
    return JSON.parse(body.trim())
  } catch (err) {
    throw new CustomError({
      code: 3005,
      // eslint-disable-next-line @typescript-eslint/camelcase
      message:
        'Manifest file embedded in the website is not a legal JSON file, please reconfigure',
      message_staring_params: {},
    })
  }
}

export async function loadFileString(url: String): Promise<string> {
  let file = await fs.promises.readFile(url.toString())
  return file.toString()
}

export async function loadJsonFromDisk(
  url: String,
): Promise<Record<string, any>> {
  const jsonString = await loadFileString(url)
  return JSON.parse(jsonString)
}

export async function loadImageFromNet(src: string): Promise<Jimp> {
  const response = await fetchUtils.fetch(src, { encoding: 'binary' })
  if (response.status !== 200) {
    // throw new Error(
    //   `Failed to download icon ${iconUrl}. Responded with status ${response.status}`);
    throw new CustomError({
      code: 2002,
      message: `Failed to download icon. Responded with status ${response.status}`,
      // eslint-disable-next-line @typescript-eslint/camelcase
      message_staring_params: { icon_url: src, status: response.status },
    })
  }

  const contentType = response.headers.get
    ? response.headers.get('content-type')
    : response.headers['content-type']
  if (!contentType?.startsWith('image/')) {
    // throw new Error(`Received icon "${iconUrl}" with invalid Content-Type.` +
    //     ` Responded with Content-Type "${contentType}"`);
    throw new CustomError({
      code: 2003,
      message:
        `Received icon with invalid Content-Type.` +
        ` Responded with Content-Type "${contentType}"`,
      // eslint-disable-next-line @typescript-eslint/camelcase
      message_staring_params: { icon_url: src, contentType },
    })
  }
  let body
  if (response.arrayBuffer) {
    body = await response.arrayBuffer()
  } else {
    if (
      ['gzip', 'deflate', 'br'].includes(response.headers['content-encoding'])
    ) {
      body = fetchUtils.decompressResponseBuffer(
        Buffer.from(response.data, 'binary'),
        response.headers['content-encoding'],
      )
    } else {
      body = Buffer.from(response.data, 'binary')
    }
  }

  if (contentType.startsWith('image/svg')) {
    const textDecoder = new TextDecoder()
    try {
      body = await ImageHelper.svg2img(textDecoder.decode(body))
    } catch (error) {
      // throw new Error(`Problem reading ${iconUrl}: ${error}`);
      throw new CustomError({
        code: 2004,
        message: `Problem reading ${src}: ${error}`,
        // eslint-disable-next-line @typescript-eslint/camelcase
        message_staring_params: { icon_url: src, error },
      })
    }
  }

  if (contentType.startsWith('image/webp')) {
    body = await ImageHelper.webp2PngBuffer(body)
  }
  return await Jimp.read(Buffer.from(body))
}

export async function loadImageFromDisk(src: string): Promise<Jimp> {
  return await Jimp.read(src)
}
