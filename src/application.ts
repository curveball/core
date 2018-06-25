import http from 'http';
import NodeRequest from './node-request';
import NodeResponse from './node-response';
import Context from './context';
import EventEmitter from 'events';

const pkg = require('../package.json');

type Middleware = (ctx: Context, next: () => Promise<void>) => Promise<void> | void;

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

  listen(port: number): http.Server {

    const server = http.createServer(async (req, res) => {

      try {
        const ctx = this.createContext(req, res);
        await this.handle(ctx);

        if (typeof ctx.response.body === 'string') {
          res.write(ctx.response.body);
        } else {
          throw new Error('Only strings are supported currently');
        }
        res.end();
      } catch (err) {

        console.error(err);
        res.statusCode = 500;
        res.write('Uncaught exception');
        res.end();
        if (this.listenerCount('error')) {
          this.emit('error', err);
        }
      }

    });
    return server.listen(port);

  }

  createContext(req: http.IncomingMessage, res: http.ServerResponse): Context {

    const context = new Context(
      new NodeRequest(req),
      new NodeResponse(res)
    );

    return context;

  }

}
