import http from 'http';
import http2 from 'http2';

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

/**
 * Takes a response body in any of the supported formats, and returns a body
 * that Node.js's http functions can accept.
 */
export function prepareBody(body: Buffer | object | string | null): Buffer|string {

  if (body === null) {
    return '';
  } else if (typeof body === 'string') {
    return body;
  } else if (body instanceof Buffer) {
    return body;
  } else if (typeof body === 'object') {
    return JSON.stringify(body);
  } else {
    throw new TypeError('Unsupported type for body: ' + typeof body);
  }

}

/**
 * The HttpCallback is the function that is passed as a request listener to
 * node.js's HTTP implementations (http, https, http2).
 */
export type HttpCallback = (req: NodeHttpRequest, res: NodeHttpResponse) => void;
