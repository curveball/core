import { Application } from '../src/index.js';
import * as WebSocket from 'ws';
import { UpgradeRequired } from '@curveball/http-errors';
import { expect } from 'chai';

describe('Websocket support', () => {

  it('should automatically handle Websockets', () => {

    const app = new Application();
    app.use( ctx => {

      if (!ctx.webSocket) {
        throw new UpgradeRequired('Websocket is a must');
      }

      ctx.webSocket.send('Hello');


    });
    const wss = app.listen(57001);

    return new Promise<void>(res => {
      const ws = new WebSocket('ws://localhost:57001');
      ws.on('message', (msg) => {

        expect(msg.toString()).to.equal('Hello');
        ws.close();
        wss.close();
        res();

      });

    });


  });

  it('Should let users open a websocket-only port with listenWs', () => {

    const app = new Application();
    app.use( ctx => {

      if (!ctx.webSocket) {
        throw new UpgradeRequired('Websocket is a must');
      }

      ctx.webSocket.send('Hello');


    });
    const wss = app.listenWs(57001);

    return new Promise<void>(res => {
      const ws = new WebSocket('ws://localhost:57001');
      ws.on('message', (msg) => {

        expect(msg.toString()).to.equal('Hello');
        ws.close();
        wss.close();
        res();

      });

    });


  });


  it('should start a websocket server with a hostname', () => {

    const app = new Application();
    app.use( ctx => {

      if (!ctx.webSocket) {
        throw new UpgradeRequired('Websocket is a must');
      }

      ctx.webSocket.send('Hello');


    });
    const wss = app.listenWs(57001, '0.0.0.0');

    return new Promise<void>(res => {
      const ws = new WebSocket('ws://0.0.0.0:57001');
      ws.on('message', (msg) => {

        expect(msg.toString()).to.equal('Hello');
        ws.close();
        wss.close();
        res();

      });

    });


  });
});
