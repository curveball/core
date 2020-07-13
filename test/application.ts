import { expect } from 'chai';
import fetch from 'node-fetch';
import { Application, middlewareCall, MemoryRequest, Context } from '../src';
import * as fs from 'fs';

describe('Application', () => {
  it('should instantiate', () => {
    const application = new Application();
    expect(application).to.be.an.instanceof(Application);
  });

  it('should respond to HTTP requests', async () => {
    const application = new Application();
    application.use((ctx, next) => {
      ctx.response.body = 'hi';
    });
    const server = application.listen(5555);

    const response = await fetch('http://localhost:5555');
    const body = await response.text();

    expect(body).to.equal('hi');
    expect(response.headers.get('server')).to.equal(
      'curveball/' + require('../package.json').version
    );
    expect(response.status).to.equal(200);

    server.close();
  });

  it('should work with Buffer responses', async () => {
    const application = new Application();
    application.use((ctx, next) => {
      ctx.response.body = Buffer.from('hi');
    });
    const server = application.listen(5555);

    const response = await fetch('http://localhost:5555');
    const body = await response.text();

    expect(body).to.equal('hi');
    expect(response.headers.get('server')).to.equal(
      'curveball/' + require('../package.json').version
    );
    expect(response.status).to.equal(200);

    server.close();
  });

  it('should work with Readable stream responses', async () => {
    const application = new Application();
    application.use((ctx, next) => {
      ctx.response.body = fs.createReadStream(__filename);
    });
    const server = application.listen(5555);

    const response = await fetch('http://localhost:5555');
    const body = await response.text();

    expect(body.substring(0, 6)).to.equal('import');
    expect(response.headers.get('server')).to.equal(
      'curveball/' + require('../package.json').version
    );
    expect(response.status).to.equal(200);

    server.close();
  });

  it('should automatically JSON-encode objects', async () => {
    const application = new Application();
    application.use((ctx, next) => {
      ctx.response.body = { foo: 'bar' };
    });
    const server = application.listen(5555);

    const response = await fetch('http://localhost:5555');
    const body = await response.text();

    expect(body).to.equal('{"foo":"bar"}');
    expect(response.headers.get('server')).to.equal(
      'curveball/' + require('../package.json').version
    );
    expect(response.status).to.equal(200);

    server.close();
  });

  it('should handle "null" bodies', async () => {
    const application = new Application();
    application.use((ctx, next) => {
      ctx.response.body = null;
    });
    const server = application.listen(5555);

    const response = await fetch('http://localhost:5555');
    const body = await response.text();

    expect(body).to.equal('');
    expect(response.headers.get('server')).to.equal(
      'curveball/' + require('../package.json').version
    );
    expect(response.status).to.equal(200);

    server.close();
  });

  it('should throw an exception for unsupported bodies', async () => {
    const application = new Application();
    application.use((ctx, next) => {
      ctx.response.body = 5;
    });
    const server = application.listen(5555);

    const response = await fetch('http://localhost:5555');
    const body = await response.text();

    expect(body).to.include(': 500');
    expect(response.headers.get('server')).to.equal(
      'curveball/' + require('../package.json').version
    );
    expect(response.status).to.equal(500);

    server.close();
  });

  it('should work with multiple calls to middlewares', async () => {
    const application = new Application();
    application.use(async (ctx, next) => {
      ctx.response.body = 'hi';
      await next();
    });
    application.use((ctx, next) => {
      ctx.response.headers.set('X-Foo', 'bar');
    });
    const server = application.listen(5555);
    const response = await fetch('http://localhost:5555');
    const body = await response.text();

    expect(body).to.equal('hi');
    expect(response.headers.get('X-Foo')).to.equal('bar');
    expect(response.status).to.equal(200);

    server.close();
  });
  it('should work with multiple middlewares as arguments', async () => {
    const application = new Application();
    application.use(async (ctx, next) => {
      ctx.response.body = 'hi';
      await next();
    }),
      application.use((ctx, next) => {
        ctx.response.headers.set('X-Foo', 'bar');
      });
    const server = application.listen(5555);
    const response = await fetch('http://localhost:5555');
    const body = await response.text();

    expect(body).to.equal('hi');
    expect(response.headers.get('X-Foo')).to.equal('bar');
    expect(response.status).to.equal(200);

    server.close();
  });

  it('should work with object-middlewares', async () => {
    const application = new Application();

    const myMw = {
      [middlewareCall]: async (ctx: Context, next: Function) => {
        ctx.response.body = 'hi';
      }
    };

    application.use(myMw);

    const server = application.listen(5555);
    const response = await fetch('http://localhost:5555');
    const body = await response.text();

    expect(body).to.equal('hi');
    expect(response.status).to.equal(200);

    server.close();
  });

  it('should not call sequential middlewares if next is not called', async () => {
    const application = new Application();
    application.use((ctx, next) => {
      ctx.response.body = 'hi';
    });
    application.use((ctx, next) => {
      ctx.response.headers.set('X-Foo', 'bar');
    });
    const server = application.listen(5555);
    const response = await fetch('http://localhost:5555');
    const body = await response.text();

    expect(body).to.equal('hi');
    expect(response.headers.get('X-Foo')).to.equal(null);
    expect(response.status).to.equal(200);

    server.close();
  });

  describe('When an uncaught exception happens', () => {
    it('should trigger an "error" event', async () => {
      const application = new Application();
      application.use((ctx, next) => {
        throw new Error('hi');
      });
      let error;
      application.on('error', err => {
        error = err;
      });
      const server = application.listen(5555);

      await fetch('http://localhost:5555');

      expect(error).to.be.an.instanceof(Error);
      // @ts-ignore: TS complains about error possibly being undefined.
      expect(error.message).to.equal('hi');

      server.close();
    });

    it('should return an error message in the response body.', async () => {
      const application = new Application();
      application.use((ctx, next) => {
        throw new Error('hi');
      });
      const server = application.listen(5555);

      const response = await fetch('http://localhost:5555');
      const body = await response.text();
      expect(body).to.include(': 500');

      server.close();
    });
  });

  describe('When no middlewares are defined', () => {
    it('should do nothing', async () => {
      const application = new Application();
      const server = application.listen(5555);

      await fetch('http://localhost:5555');

      server.close();
    });
  });

  describe('Subrequests', () => {
    it('should work with a Request object', async () => {
      let innerRequest;

      const application = new Application();
      application.use(ctx => {
        innerRequest = ctx.request;
        ctx.response.status = 201;
        ctx.response.headers.set('X-Foo', 'bar');
        ctx.response.body = 'hello world';
      });

      const request = new MemoryRequest(
        'POST',
        '/',
        { foo: 'bar' },
        'request-body'
      );
      const response = await application.subRequest(request);

      expect(response.status).to.equal(201);
      expect(response.headers.get('X-Foo')).to.equal('bar');
      expect(response.body).to.equal('hello world');
      expect(innerRequest).to.equal(request);
    });

    it('should work without a Request object', async () => {
      const application = new Application();
      application.use(ctx => {
        ctx.response.status = 201;
        ctx.response.headers.set('X-Foo', 'bar');
        ctx.response.body = 'hello world';
      });

      const response = await application.subRequest(
        'POST',
        '/',
        { foo: 'bar' },
        'request-body'
      );

      expect(response.status).to.equal(201);
      expect(response.headers.get('X-Foo')).to.equal('bar');
      expect(response.body).to.equal('hello world');
    });
  });

  describe('When middlewares did not set an explicit status', () => {
    it('should return 200 when a body was set', async () => {
      const app = new Application();
      app.use(ctx => {
        ctx.response.body = 'hi';
      });
      const server = app.listen(5555);

      const response = await fetch('http://localhost:5555');
      expect(response.status).to.equal(200);

      server.close();
    });
    it('should return 404 when no body was set', async () => {
      const app = new Application();
      const server = app.listen(5555);

      const response = await fetch('http://localhost:5555');
      expect(response.status).to.equal(404);

      server.close();
    });
  });
});
