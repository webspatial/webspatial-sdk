import Jimp = require("jimp");
import sharp = require('sharp');
import { fetchUtils } from "../utils/FetchUtils-1";
import { CustomError } from "../utils/CustomError";
import {Resvg, ResvgRenderOptions} from '@resvg/resvg-js';

export class ImageHelper{
    public static async loadImage(src:string):Promise<Jimp>{
        const response = await fetchUtils.fetch(src, {'encoding': 'binary'});
        if (response.status !== 200) {
            // throw new Error(
            //   `Failed to download icon ${iconUrl}. Responded with status ${response.status}`);
            throw new CustomError({code: 2002,
              message: `Failed to download icon. Responded with status ${response.status}`,
              // eslint-disable-next-line @typescript-eslint/camelcase
              message_staring_params: {icon_url: src, status: response.status}});
          }
      
          const contentType = response.headers.get ? response.headers.get('content-type'): response.headers['content-type'];
          if (!contentType?.startsWith('image/')) {
            // throw new Error(`Received icon "${iconUrl}" with invalid Content-Type.` +
            //     ` Responded with Content-Type "${contentType}"`);
            throw new CustomError({code: 2003,
              message: `Received icon with invalid Content-Type.` +
                   ` Responded with Content-Type "${contentType}"`,
              // eslint-disable-next-line @typescript-eslint/camelcase
              message_staring_params: {icon_url: src, contentType}});
          }
          let body;
          if (response.arrayBuffer) {
            body = await response.arrayBuffer();
          } else {
            if (['gzip', 'deflate', 'br'].includes(response.headers['content-encoding'])) {
              body = fetchUtils.decompressResponseBuffer(Buffer.from(response.data, 'binary'), response.headers['content-encoding']);
            } else {
              body = Buffer.from(response.data, 'binary');
            }
          };
      
          if (contentType.startsWith('image/svg')) {
            const textDecoder = new TextDecoder();
            try {
              body = await this.svg2img(textDecoder.decode(body));
            } catch (error) {
              // throw new Error(`Problem reading ${iconUrl}: ${error}`);
              throw new CustomError({code: 2004,
                message: `Problem reading ${src}: ${error}`,
                // eslint-disable-next-line @typescript-eslint/camelcase
                message_staring_params: {icon_url: src, error}});
            }
          }
      
          if (contentType.startsWith('image/webp')) {
            body = await this.webp2PngBuffer(body);
          }
          return await Jimp.read(Buffer.from(body))
    }

    public static async webp2PngBuffer(buffer: Buffer): Promise<Buffer> {
        return await sharp(buffer).toFormat('png').toBuffer();
    }

    public static async svg2img(svg: string): Promise<Buffer> {
        const opt = {
          fitTo: {
            mode: 'width',
            value: 1024, // Generate the SVG with 1024px width, for larger icons.
          },
        } as ResvgRenderOptions;
        const resvg = new Resvg(svg, opt);
        const pngData = resvg.render();
        const pngBuffer = pngData.asPng();
        return pngBuffer;
    }

    public static isFullyOpaque(image:Jimp):boolean{
        const pixelNum = image.getWidth() * image.getHeight();
        for(var i = 0; i < pixelNum; i++){
            const idx = i * 4 + 3;
            if(image.bitmap.data[idx] < 255){
                console.log(i, image.bitmap.data[idx])
                return false;
            }
        }
        return true;
    }
    
}