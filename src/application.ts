import http from 'http';
import NodeRequest from './node-request';
import NodeResponse from './node-response';
import Context from './context';
import EventEmitter from 'events';
import { HttpCallback, NodeHttpRequest, NodeHttpResponse } from './node-http-utils';

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
        const ctx = this.createContext(req, res);
        await this.handle(ctx);

        if (typeof ctx.response.body === 'string') {
          // @ts-ignore
          res.write(ctx.response.body);
        } else {
          throw new Error('Only strings are supported currently');
        }
        // @ts-ignore
        res.end();
      } catch (err) {

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
    }

  }

  createContext(req: NodeHttpRequest, res: NodeHttpResponse): Context {

    const context = new Context(
      new NodeRequest(req),
      new NodeResponse(res)
    );

    return context;

  }

}
