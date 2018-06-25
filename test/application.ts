import { expect } from 'chai';
import Application from '../src/application';
import fetch from 'node-fetch';

describe('Application', () => {

  it('should instantiate', () => {

    const application = new Application();
    expect(application).to.be.an.instanceof(Application);

  });

  it('should respond to HTTP requests', async () => {

    const application = new Application();
    application.use( (ctx, next) => {
      ctx.response.body = 'hi';
    });
    const server = application.listen(5555);

    const response = await fetch('http://localhost:5555');
    const body = await response.text();

    expect(body).to.equal('hi');
    expect(response.headers.get('server')).to.equal('curveball/' + require('../package.json').version);
    expect(response.status).to.equal(200);

    server.close();

  });

  it('should work with multiple middlewares', async () => {

    const application = new Application();
    application.use( async (ctx, next) => {
      ctx.response.body = 'hi';
      await next();
    });
    application.use( (ctx, next) => {
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

  it('should not call sequential middlewares if next is not called', async () => {

    const application = new Application();
    application.use( (ctx, next) => {
      ctx.response.body = 'hi';
    });
    application.use( (ctx, next) => {
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
      application.use( (ctx, next) => {
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
      application.use( (ctx, next) => {
        throw new Error('hi');
      });
      const server = application.listen(5555);

      const response = await fetch('http://localhost:5555');
      const body = await response.text();
      expect(body).to.equal('Uncaught exception');

      server.close();

    });

  });

  describe('When no middlewares are defined', () => {

    it('should throw an exception', async () => {

      const application = new Application();
      const server = application.listen(5555);

      const response = await fetch('http://localhost:5555');
      const body = await response.text();
      expect(body).to.equal('Uncaught exception');

      server.close();

    });

  });

});
