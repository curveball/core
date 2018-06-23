import { expect } from 'chai';
import { IncomingMessage } from 'http';
import { NodeRequest } from '../src/node-request';

function getReq() {

  const inner = new IncomingMessage(<any>null);
  inner.method = 'GET';
  inner.headers ={
    'content-type': 'text/html'
  };
  inner.url = 'https://example.org/foo/bar';

  const outer = new NodeRequest(inner);
  return outer;

}

describe('node-request', () => {

  describe('initialization', () => {

    it('should have headers set correctly', () => {

      const req = getReq();

      expect(req.headers).to.eql({
        'content-type': 'text/html'
      });

    });

    it('should have path set correctly', () => {

      const req = getReq();
      expect(req.path).to.eql('/foo/bar');

    });

    it('should have a "method"', () => {

      const req = getReq();
      expect(req.method).to.eql('GET');

    });

  });

});
