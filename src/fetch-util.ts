import { MemoryRequest as CurveballRequest } from './memory-request';
import { Response as CurveballResponse } from './response';
import { Headers as CurveballHeaders } from './headers';
import { PassThrough, Readable, Writable } from 'stream';

export async function fetchRequestToCurveballRequest(request: Request, origin: string): Promise<CurveballRequest<unknown>> {

  const headers = new CurveballHeaders();
  // @ts-expect-error apparently our types don't have an 'entries' on headers, but it's there!
  for(const [key, value] of request.headers.entries()) {
    headers.append(key, value);
  }

  const url = new URL(request.url);

  let relativeUrl = url.pathname;
  if (url.search) relativeUrl += '?' + url.search;

  if (!headers.has('host')) headers.set('host', url.host);

  return new CurveballRequest(
    request.method,
    relativeUrl,
    origin,
    headers,
    await request.arrayBuffer()
  );
}

export async function curveballResponseToFetchResponse(response: CurveballResponse): Promise<Response> {

  const headers = new Headers();
  for(const [key, value] of Object.entries(response.headers.getAll())) {
    if (Array.isArray(value)) {
      headers.set(key, value.join(','));
    } else {
      headers.set(key, ''+value);
    }
  }

  return new Response(await convertCurveballBody(response.body), {
    status: response.status,
    headers,
  });

}

async function convertCurveballBody(body: null | string | Buffer | Readable | Record<string, any> | ((outStream: Writable) => void)): Promise<BodyInit> {

  if (body===null) {
    return '';
  }
  if (typeof body === 'string') {
    return body;
  }
  if (body instanceof Buffer) {
    return body;
  }
  if (body instanceof Readable) {
    return readStream(body);
  }
  if (typeof body === 'object') {
    return JSON.stringify(body, undefined, 2);
  }
  if (typeof body === 'function') {
    const passThrough = new PassThrough();
    body(passThrough);
    return readStream(passThrough);
  }
  throw new TypeError('Unsupported type for body: ' + typeof body);

}


function readStream(stream: Readable): Promise<Buffer> {

  return new Promise < Buffer > ((res, rej) => {

    const buffer = Array < any > ();

    stream.on('data', chunk => buffer.push(chunk));
    stream.on('end', () => res(Buffer.concat(buffer)));
    stream.on('error', err => rej(err));

  });

}
