import { expect } from 'chai';
import { Application, middlewareCall, MemoryRequest, Context } from '../src';
import * as fs from 'fs';
import { Writable } from 'stream';

describe('Application', () => {
  it('should instantiate', () => {
    const app = new Application();
    expect(app).to.be.an.instanceof(Application);
  });

  it('should respond to HTTP requests', async () => {
    const app = new Application();
    app.use((ctx, next) => {
      ctx.response.body = 'hi';
    });

    const response = await app.fetch(
      new Request('http://localhost:5555')
    );
    const body = await response.text();

    expect(body).to.equal('hi');
    expect(response.headers.get('server')).to.equal(
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      'curveball/' + require('../package.json').version
    );
    expect(response.status).to.equal(200);

  });

  it('should accept hostname', async () => {
    const app = new Application();
    app.use((ctx, next) => {
      ctx.response.body = 'hi';
    });

    const response = await app.fetch(new Request('http://0.0.0.0:5555'));
    const body = await response.text();

    expect(body).to.equal('hi');
    expect(response.headers.get('server')).to.equal(
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      'curveball/' + require('../package.json').version
    );
    expect(response.status).to.equal(200);

  });

  it('should work with Buffer responses', async () => {
    const app = new Application();
    app.use((ctx, next) => {
      ctx.response.body = Buffer.from('hi');
    });

    const response = await app.fetch(new Request('http://0.0.0.0:5555'));
    const body = await response.text();

    expect(body).to.equal('hi');
    expect(response.headers.get('server')).to.equal(
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      'curveball/' + require('../package.json').version
    );
    expect(response.status).to.equal(200);

  });

  it('should work with Readable stream responses', async () => {
    const app = new Application();
    app.use((ctx, next) => {
      ctx.response.body = fs.createReadStream(__filename);
    });

    const response = await app.fetch(new Request('http://0.0.0.0:5555'));
    const body = await response.text();

    expect(body.substring(0, 6)).to.equal('import');
    expect(response.headers.get('server')).to.equal(
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      'curveball/' + require('../package.json').version
    );
    expect(response.status).to.equal(200);

  });

  it('should work with a callback resonse body', async () => {
    const app = new Application();
    app.use((ctx, next) => {
      ctx.response.body = (stream: Writable) => {
        stream.write('hi');
        stream.end();
      };
    });

    const response = await app.fetch(new Request('http://0.0.0.0:5555'));
    const body = await response.text();

    expect(body).to.equal('hi');
    expect(response.headers.get('server')).to.equal(
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      'curveball/' + require('../package.json').version
    );
    expect(response.status).to.equal(200);

  });

  it('should automatically JSON-encode objects', async () => {
    const app = new Application();
    app.use((ctx, next) => {
      ctx.response.body = { foo: 'bar' };
    });
    const response = await app.fetch(new Request('http://0.0.0.0:5555'));
    const body = await response.text();

    expect(body).to.equal('{\n  "foo": "bar"\n}');
    expect(response.headers.get('server')).to.equal(
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      'curveball/' + require('../package.json').version
    );
    expect(response.status).to.equal(200);

  });

  it('should handle "null" bodies', async () => {
    const app = new Application();
    app.use((ctx, next) => {
      ctx.response.body = null;
    });

    const response = await app.fetch(new Request('http://localhost:5555'));
    const body = await response.text();

    expect(body).to.equal('');
    expect(response.headers.get('server')).to.equal(
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      'curveball/' + require('../package.json').version
    );
    expect(response.status).to.equal(200);

  });

  it('should throw an exception for unsupported bodies', async () => {
    const app = new Application();
    app.use((ctx, next) => {
      ctx.response.body = 5;
    });

    let caughtErr = null;
    try {
      await app.fetch(new Request('http://localhost:5555'));
    } catch (err) {
      caughtErr = err;
    }

    expect(caughtErr).to.be.instanceof(TypeError);

  });

  it('should work with multiple calls to middlewares', async () => {
    const app = new Application();
    app.use(async (ctx, next) => {
      ctx.response.body = 'hi';
      await next();
    });
    app.use((ctx, next) => {
      ctx.response.headers.set('X-Foo', 'bar');
    });
    const response = await app.fetch(new Request('http://localhost:5555'));
    const body = await response.text();

    expect(body).to.equal('hi');
    expect(response.headers.get('X-Foo')).to.equal('bar');
    expect(response.status).to.equal(200);

  });
  it('should work with multiple middlewares as arguments', async () => {
    const app = new Application();
    app.use(async (ctx, next) => {
      ctx.response.body = 'hi';
      await next();
    }),
    app.use((ctx, next) => {
      ctx.response.headers.set('X-Foo', 'bar');
    });
    const response = await app.fetch(new Request('http://localhost:5555'));
    const body = await response.text();

    expect(body).to.equal('hi');
    expect(response.headers.get('X-Foo')).to.equal('bar');
    expect(response.status).to.equal(200);

  });

  it('should work with object-middlewares', async () => {
    const app = new Application();

    const myMw = {
      // eslint-disable-next-line @typescript-eslint/ban-types
      [middlewareCall]: async (ctx: Context, next: Function) => {
        ctx.response.body = 'hi';
      }
    };

    app.use(myMw);

    const response = await app.fetch(new Request('http://localhost:5555'));
    const body = await response.text();

    expect(body).to.equal('hi');
    expect(response.status).to.equal(200);

  });

  it('should not call sequential middlewares if next is not called', async () => {
    const app = new Application();
    app.use((ctx, next) => {
      ctx.response.body = 'hi';
    });
    app.use((ctx, next) => {
      ctx.response.headers.set('X-Foo', 'bar');
    });
    const response = await app.fetch(new Request('http://localhost:5555'));
    const body = await response.text();

    expect(body).to.equal('hi');
    expect(response.headers.get('X-Foo')).to.equal(null);
    expect(response.status).to.equal(200);

  });

  describe('When no middlewares are defined', () => {
    it('should do nothing', async () => {
      const app = new Application();
      await app.fetch(new Request('http://localhost:5555'));

    });
  });

  describe('Subrequests', () => {
    it('should work with a Request object', async () => {
      let innerRequest;

      const app = new Application();
      app.use(ctx => {
        innerRequest = ctx.request;
        ctx.response.status = 201;
        ctx.response.headers.set('X-Foo', 'bar');
        ctx.response.body = 'hello world';
      });

      const request = new MemoryRequest(
        'POST',
        '/',
        app.origin,
        { foo: 'bar' },
        'request-body'
      );
      const response = await app.subRequest(request);

      expect(response.status).to.equal(201);
      expect(response.headers.get('X-Foo')).to.equal('bar');
      expect(response.body).to.equal('hello world');
      expect(innerRequest).to.equal(request);
    });

    it('should work without a Request object', async () => {
      const app = new Application();
      app.use(ctx => {
        ctx.response.status = 201;
        ctx.response.headers.set('X-Foo', 'bar');
        ctx.response.body = 'hello world';
      });

      const response = await app.subRequest(
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

      const response = await app.fetch(new Request('http://localhost:5555'));
      expect(response.status).to.equal(200);

    });
    it('should return 404 when no body was set', async () => {
      const app = new Application();

      const response = await app.fetch(new Request('http://localhost:5555'));
      expect(response.status).to.equal(404);

    });
  });

  describe('Origin', async() => {

    it('should default to http://localhost', () => {

      const app = new Application();
      expect(app.origin).to.equal('http://localhost');

    });

    it('should use the PORT variable too if set', () => {

      process.env.PORT = '81';
      const app = new Application();
      expect(app.origin).to.equal('http://localhost:81');
      delete process.env.PORT;

    });

    it('should use CURVEBALL_ORIGIN if set', () => {

      process.env.CURVEBALL_ORIGIN = 'https://curveballjs.org';
      const app = new Application();
      expect(app.origin).to.equal('https://curveballjs.org');
      delete process.env.CURVEBALL_ORIGIN;

    });

    it('should use PUBLIC_URI if set', () => {

      process.env.PUBLIC_URI = 'https://curveballjs.org';
      const app = new Application();
      expect(app.origin).to.equal('https://curveballjs.org');
      delete process.env.PUBLIC_URI;

    });

    it('should ignore PUBLIC_URI if origin was manually set', () => {

      process.env.PUBLIC_URI = 'https://curveballjs.org';
      const app = new Application();
      app.origin = 'http://foo-bar.com';
      expect(app.origin).to.equal('http://foo-bar.com');
      delete process.env.PUBLIC_URI;

    });

  });

});
