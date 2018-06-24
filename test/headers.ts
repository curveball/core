import { expect } from 'chai';
import { Headers } from '../src/headers';

describe('Headers class', () => {

  describe('When instantiating with an object', () => {

    it('should make its values available', () => {

      const headers = new Headers({
        'Content-Type': 'text/html',
      });

      expect(headers.get('content-type')).to.equal('text/html');

    });

  });

  describe('get', () => {

    it('should return null when a header was not set', () => {

      const headers = new Headers({
        'Content-Type': 'text/html',
      });
      expect(headers.get('foo')).to.equal(null);

    });

    it('should return a string for string headers', () => {

      const headers = new Headers({
        'Content-Type': 'text/html',
      });
      expect(headers.get('Content-Type')).to.equal('text/html');

    });

    it('should return a string for number headers', () => {

      const headers = new Headers({
        'Content-Length': 5,
      });
      expect(headers.get('Content-Length')).to.equal('5');

    });

    it('should concatenate multiple headers with the same name', () => {

      const headers = new Headers({
        'Accept': ['text/html', 'text/plain'],
      });
      expect(headers.get('Accept')).to.equal('text/html,text/plain');

    });

  });

});
