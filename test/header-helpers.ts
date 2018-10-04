import { is } from '../src/header-helpers';
import MemoryRequest from '../src/memory-request';
import { expect } from 'chai';

describe('Header helpers', () => {

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
    ];

    for(const test of tests) {

      it(`should return ${test[2]} for a Content-Type of ${test[0]} and an argument ${test[1]}`, () => {

        const request = new MemoryRequest('GET', '/');
        request.headers.set('Content-Type', test[0]);
        expect(is(request, test[1])).to.eql(test[2]);

      });

    }

    it(`should return false when no Content-Type was set`, () => {

      const request = new MemoryRequest('GET', '/');
      expect(is(request, 'json')).to.eql(false);

    });

  });

});
