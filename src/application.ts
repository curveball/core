import http from 'http';
import NodeRequest from './node-request';
import NodeResponse from './node-response';
import Context from './context';

const pkg = require('../package.json');

export default class Application {

  /**
   * Handles a single request and calls all middleware
   */
  handle(ctx: Context) {

    ctx.response.headers.set('Server', 'curveball/' + pkg.version);
    ctx.response.body = 'hi';

  }

  listen(port: number): void {

    const server = http.createServer(async (req, res) => {

      const ctx = this.createContext(req, res);
      await this.handle(ctx);

      if (typeof ctx.response.body === 'string') {
        res.write(ctx.response.body);
      } else {
        throw new Error('Only strings are supported currently');
      }
      res.end();

    });
    server.listen(port);

  }

  createContext(req: http.IncomingMessage, res: http.ServerResponse): Context {

    const context = new Context(
      new NodeRequest(req),
      new NodeResponse(res)
    );

    return context;

  }

}
