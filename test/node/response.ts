import { expect } from 'chai';
import http from 'http';
import http2 from 'http2';
import sinon from 'sinon';
import Application from '../../src/application';
import { Headers } from '../../src/headers';
import { NodeResponse } from '../../src/node/response';
import headersInterfaceTests from '../headers-interface-tests';

function getRes() {

  const request = new http.IncomingMessage(<any> null);
  const inner = new http.ServerResponse(request);

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
      expect(res.status).to.equal(404);

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

  it('should update the Content-Type header when "type" is set', async () => {

    const req = await getRes();
    req.type = 'text/plain';
    expect(req.headers.get('Content-Type')).to.equal('text/plain');

  });


  describe('changing the status code', () => {

    it('should not fail', () => {

      const res = getRes();
      res.status = 404;

      expect(res.status).to.equal(404);

    });

  });

  describe('sendInformational', () => {

    it('should send a 100 Status when called via HTTP/1', async () => {

      const res = getRes();
      // @ts-ignore - Ignoring 'private' accessor.
      const mock = sinon.mock(res.inner);

      const writeRawMock = mock.expects('_writeRaw');
      writeRawMock.callsArgWith(2, null, true);

      await res.sendInformational(100);
      const body = 'HTTP/1.1 100 Continue\r\n\r\n';

      expect(writeRawMock.calledOnce).to.equal(true);
      expect(writeRawMock.calledWith(body)).to.equal(true);

      mock.restore();

    });

    it('should send a 103 Status when called via HTTP/1', async () => {

      const res = getRes();
      // @ts-ignore - Ignoring 'private' accessor.
      const mock = sinon.mock(res.inner);

      const writeRawMock = mock.expects('_writeRaw');
      writeRawMock.callsArgWith(2, null, true);

      await res.sendInformational(103, {
        Foo: 'bar',
        Many: ['1', '2']
      });

      const body = 'HTTP/1.1 103 Early Hints\r\nFoo: bar\r\nMany: 1\r\nMany: 2\r\n\r\n';

      expect(writeRawMock.calledOnce).to.equal(true);
      expect(writeRawMock.calledWith(body)).to.equal(true);

      mock.restore();

    });

    it('should also correctly send the 103 status when headers are passed as a HeadersInterface', async () => {

      const res = getRes();
      // @ts-ignore - Ignoring 'private' accessor.
      const mock = sinon.mock(res.inner);

      const writeRawMock = mock.expects('_writeRaw');
      writeRawMock.callsArgWith(2, null, true);

      await res.sendInformational(103, new Headers({
        Foo: 'bar',
        Many: ['1', '2']
      }));

      const body = 'HTTP/1.1 103 Early Hints\r\nfoo: bar\r\nmany: 1\r\nmany: 2\r\n\r\n';

      expect(writeRawMock.calledOnce).to.equal(true);
      expect(writeRawMock.calledWith(body)).to.equal(true);

      mock.restore();

    });

    it('should send a 103 Status when called with a HTTP/2 response', async () => {

      const app = new Application();
      const server = http2.createServer({}, app.callback());
      let client: any;

      server.listen(8555);

      return new Promise( (resolve, reject) => {
        app.use(async ctx => {

          await ctx.response.sendInformational(103, {
            Foo: 'bar',
            Many: ['1', '2']
          });
          ctx.response.body = 'hello';

        });

        client = http2.connect('http://localhost:8555');

        const req = client.request({':path': '/'});
        req.on('headers', (headers: http2.IncomingHttpHeaders, flags: number) => {
          resolve(headers);
        });
        req.setEncoding('utf-8');
        req.on('end', () => { client.close(); });
        req.end();
      }).then(headers => {
        client.close();
        server.close();
        expect(headers).to.deep.equal({
          ':status': 103,
          'foo': 'bar',
          'many': '1, 2',
        });
      });
    });

  });

});

describe('NodeResponseHeaders', () => {

    const res = getRes();
    headersInterfaceTests(res.headers);

});

