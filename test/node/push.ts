/* eslint no-console:0 */

import { expect } from 'chai';
import { EventEmitter } from 'node:events';
import * as http2 from 'node:http2';
import { Application, Context, MemoryRequest, MemoryResponse } from '../../src/index.js';
import push from '../../src/node/push.js';
import NodeResponse from '../../src/node/response.js';

describe('NodeResponse http/2 push', () => {

  const matches = process.version.match(/^v([0-9]+)\.([0-9]+)\.([0-9]+)$/);
  if (matches) {
    const major = parseInt(matches[1]);
    const minor = parseInt(matches[2]);
    if (major < 9 || (major === 9 && minor < 4)) {
      // The reason we requrie 8.11.2 is because in this version
      // http2.HttpSession.close() was added.
      throw new Error('This package requires Node version 8.11.2');
    }
  }

  it('should work', async () => {

    const app = new Application();
    const server = http2.createServer(app.callback());
    server.listen(32653);

    app.use( ctx => {

      switch (ctx.request.path) {
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

          pushedData += chunk;

        });

      });
      req.setEncoding('utf-8');
      req.on('response', (headers, flags) => {
        responseHeaders = headers;
      });
      req.on('data', (chunk) => {
        data += chunk;
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
    expect(pushRequestHeaders?.[':authority']).to.equal('localhost:32653');
    expect(pushRequestHeaders?.[':method']).to.equal('GET');
    expect(pushRequestHeaders?.[':path']).to.equal('/bar');
    expect(pushRequestHeaders?.[':scheme']).to.equal('http');
    expect((pushResponseHeaders as any)[':status']).to.eql(200);
    expect((responseHeaders as any)[':status']).to.eql(200);

  });
  it('should still work when the pushed resource uses query parameters', async () => {

    const app = new Application();
    const server = http2.createServer(app.callback());
    server.listen(32653);

    app.use( ctx => {

      switch (ctx.request.path) {
        case '/foo' :
          ctx.response.body = 'Hello world A';
          ctx.response.push( pushCtx => {
            pushCtx.request.path = '/bar?sup';
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

          pushedData += chunk;

        });

      });
      req.setEncoding('utf-8');
      req.on('response', (headers, flags) => {
        responseHeaders = headers;
      });
      req.on('data', (chunk) => {
        data += chunk;
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
    expect(pushRequestHeaders?.[':authority']).to.equal('localhost:32653');
    expect(pushRequestHeaders?.[':method']).to.equal('GET');
    expect(pushRequestHeaders?.[':path']).to.equal('/bar?sup');
    expect(pushRequestHeaders?.[':scheme']).to.equal('http');
    expect((pushResponseHeaders as any)[':status']).to.eql(200);
    expect((responseHeaders as any)[':status']).to.eql(200);

  });

  it('should do nothing when a HTTP/1 server is used', async () => {

    const app = new Application();
    const server = app.listen(32653);

    let notCalled = true;
    app.use( ctx => {

      switch (ctx.request.path) {
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

  it('should do nothing if client doesn\'t want pushes', async () => {

    const app = new Application();
    const server = http2.createServer(app.callback());
    server.listen(32653);
    let notCalled = true;
    let notCalled2 = true;

    app.use( ctx => {

      switch (ctx.request.path) {
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

    await new Promise<void>((res, rej) => {


      client.on('stream', (pushedStream, requestHeaders) => {

        notCalled2 = false;

      });
      req.setEncoding('utf-8');
      req.on('response', (headers, flags) => {
        responseHeaders = headers;
      });
      req.on('data', (chunk) => {
        data += chunk;
      });
      req.on('end', () => {
        client.close();
        res();
      });

    });

    server.close();
    client.close();

    expect(data).to.equal('Hello world A');
    expect((responseHeaders as any)[':status']).to.eql(200);
    expect(notCalled).to.eql(true);
    expect(notCalled2).to.eql(true);

  });
  it('should throw an error when no path was set', async () => {

    const response = new NodeResponse(
      {
        stream: {
          pushAllowed: true
        }
      } as any,
      'http://localhost',
    );

    let err;
    try {

      await response.push( pushCtx => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
      });

    } catch (e: any) {
      console.error(e);
      err = e;
    }

    expect(err).to.be.an.instanceof(Error);
    expect(err.message).to.equal('The "path" must be set in the push context\'s request');

  });

  it('should handle stream errors', async () => {

    const response = new NodeResponse(
      {
        stream: {
          pushStream(headers: any, callback: any) {
            callback(new Error('hi'));
          },
          pushAllowed: true
        },
      } as any,
      'http://localhost'
    );

    let err;
    try {

      await response.push( (pushCtx, next) => {
        // next does nothing, but it's part of the callback
        // signature so it can be compatible with middlewares.
        // we're calling next, because we want to trick nyc to
        // give us 100% code coverage.
        next();
        pushCtx.request.path = '/foo';
      });

    } catch (e: any) {
      console.error(e);
      err = e;
    }

    expect(err).to.be.an.instanceof(Error);
    expect((err).message).to.equal('hi');

  });
});


describe('push() function', () => {

  describe('late push disabled', () => {

    it('should not error', async () => {

      const stream = {
        pushStream: () => {
          const error = new Error('HTTP/2 client has disabled push');
          (error as any).code = 'ERR_HTTP2_PUSH_DISABLED';
          throw error;
        }
      };

      await push(
        stream as any,
        new Context(
          new MemoryRequest('GET', '/push-resource', 'http://localhost'),
          new MemoryResponse('http://localhost')
        )
      );

    });

  });

  describe('Client refusing stream', () => {

    it('should not error', async () => {

      class FakeStream extends EventEmitter {

        rstCode?: number;
        respond() {

          const err = new Error('Refused');
          this.rstCode = http2.constants.NGHTTP2_REFUSED_STREAM;
          this.emit('error', err);

        }

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        end() {

        }

      }

      const stream = {
        pushStream: (headers: any, callback: any) => {
          callback(null, new FakeStream());
        }
      };

      await push(
        stream as any,
        new Context(
          new MemoryRequest('GET', '/push-resource', 'http://localhost'),
          new MemoryResponse('http://localhost')
        )
      );

    });

  });


  describe('Other errors', () => {

    it('should bubble', async () => {

      class FakeStream extends EventEmitter {

        respond() {

          const err = new Error('Other error');
          this.emit('error', err);

        }

      }

      const stream = {
        pushStream: (headers: any, callback: any) => {
          callback(null, new FakeStream());
        }
      };

      let caught = false;

      try {
        await push(
          stream as any,
          new Context(
            new MemoryRequest('GET', '/push-resource', 'http://localhost'),
            new MemoryResponse('http://localhost')
          )
        );
      } catch (e: any) {
        caught = true;
      }

      expect(caught).to.equal(true);

    });

  });

});
