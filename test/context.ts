import { expect } from 'chai';
import Context from '../src/context';
import Request from '../src/memory-request';
import Response from '../src/memory-response';

describe('Context', () => {

  it('should instantiate correctly', () => {

    const request = new Request();
    const response = new Response();

    const context = new Context(
      request,
      response
    );

    expect(context.request).to.equal(request);
    expect(context.response).to.equal(response);

  });

  it('should forward the "method" property to the request', () => {

    const request = new Request('GET');
    const response = new Response();

    const context = new Context(
      request,
      response
    );

    expect(context.method).to.equal('GET');

  });

  it('should forward the "path" property to the request', () => {

    const request = new Request('GET', '/foo');
    const response = new Response();

    const context = new Context(
      request,
      response
    );

    expect(context.path).to.equal('/foo');

  });
  it('should forward the "query" property to the request', () => {

    const request = new Request('GET', '/foo?a=b');
    const response = new Response();

    const context = new Context(
      request,
      response
    );

    expect(context.query).to.eql({a: 'b'});

  });

  it('should forward the "accepts" method to the request', () => {

    const request = new Request('GET', '/foo', {Accept: 'text/html'});
    const response = new Response();

    const context = new Context(
      request,
      response
    );

    expect(context.accepts('text/html')).to.equal('text/html');

  });

  it('should forward the "status" property to the response', () => {

    const request = new Request('GET', '/foo');
    const response = new Response();
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
    const request = new Request('GET', '/foo');
    const response = new Response();
    response.push = () => {

      called = true;
      return Promise.resolve(undefined);

    };

    const context = new Context(
      request,
      response
    );

    context.push(() => {});

    expect(called).to.equal(true);

  });


  it('should forward the "sendInformational" method to the response', () => {

    let called = false;
    const request = new Request('GET', '/foo');
    const response = new Response();
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

      const request = new Request('GET', '/foo');
      const response = new Response();

      const context = new Context(
        request,
        response
      );
      expect(context.ip()).to.equal(null);

    });
    it('should call the ip() method on the request if it\'s socket-based', () => {

      const request = new Request('GET', '/foo');
      (<any> request).ip = () => '127.0.0.1';
      const response = new Response();

      const context = new Context(
        request,
        response
      );
      expect(context.ip()).to.equal('127.0.0.1');

    });

  });

});
