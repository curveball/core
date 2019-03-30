import { isHttpError } from '@curveball/http-errors';
import EventEmitter from 'events';
import http from 'http';
import Context from './context';
import { HeadersInterface, HeadersObject } from './headers';
import MemoryRequest from './memory-request';
import MemoryResponse from './memory-response';
import NotFoundMw from './middleware/not-found';
import { HttpCallback, NodeHttpRequest, NodeHttpResponse, sendBody } from './node/http-utils';
import NodeRequest from './node/request';
import NodeResponse from './node/response';
import Request from './request';
import Response from './response';

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
type MiddlewareFunction = (ctx: Context, next: () => Promise<void>) => Promise<void> | void;

type MiddlewareObject = {
  [middlewareCall]: MiddlewareFunction
};

export type Middleware = MiddlewareFunction | MiddlewareObject;

// Calls a series of middlewares, in order.
export async function invokeMiddlewares(ctx: Context, fns: Middleware[]): Promise<void> {

  if (fns.length === 0) {
    return;
  }

  let mw;
  if ((<MiddlewareObject> fns[0])[middlewareCall] !== undefined) {
    mw = (<MiddlewareObject> fns[0])[middlewareCall].bind(fns[0]);
  } else {
    mw = fns[0];
  }

  return mw(ctx, async () => {
    await invokeMiddlewares(
      ctx,
      fns.slice(1)
    );
  });
}

export default class Application extends EventEmitter {

  middlewares: Middleware[] = [];

  /**
   * Add a middleware to the application.
   *
   * Middlewares are called in the order they are added.
   */
  use(middleware: Middleware) {

    this.middlewares.push(middleware);

  }

  /**
   * Handles a single request and calls all middleware.
   */
  async handle(ctx: Context): Promise<void> {

    ctx.response.headers.set('Server', 'curveball/' + pkg.version);
    await invokeMiddlewares(ctx, [
      ...this.middlewares,
      NotFoundMw
    ]);

  }


  /**
   * Starts a HTTP server on the specified port.
   */
  listen(port: number): http.Server {

    const server = http.createServer(this.callback());
    return server.listen(port);

  }

  /**
   * This function is a callback that can be used for Node's http.Server,
   * https.Server, or http2.Server.
   */
  callback(): HttpCallback {

    return async (req: NodeHttpRequest, res: NodeHttpResponse): Promise<void> => {
      try {
        const ctx = this.buildContextFromHttp(req, res);
        await this.handle(ctx);

        // @ts-ignore - not sure why this line fails
        sendBody(res, ctx.response.body);
      } catch (err) {

        // tslint:disable:no-console
        console.error(err);

        if (isHttpError(err)) {
          res.statusCode = err.httpStatus;
        } else {
          res.statusCode = 500;
        }
        // @ts-ignore
        res.end('Uncaught exception. No middleware was defined to handle it. We got the following HTTP status: ' + res.statusCode);
        if (this.listenerCount('error')) {
          this.emit('error', err);
        }
      }
    };

  }

  /**
   * Does a sub-request based on a Request object, and returns a Response
   * object.
   */
  async subRequest(method: string, path: string, headers?: HeadersInterface | HeadersObject, body?: any): Promise<Response>;
  async subRequest(request: Request): Promise<Response>;
  async subRequest(arg1: string | Request, path?: string, headers?: HeadersInterface | HeadersObject, body: any = ''): Promise<Response> {

    let request: Request;

    if (typeof arg1 === 'string') {
      request = new MemoryRequest(<string> arg1, path!, headers, body);
    } else {
      request = <Request> arg1;
    }

    const context = new Context(
      request,
      new MemoryResponse()
    );

    try {
      await this.handle(context);
    } catch (err) {
        // tslint:disable:no-console
      console.error(err);
      if (this.listenerCount('error')) {
        this.emit('error', err);
      }
      if (isHttpError(err)) {
        context.response.status = err.httpStatus;
      } else {
        context.response.status = 500;
      }
      context.response.body = 'Uncaught exception. No middleware was defined to handle it. We got the following HTTP status: ' + context.response.status;
    }
    return context.response;

  }

  /**
   * Creates a Context object based on a node.js request and response object.
   */
  public buildContextFromHttp(req: NodeHttpRequest, res: NodeHttpResponse): Context {

    const context = new Context(
      new NodeRequest(req),
      new NodeResponse(res)
    );

    return context;

  }

}
