import { expect } from 'chai';
import { IncomingMessage } from 'http';
import { NodeRequest } from '../src/node-request';

function getReq() {

  const inner = new IncomingMessage(<any>null);
  inner.method = 'GET';
  inner.headers ={
    'Content-Type': 'text/html; charset=utf-8'
  };
  inner.url = 'https://example.org/foo/bar?a=1&b=2';

  const outer = new NodeRequest(inner);
  return outer;

}

describe('node-request', () => {

  describe('initialization', () => {

    it('should have headers set correctly', () => {

      const req = getReq();
      expect(req.headers.get('content-type')).to.eql('text/html; charset=utf-8');

    });

    it('should have path set correctly', () => {

      const req = getReq();
      expect(req.path).to.eql('/foo/bar');

    });

    it('should have a "method"', () => {

      const req = getReq();
      expect(req.method).to.eql('GET');

    });

    it('should have a "query" property containing query parameters', () => {

      const req = getReq();
      expect(req.query).to.eql({
        a: '1',
        b: '2'
      });

    });

    it('should have a "type" property containing "text/html"', () => {

      const req = getReq();
      expect(req.type).to.equal('text/html');

    });

    it('should have a "type" property containing an empty string if no Content-Type was set.', () => {

      const req = getReq();
      req.headers.delete('Content-Type');
      expect(req.type).to.equal('');

    });

  });

});
