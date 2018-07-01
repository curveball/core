import EventEmitter from 'events';
import http from 'http';
import Context from './context';
import { HttpCallback, NodeHttpRequest, NodeHttpResponse } from './node-http-utils';
import NodeRequest from './node-request';
import NodeResponse from './node-response';
import Request from './request';
import Response from './response';
import MemoryResponse from './memory-response';
import MemoryRequest from './memory-request';
import { HeadersInterface, HeadersObject } from './headers';

const pkg = require('../package.json');

/**
 * The Middleware function is implemented by all middlewares.
 *
 * The Middleware function takes a Context and a next() function as its
 * arguments, and _may_ be an async function.
 */
export type Middleware = (ctx: Context, next: () => Promise<void>) => Promise<void> | void;


export default class Application extends EventEmitter {

  middlewares: Middleware[] = [];

  use(middleware: Middleware) {

    this.middlewares.push(middleware);

  }

  /**
   * Handles a single request and calls all middleware
   */
  async handle(ctx: Context): Promise<void> {

    ctx.response.headers.set('Server', 'curveball/' + pkg.version);
    await this.callMiddleware(ctx, this.middlewares);

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

        if (typeof ctx.response.body === 'string') {
          // @ts-ignore
          res.write(ctx.response.body);
        } else if (ctx.response.body instanceof Buffer) {
          // @ts-ignore
          res.write(ctx.response.body);
        } else if (ctx.response.body === null) {
          // Do nothng
        } else if (typeof ctx.response.body === 'object') {
          // @ts-ignore
          res.write(JSON.stringify(ctx.response.body));
        } else {
          throw new Error('Unsupported type for body: ' + typeof ctx.response.body);
        }
        // @ts-ignore
        res.end();
      } catch (err) {

        // tslint:disable:no-console
        console.error(err);

        res.statusCode = 500;
        // @ts-ignore
        res.write('Uncaught exception');
        // @ts-ignore
        res.end();
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

    let request:Request;

    if (typeof arg1 === 'string') {
      request = new MemoryRequest(<string>arg1, path, headers, body);
    } else {
      request = <Request>arg1;
    }

    const context = new Context(
      request,
      new MemoryResponse()
    );

    await this.handle(context);
    return context.response;

  }

  /**
   * Creates a Context object based on a node.js request and response object.
   */
  private buildContextFromHttp(req: NodeHttpRequest, res: NodeHttpResponse): Context {

    const context = new Context(
      new NodeRequest(req),
      new NodeResponse(res)
    );

    return context;

  }

  /**
   * Calls a chain of middlewares.
   *
   * Pass a list of middlewares. It will call the first and bind the next
   * middleware to next().
   */
  private async callMiddleware(ctx: Context, fns: Middleware[]) {

    if (fns.length === 0) {
      return;
    }
    return fns[0](ctx, async () => {
      await this.callMiddleware(
        ctx,
        fns.slice(1)
      );
    });

  }

}
