import * as http from 'http';
import * as http2 from 'http2';
import { Readable } from 'stream';

/**
 * A node.js Http request
 */
export type NodeHttpRequest = http.IncomingMessage | http2.Http2ServerRequest;

/**
 * A node.js Http response
 */
export type NodeHttpResponse = http.ServerResponse | http2.Http2ServerResponse;

/**
 * A type guard to see if a Response object is a HTTP2 response.
 */
export function isHttp2Response(response: NodeHttpResponse): response is http2.Http2ServerResponse {

  return (<http2.Http2ServerResponse> response).stream !== undefined;

}

export function sendBody(res: NodeHttpResponse | http2.Http2Stream, body: Buffer | Record<string, any> | string | null) {

  if (body === null) {
    res.end();
    return;
  } else if (typeof body === 'string') {
    res.end(body);
  } else if (body instanceof Buffer) {
    res.end(body);
  } else if (body instanceof Readable) {
    // @ts-expect-error - not sure why this line fails
    body.pipe(res);
  } else if (typeof body === 'object') {
    res.end(JSON.stringify(body));
  } else {
    throw new TypeError('Unsupported type for body: ' + typeof body);
  }

}

/**
 * The HttpCallback is the function that is passed as a request listener to
 * node.js's HTTP implementations (http, https, http2).
 */
export type HttpCallback = (req: NodeHttpRequest, res: NodeHttpResponse) => void;
