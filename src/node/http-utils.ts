import * as http from 'node:http';
import * as http2 from 'node:http2';
import { Readable, Writable } from 'node:stream';
import { NodeRequest as CurveballNodeRequest } from './request.js';
import { NodeResponse as CurveballNodeResponse } from './response.js';
import { isHttpError } from '@curveball/http-errors';
import {
  Application,
  Body,
  Context,
} from '@curveball/kernel';

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

  return (response as http2.Http2ServerResponse).stream !== undefined;

}

/**
 * Returns a callback that can be used with Node's http.Server, http2.Server, https.Server.
 *
 * Normally you want to pass this to the constructor of each of these classes.
 */
export function nodeHttpServerCallback(app: Application): HttpCallback {

  return async (
    req: NodeHttpRequest,
    res: NodeHttpResponse
  ): Promise<void> => {
    try {
      const ctx = createContextFromNode(req, res, app.origin);
      await app.handle(ctx);
      sendBody(res, ctx.response.body as any);
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error(err);

      if (isHttpError(err)) {
        res.statusCode = err.httpStatus;
      } else {
        res.statusCode = 500;
      }
      res.setHeader('Content-Type', 'text/plain');
      res.end(
        'Uncaught exception. No middleware was defined to handle it. We got the following HTTP status: ' +
        res.statusCode
      );

      if (app.listenerCount('error')) {
        app.emit('error', err);
      }
    }
  };

}

/**
 * Emits a 'body' from a Curveball response to a Node HTTP stream/socket
 */
export function sendBody(res: NodeHttpResponse | http2.Http2Stream, body: Body): void {

  if (body === null) {
    res.end();
    return;
  } else if (typeof body === 'string') {
    res.end(body);
  } else if (body instanceof Buffer) {
    res.end(body);
  } else if (body instanceof Readable) {
    body.pipe(res as Writable);
  } else if (typeof body === 'object') {
    res.end(JSON.stringify(body, null , 2));
  } else if (typeof body === 'function') {
    body(res as Writable);
  } else {
    throw new TypeError('Unsupported type for body: ' + typeof body);
  }

}


/**
 * This function takes the request and response objects from a Node http,
 * https or http2 server and returns a curveball compatible Context.
 */
export function createContextFromNode(req: NodeHttpRequest, res: NodeHttpResponse, origin:string) {
  const context = new Context(
    new CurveballNodeRequest(req, origin),
    new CurveballNodeResponse(res, origin)
  );
  return context;
}



/**
 * The HttpCallback is the function that is passed as a request listener to
 * node.js's HTTP implementations (http, https, http2).
 */
export type HttpCallback = (req: NodeHttpRequest, res: NodeHttpResponse) => void;
