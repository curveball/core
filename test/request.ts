import { expect } from 'chai';
import { Headers } from '../src/headers';
import { Request } from '../src/request';
import { HeadersObject } from '../src/headers';
import { Readable } from 'stream';

class FakeRequest extends Request {

  constructor(method: string, path: string, headers: HeadersObject, body: any = '') {

    super(method, path);
    this.headers = new Headers(headers);
    this.body = Buffer.from(body);

  }

  async rawBody(encoding?: string, limit?: string): Promise<string>;
  async rawBody(encoding?: undefined, limit?: string): Promise<Buffer>; 
  async rawBody(encoding?: undefined, limit?: string): Promise<Buffer | string> {

    if (encoding) {
      return (this.body as any).toString(encoding);
    } else {
      return (this.body as any);
    }

  }
  /**
   * getStream returns a Node.js readable stream.
   *
   * A stream can typically only be read once.
   */
  getStream(): Readable {

    const s = new Readable();
    s.push(this.body);
    return s;

  }

}

function getReq() {

  return new FakeRequest(
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

describe('Request', () => {

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

  it('should have a working "is()" function"', () => {

    const res = getReq();
    expect(res.is('html')).to.equal(true);

  });

  it('should have a "type" property containing an empty string if no Content-Type was set.', async () => {

    const req = await getReq();
    req.headers.delete('Content-Type');
    expect(req.type).to.equal('');

  });

  it('should have a working prefer() function', () => {

    const req = new FakeRequest('GET', '/foo', { Prefer: 'handling=lenient, respond-async' });
    expect(req.prefer('handling')).to.equal('lenient');
    expect(req.prefer('respond-async')).to.equal(true);
    expect(req.prefer('return')).to.equal(false);

  });

});
