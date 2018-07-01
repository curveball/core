import { expect } from 'chai';
import { Request } from '../src/request';
import Application from '../src/application';
import fetch from 'node-fetch';

async function getReq() {

  let request:Request;
  const app = new Application();
  const server = app.listen(5555);

  app.use(async ctx => {
    request = ctx.request;
    ctx.response.body = 'response body';
  });

  await fetch('http://localhost:5555/foo/bar?a=1&b=2', {
    method: 'POST',
    headers: {
      accept: 'text/html',
      'content-type': 'text/html; charset=utf-8',
    },
    body: 'hello',
  });

  server.close();

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
          accept: 'text/html',
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
          accept: 'text/html',
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
          accept: 'text/html',
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
          await ctx.request.rawBody('utf-8','3');
        } catch (err) {
          error = err;
        }
        ctx.response.body = 'response body';
      });

      await fetch('http://localhost:5555/foo/bar?a=1&b=2', {
        method: 'POST',
        headers: {
          accept: 'text/html',
          'content-type': 'text/html; charset=utf-8',

        },
        body: 'hello',
      });

      server.close();
      // @ts-ignore
      expect(error.message).to.equal('request entity too large');

    });

  });

});
