import http from 'http';
import NodeRequest from './node-request';
import NodeResponse from './node-response';
import Context from './context';

export default class Application {

  listen(port: number): void {

    const server = http.createServer((req, res) => {

      this.createContext(req, res);

    });
    server.listen(port);
    console.log('Listening on %n', 3000);

  }

  createContext(req: http.IncomingMessage, res: http.ServerResponse): Context {

    const context = new Context(
      new NodeRequest(req),
      new NodeResponse(res)
    );

    console.log(context);
    res.write('bye');
    res.end();
    return context;

  }

}
