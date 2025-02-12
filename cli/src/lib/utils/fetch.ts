import {context, Response as FetchH2Response} from 'fetch-h2';
import * as fs from 'fs';
import * as zlib from 'zlib';

export type NodeFetchOrFetchH2Response = FetchH2Response;
// const userAgent = 'Mozilla/5.0 (X11; Linux x86_64; rv:60.0) Gecko/20100101 Firefox/81.0';
const userAgent = 'Mozilla/5.0 (X11; Linux x86_64; PICO 4 OS5.5.0 like Quest) AppleWebKit/537.36 (KHTML, like Gecko) PicoBrowser/3.3.24 Chrome/105.0.5195.68 VR Safari/537.36  OculusBrowser/7.0';
const fetchh2Ctx = context({userAgent: userAgent, overwriteUserAgent: true});
const fetchh2 = fetchh2Ctx.fetch;

export async function fetch(input: string, headers?: any): Promise<NodeFetchOrFetchH2Response> {
    return await fetchh2(input, headers ? {redirect: 'follow', ...headers}:{redirect: 'follow'});
}
export async function downloadFile(
  url: string,
  path: string,
  progressCallback?: (current: number, total: number) => void,
): Promise<void> {
  let result;
  let readableStream: NodeJS.ReadableStream;

  result = await fetchh2(url, {redirect: 'follow'});
  readableStream = await result.readable();

  // Try to determine the file size via the `Content-Length` header. This may not be available
  // for all cases.
  const contentLength = result.headers.get('Content-Length');
  const fileSize = contentLength ? parseInt(contentLength) : -1;

  const fileStream = fs.createWriteStream(path);
  let received = 0;

  await new Promise<void>((resolve, reject)=>{
    readableStream.pipe(fileStream);

    // Even though we're piping the chunks, we intercept them to check for the download progress.
    if (progressCallback) {
      readableStream.on('data', (chunk) => {
        received = received + chunk.length;
        progressCallback(received, fileSize);
      });
    }

    readableStream.on('error', (err) => {
      reject(err);
    });

    fileStream.on('finish', () => {
      resolve();
    });
  });
}

export function decompressResponseBuffer(buffer: Buffer, contentEncoding: 'gzip' | 'deflate'| 'br' ): Buffer {
  let result: Buffer = buffer;
  if (/\bgzip\b/.test(contentEncoding) || /\bdeflate\b/.test(contentEncoding)) {
    result = zlib.unzipSync(buffer, {
      flush: zlib.constants.Z_SYNC_FLUSH,
      finishFlush: zlib.constants.Z_SYNC_FLUSH,
    });
  } else if (/\bbr\b/.test(contentEncoding)) {
    result = zlib.brotliDecompressSync(buffer);
  }
  return result;
}