import { expect } from 'chai';
import { MemoryRequest } from '../src/memory-request';
import { Headers } from '../src/headers';

function getReq() {

  return new MemoryRequest(
    'POST',
    '/foo?a=1&b=2',
    {
      'X-FOO': 'BAR',
      'Accept': 'text/html',
      'Content-Type': 'text/html',
    },
    'hello world',
  );

}

describe('MemoryRequest', () => {

  describe('constructing', async () => {

    it('should get its method set correctly', () => {

      expect(getReq().method).to.equal('POST');

    });

    it('should have its path set correctly', () => {

      expect(getReq().path).to.equal('/foo');

    });

    it('should have its headers set correctly', () => {

      expect(getReq().headers.get('x-foo')).to.eql('BAR');

    });

    it('should have its body set correctly',  async () => {

      expect(await getReq().rawBody('utf-8')).to.equal('hello world');

    });

    it('should work with HeadersInterface', async () => {

      const headers = new Headers();
      const request = new MemoryRequest('GET', '/', headers);

      expect(request.headers).to.equal(headers);

    });

  });

  describe('accepts function', () => {

    it('should work', async () => {

      const req = await getReq();
      const result = req.accepts('application/json', 'text/html');
      expect(result).to.equal('text/html');

    });

    it('should return false if there was no acceptable match.', async () => {

      const req = await getReq();
      const result = req.accepts('application/json');
      expect(result).to.equal(null);

    });

    it('should return the first accepts header if no Accept header was provided.', async () => {

      const req = await getReq();
      req.headers.delete('accept');
      const result = req.accepts('application/json');
      expect(result).to.equal('application/json');

    });

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

  describe('rawBody', async () => {

    it('should return a string when passing encoding as utf-8', async () => {

      const req = new MemoryRequest(
        'POST',
        '/',
        {},
        'hello'
      );
      const body = await req.rawBody('utf-8');

      expect(body).to.equal('hello');

    });

    it('should return a buffer when not passing an encoding parameter', async () => {

      const req = new MemoryRequest(
        'POST',
        '/',
        {},
        'hello'
      );
      const body = await req.rawBody();

      expect(body).to.deep.equal(Buffer.from('hello'));

    });

    it('should return an empty buffer for empty requests', async () => {

      const req = new MemoryRequest(
        'POST',
        '/',
        {}
      );

      const body = await req.rawBody();
      expect(body).to.deep.equal(Buffer.from(''));

    });

    it('should work with arbitrary body objects', async () => {

      const req = new MemoryRequest(
        'POST',
        '/',
        {},
        { foo: 'bar' },
      );

      const body = await req.rawBody('utf-8');
      expect(body).to.deep.equal('{"foo":"bar"}');

    });
    
    it('should work with buffers', async () => {

      const req = new MemoryRequest(
        'POST',
        '/',
        {},
        Buffer.from('hello')
      );

      const body = await req.rawBody('utf-8');
      expect(body).to.deep.equal('hello');

    });

    it('should pass through buffers', async () => {

      const buffer = Buffer.from('hello');
      const req = new MemoryRequest(
        'POST',
        '/',
        {},
        buffer
      );

      const body = await req.rawBody();
      expect(body).to.equal(buffer);

    });

  });

});
