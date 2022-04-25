import { expect } from 'chai';
import { Context } from '../src/context';
import Request from '../src/memory-request';
import Response from '../src/memory-response';

describe('Context', () => {

  it('should instantiate correctly', () => {

    const request = new Request('GET', '/', 'http://localhost');
    const response = new Response('http://localhost');

    const context = new Context(
      request,
      response
    );

    expect(context.request).to.equal(request);
    expect(context.response).to.equal(response);

  });

  it('should forward the "method" property to the request', () => {

    const request = new Request('GET', '/', 'http://localhost');
    const response = new Response('http://localhost');

    const context = new Context(
      request,
      response
    );

    expect(context.method).to.equal('GET');

  });

  it('should forward the "path" property to the request', () => {

    const request = new Request('GET', '/foo', 'http://localhost');
    const response = new Response('http://localhost');

    const context = new Context(
      request,
      response
    );

    expect(context.path).to.equal('/foo');

  });
  it('should forward the "query" property to the request', () => {

    const request = new Request('GET', '/foo?a=b', 'http://localhost');
    const response = new Response('http://localhost');

    const context = new Context(
      request,
      response
    );

    expect(context.query).to.eql({a: 'b'});

  });

  it('should forward the "accepts" method to the request', () => {

    const request = new Request('GET', '/foo', 'http://localhost', {Accept: 'text/html'});
    const response = new Response('http://localhost');

    const context = new Context(
      request,
      response
    );

    expect(context.accepts('text/html')).to.equal('text/html');

  });

  it('should forward the "status" property to the response', () => {

    const request = new Request('GET', '/foo', 'http://localhost');
    const response = new Response('http://localhost');
    response.status = 414;

    const context = new Context(
      request,
      response
    );

    expect(context.status).to.equal(414);

    context.status = 303;

    expect(response.status).to.equal(303);

  });

  it('should forward the "push" method to the response', () => {

    let called = false;
    const request = new Request('GET', '/foo', 'http://localhost');
    const response = new Response('http://localhost');
    response.push = () => {

      called = true;
      return Promise.resolve(undefined);

    };

    const context = new Context(
      request,
      response
    );

    context.push(() => {
      /* Intentionally Empty */
    });

    expect(called).to.equal(true);

  });


  it('should forward the "sendInformational" method to the response', () => {

    let called = false;
    const request = new Request('GET', '/foo', 'http:/localhost');
    const response = new Response('http://localhost');
    response.sendInformational = () => {

      called = true;
      return Promise.resolve();

    };

    const context = new Context(
      request,
      response
    );

    context.sendInformational(103);

    expect(called).to.equal(true);

  });

  describe('ip()', () => {

    it('should return null if the underlying request isn\'t socket-based', () => {

      const request = new Request('GET', '/foo', 'http://localhost');
      const response = new Response('http://localhost');

      const context = new Context(
        request,
        response
      );
      expect(context.ip()).to.equal(null);

    });
    it('should call the ip() method on the request if it\'s socket-based', () => {

      const request = new Request('GET', '/foo', 'http://localhost');
      (request as any).ip = () => '127.0.0.1';
      const response = new Response('http://localhost');

      const context = new Context(
        request,
        response
      );
      expect(context.ip()).to.equal('127.0.0.1');

    });

  });

  describe('redirect', () => {
    it('should set the location header to /home with default status code 303', async () => {
      const originalTarget = '/foo';
      const newTarget = '/bar';
      const defaultStatus = 303;

      const request = new Request('GET', originalTarget, 'http://localhost');
      const response = new Response('http://localhost');

      const context = new Context(
        request,
        response
      );

      context.redirect(newTarget);

      expect(context.response.headers.get('Location')).equals(newTarget);
      expect(context.status).equals(defaultStatus);
    });

    it('should redirect to /home with provided status code 301', async () => {
      const originalTarget = '/foo';
      const originalStatus = 303;
      const newTarget = '/bar';
      const newStatus = 301;

      const request = new Request('GET', originalTarget, 'http://localhost');
      const response = new Response('http://localhost');

      const context = new Context(
        request,
        response
      );

      context.redirect(newStatus, newTarget);

      expect(context.status).equals(newStatus);
      expect(context.status).not.equals(originalStatus);
      expect(context.response.headers.get('Location')).not.equals(originalTarget);
      expect(context.response.headers.get('Location')).equals(newTarget);
    });
  });

});
