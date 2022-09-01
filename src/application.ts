import { EventEmitter } from 'events';

import { isHttpError } from '@curveball/http-errors';

import { Context } from './context';
import { HeadersInterface, HeadersObject } from './headers';
import MemoryRequest from './memory-request';
import MemoryResponse from './memory-response';
import NotFoundMw from './middleware/not-found';
import { Request as CurveballRequest } from './request';
import { Response as CurveballResponse } from './response';
import {
  curveballResponseToFetchResponse,
  fetchRequestToCurveballRequest
} from './fetch-util';



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
   * Executes a request on the server using the standard browser Request and
   * Response objects from the fetch() standard.
   *
   * Node will probably provide these out of the box in Node 18. If you're on
   * an older version, you'll need a polyfill.
   *
   * A use-case for this is allowing test frameworks to make fetch-like
   * requests without actually having to go over the network.
   */
  async fetch(request: Request): Promise<Response> {

    const response = await this.subRequest(
      await fetchRequestToCurveballRequest(request, this.origin)
    );
    return curveballResponseToFetchResponse(response);

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
  ): Promise<CurveballResponse>;
  async subRequest(request: CurveballRequest): Promise<CurveballResponse>;
  async subRequest(
    arg1: string | CurveballRequest,
    path?: string,
    headers?: HeadersInterface | HeadersObject,
    body: any = ''
  ): Promise<CurveballResponse> {
    let request: CurveballRequest;

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
