import { expect } from 'chai';
import { Application, middlewareCall, MemoryRequest, Context } from '../src/index.js';
import { Readable, Writable } from 'node:stream';

let lastPort = 5555;
const getPort = () => {
  return lastPort++;
};

describe('Application', () => {
  it('should instantiate', () => {
    const application = new Application();
    expect(application).to.be.an.instanceof(Application);
  });

  it('should respond to HTTP requests', async () => {
    const application = new Application();
    application.use((ctx, next) => {
      ctx.response.body = 'string';
    });

    const port = getPort();
    const server = application.listen(port);

    const response = await fetch('http://localhost:' + port);
    const body = await response.text();

    expect(body).to.equal('string');
    expect(response.headers.get('server')).to.match(/Curveball\//);
    expect(response.status).to.equal(200);

    server.close();
  });

  it('should accept hostname', async () => {
    const application = new Application();
    application.use((ctx, next) => {
      ctx.response.body = 'also string';
    });

    const port = getPort();
    const server = application.listen(port, '0.0.0.0');

    const response = await fetch('http://localhost:' + port);
    const body = await response.text();

    expect(body).to.equal('also string');
    expect(response.headers.get('server')).to.match(/Curveball\//);
    expect(response.status).to.equal(200);

    server.close();
  });

  it('should work with Buffer responses', async () => {
    const application = new Application();
    application.use((ctx, next) => {
      ctx.response.body = Buffer.from('buffer');
    });

    const port = getPort();
    const server = application.listen(port);


    const response = await fetch('http://localhost:'+port);
    const body = await response.text();

    expect(body).to.equal('buffer');
    expect(response.headers.get('server')).to.match(/Curveball\//);
    expect(response.status).to.equal(200);

    server.close();
  });

  it('should work with Readable stream responses', async () => {
    const application = new Application();
    application.use((ctx, next) => {
      ctx.response.body = Readable.from(Buffer.from('stream'));
    });

    const port = getPort();
    const server = application.listen(port);

    const response = await fetch('http://localhost:'+port);
    const body = await response.text();

    expect(body.substring(0, 6)).to.equal('stream');
    expect(response.headers.get('server')).to.match(/Curveball\//);
    expect(response.status).to.equal(200);

    server.close();
  });

  it('should work with a callback resonse body', async () => {
    const application = new Application();
    application.use((ctx, next) => {
      ctx.response.body = (stream: Writable) => {
        stream.write('callback');
        stream.end();
      };
    });
    const port = getPort();
    const server = application.listen(port);

    const response = await fetch('http://localhost:'+port);
    const body = await response.text();

    expect(body).to.equal('callback');
    expect(response.headers.get('server')).to.match(/Curveball\//);
    expect(response.status).to.equal(200);

    server.close();
  });

  it('should automatically JSON-encode objects', async () => {
    const application = new Application();
    application.use((ctx, next) => {
      ctx.response.body = { foo: 'bar' };
    });
    const port = getPort();
    const server = application.listen(port);

    const response = await fetch('http://localhost:'+port);
    const body = await response.text();

    expect(body).to.equal('{\n  "foo": "bar"\n}');
    expect(response.headers.get('server')).to.match(/Curveball\//);
    expect(response.status).to.equal(200);

    server.close();
  });

  it('should handle "null" bodies', async () => {
    const application = new Application();
    application.use((ctx, next) => {
      ctx.response.body = null;
    });
    const port = getPort();
    const server = application.listen(port);

    const response = await fetch('http://localhost:'+port);
    const body = await response.text();

    expect(body).to.equal('');
    expect(response.headers.get('server')).to.match(/Curveball\//);
    expect(response.status).to.equal(200);

    server.close();
  });

  it('should throw an exception for unsupported bodies', async () => {
    const application = new Application();
    application.use((ctx, next) => {
      ctx.response.body = 5;
    });
    const port = getPort();
    const server = application.listen(port);

    const response = await fetch('http://localhost:'+port);
    const body = await response.text();

    expect(body).to.include(': 500');
    expect(response.headers.get('server')).to.match(/Curveball\//);
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
    const port = getPort();
    const server = application.listen(port);

    const response = await fetch('http://localhost:'+port);
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
    const port = getPort();
    const server = application.listen(port);

    const response = await fetch('http://localhost:'+port);
    const body = await response.text();

    expect(body).to.equal('hi');
    expect(response.headers.get('X-Foo')).to.equal('bar');
    expect(response.status).to.equal(200);

    server.close();
  });

  it('should work with object-middlewares', async () => {
    const application = new Application();

    const myMw = {
      // eslint-disable-next-line @typescript-eslint/ban-types
      [middlewareCall]: async (ctx: Context, next: Function) => {
        ctx.response.body = 'hi';
      }
    };

    application.use(myMw);

    const port = getPort();
    const server = application.listen(port);

    const response = await fetch('http://localhost:'+port);
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
    const port = getPort();
    const server = application.listen(port);

    const response = await fetch('http://localhost:'+port);
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
      let error: any;
      application.on('error', err => {
        error = err;
      });
      const port = getPort();
      const server = application.listen(port);

      await fetch('http://localhost:'+port);

      expect(error).to.be.an.instanceof(Error);
      expect(error.message).to.equal('hi');

      server.close();
    });

    it('should return an error message in the response body.', async () => {
      const application = new Application();
      application.use((ctx, next) => {
        throw new Error('hi');
      });
      const port = getPort();
      const server = application.listen(port);

      const response = await fetch('http://localhost:'+port);
      const body = await response.text();

      expect(body).to.include(': 500');

      server.close();
    });
  });

  describe('When no middlewares are defined', () => {
    it('should do nothing', async () => {
      const application = new Application();
      const port = getPort();
      const server = application.listen(port);

      await fetch('http://localhost:'+port);

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
        application.origin,
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
      const port = getPort();
      const server = app.listen(port);

      const response = await fetch('http://localhost:'+port);
      expect(response.status).to.equal(200);

      server.close();
    });
    it('should return 404 when no body was set', async () => {
      const app = new Application();
      const port = getPort();
      const server = app.listen(port);

      const response = await fetch('http://localhost:'+port);
      expect(response.status).to.equal(404);

      server.close();
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
