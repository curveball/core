import http2 from 'http2';
import { Application } from '../src';
import { expect } from 'chai';
import fetch from 'node-fetch';

describe('NodeResponse http/2 push', async() => {

  it('should work', async() => {

    const app = new Application();
    const server = http2.createServer(app.callback());
    server.listen(32653);

    app.use( ctx => {

      switch(ctx.request.path) {
        case '/foo' :
          ctx.response.body = 'Hello world A';
          ctx.response.push( pushCtx => {
            pushCtx.request.path = '/bar';
            return app.handle(pushCtx);
          });
          break;
        case '/bar' :
          ctx.response.body = 'Hello world B';
          break;
      }

    });

    const client = http2.connect('http://localhost:32653', {
      settings: {
        enablePush: true,
      }
    });

    const req = client.request({':path': '/foo'});

    let data = '';
    let pushedData = '';
    let pushRequestHeaders;
    let pushResponseHeaders;
    let responseHeaders;

    await new Promise((res, rej) => {


      client.on('stream', (pushedStream, requestHeaders) => {

        pushRequestHeaders = requestHeaders;

        pushedStream.setEncoding('utf-8');
        pushedStream.on('push', (responseHeaders) => {

          pushResponseHeaders = responseHeaders;

        });
        pushedStream.on('data', (chunk) => {

          pushedData+=chunk;

        });

      });
      req.setEncoding('utf-8');
      req.on('response', (headers, flags) => {
        responseHeaders = headers;
      });
      req.on('data', (chunk) => {
        data+=chunk;
      });
      req.on('end', () => {
        client.close();
        res([data, pushedData]);
      });

    });

    server.close();
    client.close();

    expect(data).to.equal('Hello world A');
    expect(pushedData).to.equal('Hello world B');
    expect(pushRequestHeaders).to.eql({
      ':authority': 'localhost:32653',
      ':method': 'GET',
      ':path': '/bar',
      ':scheme': 'http',
    });
    expect((<any>pushResponseHeaders)[':status']).to.eql(200);
    expect((<any>responseHeaders)[':status']).to.eql(200);

  });

  it('should do nothing when a HTTP/1 server is used', async () => {

    const app = new Application();
    const server = app.listen(32653);

    let notCalled = true;
    app.use( ctx => {

      switch(ctx.request.path) {
        case '/foo' :
          ctx.response.body = 'Hello world A';
          ctx.response.push( pushCtx => {
            notCalled = false;
          });
          break;
      }

    });

    const response = await fetch('http://localhost:32653/foo');
    const body = await response.text();
    server.close();
    expect(body).to.equal('Hello world A');
    expect(notCalled).to.be.true;

  });

  it('should do nothing if client doesn\'t want pushes', async() => {

    const app = new Application();
    const server = http2.createServer(app.callback());
    server.listen(32653);
    let notCalled = true;
    let notCalled2 = true;

    app.use( ctx => {

      switch(ctx.request.path) {
        case '/foo' :
          ctx.response.body = 'Hello world A';
          ctx.response.push( pushCtx => {
            notCalled = false;
          });
          break;
        case '/bar' :
          ctx.response.body = 'Hello world B';
          break;
      }

    });

    const client = http2.connect('http://localhost:32653', {
      settings: {
        enablePush: false,
      }
    });

    const req = client.request({':path': '/foo'});

    let data = '';
    let responseHeaders;

    await new Promise((res, rej) => {


      client.on('stream', (pushedStream, requestHeaders) => {

        notCalled2 = false;

      });
      req.setEncoding('utf-8');
      req.on('response', (headers, flags) => {
        responseHeaders = headers;
      });
      req.on('data', (chunk) => {
        data+=chunk;
      });
      req.on('end', () => {
        client.close();
        res();
      });

    });

    server.close();
    client.close();

    expect(data).to.equal('Hello world A');
    expect((<any>responseHeaders)[':status']).to.eql(200);
    expect(notCalled).to.eql(true);
    expect(notCalled2).to.eql(true);

  });
});
