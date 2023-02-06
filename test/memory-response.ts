import { expect } from 'chai';
import { MemoryResponse } from '../src/index.js';

function getRes() {

  const response = new MemoryResponse('http://localhost');
  response.headers.set('Content-Type', 'text/html; charset=utf-8');
  response.status = 200;

  return response;

}

describe('MemoryResponse', () => {

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

    it('should have a working "is()" function"', () => {

      const res = getRes();
      expect(res.is('html')).to.equal(true);

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

    it('should be callable but do nothing', async () => {

      const res = getRes();
      expect(await res.sendInformational(102)).to.equal(undefined);

    });

  });
  describe('push', () => {

    it('should be callable but do nothing', async () => {

      const res = getRes();
      let notCalled = true;

      res.push( ctx => {
        notCalled = false;
      });
      expect(notCalled).is.true;

    });

  });

  describe('redirect', () => {
    it('should set the location header to /home with default status code 303', async () => {
      const res = getRes();
      const defaultStatus = 303;
      const originalTarget = res.headers.get('Referer');
      const newTarget = '/bar';

      res.redirect(newTarget);

      expect(res.headers.get('Location')).equals(newTarget);
      expect(res.headers.get('Location')).not.equals(originalTarget);
      expect(res.status).equals(defaultStatus);
    });

    it('should redirect to /home with provided status code 301', async () => {
      const res = getRes();
      const defaultStatus = 303;
      const newStatus = 301;

      const newTarget = '/bar';
      const originalTarget = res.headers.get('Referer');

      res.redirect(newStatus, newTarget);

      expect(res.status).equals(newStatus);
      expect(res.status).not.equals(defaultStatus);

      expect(res.headers.get('Location')).equals(newTarget);
      expect(res.headers.get('Location')).not.equals(originalTarget);
    });
  });

});
