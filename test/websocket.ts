import { Application } from '../src';
import WebSocket from 'ws';
import { UpgradeRequired } from '@curveball/http-errors';
import { expect } from 'chai';

describe("Websocket support", () => {

  it('should start a websocket server', () => {

    const app = new Application();
    app.use( ctx => {

      if (!ctx.webSocket) {
        throw new UpgradeRequired('Websocket is a must');
      }

      ctx.webSocket.send('Hello');


    });
    const wss = app.listenWs(57001);
   
    return new Promise(res => {
      const ws = new WebSocket('ws://localhost:57001');
      ws.on('message', (msg) => {

        expect(msg).to.equal('Hello');
        ws.close();
        wss.close();
        res();

      });

    });


  });

});
