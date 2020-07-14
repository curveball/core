import { is, splitHeader, parsePrefer } from '../src/header-helpers';
import MemoryRequest from '../src/memory-request';
import { expect } from 'chai';

describe('Header helpers', () => {

  describe('splitHeader', () => {

    it('should do its goddamn job', () => {
      expect(splitHeader('foo')).to.eql(['foo']);
      expect(splitHeader('foo,  bar ')).to.eql(['foo','bar']);
    });

  });


  describe('is', () => {

    const tests: ([string, string, boolean])[] = [
      ['application/hal+json', 'application/hal+json', true],
      ['application/hal+json', 'application/json', true],
      ['application/hal+json', 'application/hal', false],
      ['application/hal+json', 'hal+json', true],
      ['application/hal+json', 'json', true],
      ['application/hal+json', 'hal', false],
      ['application/json', 'application/hal+json', false],
      ['application/json', 'application/json', true],
      ['application/json', 'hal+json', false],
      ['application/json', 'json', true],
      ['application/json', 'hal', false],
      ['application/json', 'application/*', true],
      ['application/json', 'image/*', false],
    ];

    for(const test of tests) {

      it(`should return ${test[2]} for a Content-Type of ${test[0]} and an argument ${test[1]}`, () => {

        const request = new MemoryRequest('GET', '/');
        request.headers.set('Content-Type', test[0]);
        expect(is(request, test[1])).to.eql(test[2]);

      });

    }

    it('should return false when no Content-Type was set', () => {

      const request = new MemoryRequest('GET', '/');
      expect(is(request, 'json')).to.eql(false);

    });

  });

  describe('parsePrefer', () => {

    it('should parse simple values', () => {
      expect(
        parsePrefer('respond-async')
      ).to.eql({
        'respond-async': true
      });

    });

    it('should parse more complex values', () => {
      expect(
        parsePrefer('handling=lenient, RETURN=representation, wait=5, foobar')
      ).to.eql({
        handling: 'lenient',
        return: 'representation',
        wait: '5',
        foobar: true,
      });
    });

    it('should handle null header values', () => {

      expect(
        parsePrefer(null)
      ).to.eql({
      });

    });

  });

});
