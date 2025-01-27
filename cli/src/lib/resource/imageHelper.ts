import Jimp = require("jimp");
import sharp = require('sharp');
import { fetchUtils } from "../utils/FetchUtils-1";
import { CustomError } from "../utils/CustomError";
import {Resvg, ResvgRenderOptions} from '@resvg/resvg-js';

export class ImageHelper{
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