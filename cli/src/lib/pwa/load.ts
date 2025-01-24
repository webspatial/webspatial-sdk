import * as fs from 'fs';
import { fetchUtils } from '../utils/FetchUtils-1';
import { CustomError } from '../utils/CustomError';

export async function loadManifestJsonFromNet(url: String): Promise<Record<string, any>>{
    const response = await fetchUtils.fetch(url, {"encoding":"binary"});
    if(response.status !== 200){
      throw new CustomError({code: 3004, message:
        `Failed to download Web Manifest ${url}.` +
             `The response status is ${response.status}, please check the Web Manifest access address`,
      // eslint-disable-next-line @typescript-eslint/camelcase
      message_staring_params: {web_manifest_url: url, status: response.status}});
    }
    try{
      let body;
      if(response.text){
        body = await response.text();
      }
      else{
        if (['gzip', 'deflate', 'br'].includes(response.headers['content-encoding'])) {
          body = fetchUtils.decompressResponseBuffer(Buffer.from(response.data, 'binary'), response.headers['content-encoding']).toString();
        } else {
          body = Buffer.from(response.data, 'binary').toString();
        }
      }
      return JSON.parse(body.trim());
    } catch(err){
      throw new CustomError({code: 3005,
        // eslint-disable-next-line @typescript-eslint/camelcase
        message: 'Manifest file embedded in the website is not a legal JSON file, please reconfigure', message_staring_params: {}});
    }
}

export async function loadManifestJsonFromDisk(url: String): Promise<Record<string, any>>{
    const jsonString = await fs.promises.readFile(url.toString());
    return JSON.parse(jsonString.toString());
}