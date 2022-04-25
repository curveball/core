import { isHttpError } from '@curveball/http-errors';
import { EventEmitter } from 'events';
import * as http from 'http';
import { Context } from './context';
import { HeadersInterface, HeadersObject } from './headers';
import MemoryRequest from './memory-request';
import MemoryResponse from './memory-response';
import NotFoundMw from './middleware/not-found';
import {
  HttpCallback,
  NodeHttpRequest,
  NodeHttpResponse,
  sendBody
} from './node/http-utils';
import NodeRequest from './node/request';
import NodeResponse from './node/response';
import Request from './request';
import Response from './response';
import * as WebSocket from 'ws';
import * as net from 'net';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('../package.json');

/**
 * The middleware-call Symbol is a special symbol that might exist as a
 * property on an object.
 *
 * If it exists, the object can be used as a middleware.
 */
const middlewareCall = Symbol('middleware-call');
export { middlewareCall };

/**
 * A function that can act as a middleware.
 */
type MiddlewareFunction = (
  ctx: Context,
  next: () => Promise<void>
) => Promise<void> | void;

type MiddlewareObject = {
  [middlewareCall]: MiddlewareFunction;
};

export type Middleware = MiddlewareFunction | MiddlewareObject;

// Calls a series of middlewares, in order.
export async function invokeMiddlewares(
  ctx: Context,
  fns: Middleware[]
): Promise<void> {
  if (fns.length === 0) {
    return;
  }

  const mw: Middleware = fns[0];
  let mwFunc: MiddlewareFunction;
  if (isMiddlewareObject(mw)) {
    mwFunc = mw[middlewareCall].bind(fns[0]);
  } else {
    mwFunc = mw;
  }

  return mwFunc(ctx, async () => {
    await invokeMiddlewares(ctx, fns.slice(1));
  });
}

function isMiddlewareObject(input: Middleware): input is MiddlewareObject {
  return (input as MiddlewareObject)[middlewareCall] !== undefined;
}

export default class Application extends EventEmitter {

  middlewares: Middleware[] = [];

  private wss: WebSocket.Server | undefined;

  /**
   * Add a middleware to the application.
   *
   * Middlewares are called in the order they are added.
   */
  use(...middleware: Middleware[]) {
    this.middlewares.push(...middleware);
  }

  /**
   * Handles a single request and calls all middleware.
   */
  async handle(ctx: Context): Promise<void> {
    ctx.response.headers.set('Server', 'curveball/' + pkg.version);
    ctx.response.type = 'application/hal+json';
    await invokeMiddlewares(ctx, [...this.middlewares, NotFoundMw]);
  }


  /**
   * Starts a HTTP server on the specified port.
   */
  listen(port: number, host?: string): http.Server {
    const server = http.createServer(this.callback());
    server.on('upgrade', this.upgradeCallback.bind(this));

    return server.listen(port, host);
  }

  /**
   * Starts a Websocket-only server on the specified port.
   *
   * Note that this is now deprecated. The listen() function already starts
   * a websocket on the main HTTP port, so this is somewhat redundant.
   *
   * @deprecated
   */
  listenWs(port: number, host?: string): WebSocket.Server {

    const wss = new WebSocket.Server({
      port,
      host
    });
    wss.on('connection', async(ws, req) => {

      const request = new NodeRequest(req, this.origin);
      const response = new MemoryResponse(this.origin);
      const context = new Context(request, response);

      context.webSocket = ws;

      await this.handle(context);

    });
    return wss;

  }

  /**
   * This function is a callback that can be used for Node's http.Server,
   * https.Server, or http2.Server.
   */
  callback(): HttpCallback {
    return async (
      req: NodeHttpRequest,
      res: NodeHttpResponse
    ): Promise<void> => {
      try {
        const ctx = this.buildContextFromHttp(req, res);
        await this.handle(ctx);
        sendBody(res, ctx.response.body);
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

        if (this.listenerCount('error')) {
          this.emit('error', err);
        }
      }
    };
  }

  /**
   * This callback can be used to tie to the Node.js Http(s/2) server 'upgrade' event'.
   *
   * It's used to facilitate incoming Websocket requests
   */
  upgradeCallback(request: http.IncomingMessage, socket: net.Socket, head: Buffer) {
    if (!this.wss) {
      // We don't have an existing Websocket server. Lets make one.
      this.wss = new WebSocket.Server({ noServer: true });
      this.wss.on('connection', async(ws, req) => {
        const request = new NodeRequest(req, this.origin);
        const response = new MemoryResponse(this.origin);
        const context = new Context(request, response);

        context.webSocket = ws;
        await this.handle(context);
      });
    }
    this.wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
      this.wss!.emit('connection', ws, request);
    });
  }

  /**
   * Does a sub-request based on a Request object, and returns a Response
   * object.
   */
  async subRequest(
    method: string,
    path: string,
    headers?: HeadersInterface | HeadersObject,
    body?: any
  ): Promise<Response>;
  async subRequest(request: Request): Promise<Response>;
  async subRequest(
    arg1: string | Request,
    path?: string,
    headers?: HeadersInterface | HeadersObject,
    body: any = ''
  ): Promise<Response> {
    let request: Request;

    if (typeof arg1 === 'string') {
      request = new MemoryRequest(arg1, path!, this.origin, headers, body);
    } else {
      request = arg1;
    }

    const context = new Context(request, new MemoryResponse(this.origin));

    try {
      await this.handle(context);
    } catch (err: any) {
      console.error(err);
      if (this.listenerCount('error')) {
        this.emit('error', err);
      }
      if (isHttpError(err)) {
        context.response.status = err.httpStatus;
      } else {
        context.response.status = 500;
      }
      context.response.body =
        'Uncaught exception. No middleware was defined to handle it. We got the following HTTP status: ' +
        context.response.status;
    }
    return context.response;
  }

  /**
   * Creates a Context object based on a node.js request and response object.
   */
  public buildContextFromHttp(
    req: NodeHttpRequest,
    res: NodeHttpResponse
  ): Context {
    const context = new Context(
      new NodeRequest(req, this.origin),
      new NodeResponse(res, this.origin)
    );

    return context;
  }

  private _origin?: string;

  /**
   * The public base url of the application.
   *
   * This can be auto-detected, but will often be wrong when your server is
   * running behind a reverse proxy or load balancer.
   *
   * To provide this, set the process.env.PUBLIC_URI property.
   */
  get origin(): string {

    if (this._origin) {
      return this._origin;
    }

    if (process.env.CURVEBALL_ORIGIN) {
      return process.env.CURVEBALL_ORIGIN;
    }

    if (process.env.PUBLIC_URI) {
      return new URL(process.env.PUBLIC_URI).origin;
    }

    const port = process.env.PORT ? +process.env.PORT : 80;
    return 'http://localhost' + (port!==80?':' + port : '');

  }

  set origin(baseUrl: string) {

    this._origin = new URL(baseUrl).origin;

  }

}
