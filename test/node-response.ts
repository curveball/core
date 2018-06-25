import { expect } from 'chai';
import { ServerResponse, IncomingMessage } from 'http';
import { NodeResponse } from '../src/node-response';
import headersInterfaceTests from './headers-interface-tests';

function getRes() {

  const request = new IncomingMessage(<any>null);
  const inner = new ServerResponse(request);

  inner.setHeader('Content-Type', 'text/html; charset=utf-8');
  inner.statusCode = 200;

  const outer = new NodeResponse(inner);
  return outer;

}

describe('NodeResponse', () => {

  describe('initialization', () => {

    it('should have headers set correctly', () => {

      const res = getRes();
      expect(res.headers.get('content-type')).to.eql('text/html; charset=utf-8');

    });

    it('should have status set correctly', () => {

      const res = getRes();
      expect(res.status).to.equal(200);

    });

    it('should have a "type" property containing "text/html"', () => {

      const res = getRes();
      expect(res.type).to.equal('text/html');

    });

    it('should have a "type" property containing an empty string if no Content-Type was set.', () => {

      const res = getRes();
      res.headers.delete('Content-Type');
      expect(res.type).to.equal('');

    });

  });

  describe('changing the status code', () => {

    it('should not fail', () => {

      const res = getRes();
      res.status = 404;

      expect(res.status).to.equal(404);

    });

  });

});

describe('NodeResponseHeaders', () => {

    const res = getRes();
    headersInterfaceTests(res.headers);    

});

