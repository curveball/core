import { expect } from 'chai';
import fetch from 'node-fetch';
import Application from '../../src/application';
import { Request } from '../../src/request';

async function getReq() {

  let request: Request;
  const app = new Application();
  const server = app.listen(5555);

  app.use(async ctx => {
    request = ctx.request;
    ctx.response.body = 'response body';
  });

  await fetch('http://localhost:5555/foo/bar?a=1&b=2', {
    method: 'POST',
    headers: {
      'accept': 'text/html',
      'content-type': 'text/html; charset=utf-8',
    },
    body: 'hello',
  });

  server.close();

  // @ts-ignore
  return request;

}

describe('NodeRequest', () => {

  it('should have headers set correctly', async () => {

    const req = await getReq();
    expect(req.headers.get('content-type')).to.eql('text/html; charset=utf-8');

  });

  it('should have path set correctly', async () => {

    const req = await getReq();
    expect(req.path).to.eql('/foo/bar');

  });

  it('should have a "method"', async () => {

    const req = await getReq();
    expect(req.method).to.eql('POST');

  });

  it('should have a "query" property containing query parameters', async () => {

    const req = await getReq();
    expect(req.query).to.eql({
      a: '1',
      b: '2'
    });

  });

  it('should have a "type" property containing "text/html"', async () => {

    const req = await getReq();
    expect(req.type).to.equal('text/html');

  });

  it('should have a working "is()" function"', async () => {

    const res = await getReq();
    expect(res.is('html')).to.equal(true);

  });

  it('should have a "type" property containing an empty string if no Content-Type was set.', async () => {

    const req = await getReq();
    req.headers.delete('Content-Type');
    expect(req.type).to.equal('');

  });

  it('The "accepts" method should work', async () => {

    const req = await getReq();
    const result = req.accepts('application/json', 'text/html');
    expect(result).to.equal('text/html');

  });

  it('The "accepts" method should return false if there was no acceptable match.', async () => {

    const req = await getReq();
    const result = req.accepts('application/json');
    expect(result).to.equal(null);

  });

  describe('rawBody', async () => {

    it('should return a string when passing encoding as utf-8', async () => {

      let body;
      const app = new Application();
      const server = app.listen(5555);

      app.use(async ctx => {
        body = await ctx.request.rawBody('utf-8');
        ctx.response.body = 'response body';
      });

      await fetch('http://localhost:5555/foo/bar?a=1&b=2', {
        method: 'POST',
        headers: {
          'accept': 'text/html',
          'content-type': 'text/html; charset=utf-8',

        },
        body: 'hello',
      });

      server.close();
      expect(body).to.equal('hello');

    });

    it('should return a buffer when not passing an encoding parameter', async () => {

      let body;
      const app = new Application();
      const server = app.listen(5555);

      app.use(async ctx => {
        body = await ctx.request.rawBody();
        ctx.response.body = 'response body';
      });

      await fetch('http://localhost:5555/foo/bar?a=1&b=2', {
        method: 'POST',
        headers: {
          'accept': 'text/html',
          'content-type': 'text/html; charset=utf-8',

        },
        body: 'hello',
      });

      server.close();
      expect(body).to.deep.equal(Buffer.from('hello'));

    });

    it('should return an empty buffer for empty requests', async () => {

      let body;
      const app = new Application();
      const server = app.listen(5555);

      app.use(async ctx => {
        body = await ctx.request.rawBody();
        ctx.response.body = 'response body';
      });

      await fetch('http://localhost:5555/foo/bar?a=1&b=2', {
        method: 'GET',
        headers: {
          'accept': 'text/html',
          'content-type': 'text/html; charset=utf-8',

        }
      });

      server.close();
      expect(body).to.deep.equal(Buffer.from(''));

    });

    it('should throw an error when the request body exceeds the limit', async () => {

      const app = new Application();
      const server = app.listen(5555);
      let error;

      app.use(async ctx => {
        try {
          await ctx.request.rawBody('utf-8', '3');
        } catch (err) {
          error = err;
        }
        ctx.response.body = 'response body';
      });

      await fetch('http://localhost:5555/foo/bar?a=1&b=2', {
        method: 'POST',
        headers: {
          'accept': 'text/html',
          'content-type': 'text/html; charset=utf-8',

        },
        body: 'hello',
      });

      server.close();
      // @ts-ignore
      expect(error.message).to.equal('request entity too large');

    });

  });

  describe('ip()', () => {

    it('should return the ip address of the client that\'s connecting', async () => {

      const app = new Application();
      const server = app.listen(5555);
      let ip;

      app.use(async ctx => {
        ip = ctx.ip();
      });

      await fetch('http://localhost:5555/foo/bar?a=1&b=2', {
        method: 'POST',
        headers: {
          'accept': 'text/html',
          'content-type': 'text/html; charset=utf-8',

        },
        body: 'hello',
      });

      server.close();
      expect(ip).to.eql('::ffff:127.0.0.1');

    });

    it('should use X-Forwarded-For if trustProxy was true', async () => {

      const app = new Application();
      const server = app.listen(5555);
      let ip;

      app.use(async ctx => {
        ip = ctx.ip(true);
      });

      await fetch('http://localhost:5555/foo/bar?a=1&b=2', {
        method: 'POST',
        headers: {
          'accept': 'text/html',
          'content-type': 'text/html; charset=utf-8',
          'x-forwarded-for': '127.0.0.2',

        },
        body: 'hello',
      });

      server.close();
      expect(ip).to.eql('127.0.0.2');

    });

    it('should use the clients ip if trustProxy was true but there was no XFF header', async () => {

      const app = new Application();
      const server = app.listen(5555);
      let ip;

      app.use(async ctx => {
        ip = ctx.ip(true);
      });

      await fetch('http://localhost:5555/foo/bar?a=1&b=2', {
        method: 'POST',
        headers: {
          'accept': 'text/html',
          'content-type': 'text/html; charset=utf-8',
        },
        body: 'hello',
      });

      server.close();
      expect(ip).to.eql('::ffff:127.0.0.1');

    });
  });

});
