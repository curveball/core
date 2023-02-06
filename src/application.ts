import * as http from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import * as net from 'node:net';

import {
  HttpCallback,
  NodeHttpRequest,
  NodeHttpResponse,
  nodeHttpServerCallback,
} from './node/http-utils.js';
import NodeRequest from './node/request.js';
import NodeResponse from './node/response.js';

import {
  Application as BaseApplication,
  Context,
  MemoryResponse,
  Middleware,
} from '@curveball/kernel';

export default class Application extends BaseApplication {

  middlewares: Middleware[] = [];

  private wss: WebSocketServer | undefined;

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
  listenWs(port: number, host?: string): WebSocketServer {

    const wss = new WebSocketServer({
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
   * Returns a callback that can be used with Node's http.Server, http2.Server, https.Server.
   *
   * Normally you want to pass this to the constructor of each of these classes.
   */
  callback(): HttpCallback {

    return nodeHttpServerCallback(this);

  }

  /**
   * This callback can be used to tie to the Node.js Http(s/2) server 'upgrade' event'.
   *
   * It's used to facilitate incoming Websocket requests
   */
  upgradeCallback(request: http.IncomingMessage, socket: net.Socket, head: Buffer) {
    if (!this.wss) {
      // We don't have an existing Websocket server. Lets make one.
      this.wss = new WebSocketServer({ noServer: true });
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

}
