import { expect } from 'chai';
import { ServerResponse, IncomingMessage } from 'http';
import { NodeResponse } from '../src/node-response';
import headersInterfaceTests from './headers-interface-tests';

function getRes() {

  const request = new IncomingMessage(<any>null);
  const inner = new ServerResponse(request);

  inner.setHeader('Content-Type', 'text/html');
  inner.statusCode = 200;

  const outer = new NodeResponse(inner);
  return outer;

}

describe('NodeResponse', () => {

  describe('initialization', () => {

    it('should have headers set correctly', () => {

      const res = getRes();
      expect(res.headers.get('content-type')).to.eql('text/html');

    });

    it('should have status set correctly', () => {

      const req = getRes();
      expect(req.status).to.eql(200);

    });

  });

});

describe('NodeResponseHeaders', () => {

    const res = getRes();
    headersInterfaceTests(res.headers);    

});

