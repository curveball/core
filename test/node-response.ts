import { expect } from 'chai';
import { ServerResponse, IncomingMessage } from 'http';
import { NodeResponse } from '../src/node-response';
import headersInterfaceTests from './headers-interface-tests';
import sinon from 'sinon';

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

  describe('sendInformational', () => {

    it('should send a 103 Status when called with a HTTP/1 response', async () => {

      const res = getRes();
      // @ts-ignore - Ignoring 'private' accessor.
      const mock = sinon.mock(res.inner);

      const writeRawMock = mock.expects('_writeRaw');
      writeRawMock.callsArgWith(2, null, true);

      await res.sendInformational(103, { Foo: 'bar'});

      const body = `HTTP/1.1 103 Early Hints\r\nFoo: bar\r\n\r\n`;

      expect(writeRawMock.calledOnce).to.equal(true);
      expect(writeRawMock.calledWith(body)).to.equal(true);

      mock.restore();

    });

  });

});

describe('NodeResponseHeaders', () => {

    const res = getRes();
    headersInterfaceTests(res.headers);    

});

