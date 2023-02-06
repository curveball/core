import { expect } from 'chai';
import { conditionalCheck, MemoryRequest } from '../src/index.js';

describe('conditionals', () => {

  describe('If-Match on a resource that has ETag "a"', () => {

    const tests: any = [
      [200, 'GET', '"a"'],
      [200, 'PUT', '"a"'],
      [412, 'GET', '"b"'],
      [412, 'PUT', '"b"'],
      [200, 'GET', '*'],
      [200, 'GET', '"b", "a"'],
      [412, 'GET', '"b", "c"'],
    ];

    for (const [status, method, header] of tests) {
      it(`should return ${status} when doing ${method} with If-Match: ${header}`, () => {

        const request = new MemoryRequest(method, '/foo', 'http://localhost', { 'If-Match': header });
        expect(conditionalCheck(request, null, '"a"')).to.eql(status);

      });
    }

  });

  describe('If-Match on a resource that has no ETag', () => {

    const tests: any = [
      [412, 'GET', '"a"'],
      [412, 'PUT', '"a"'],
      [412, 'GET', '*'],
      [412, 'GET', '"b", "c"'],
    ];

    for (const [status, method, header] of tests) {
      it(`should return ${status} when doing ${method} with If-Match: ${header}`, () => {

        const request = new MemoryRequest(method, '/foo', 'http://localhost', { 'If-Match': header });
        expect(conditionalCheck(request, null, null)).to.eql(status);

      });
    }

  });
  describe('If-None-Match on a resource that has ETag "a"', () => {

    const tests: any = [
      [304, 'GET', '"a"'],
      [412, 'PUT', '"a"'],
      [200, 'GET', '"b"'],
      [200, 'PUT', '"b"'],
      [304, 'GET', '*'],
      [412, 'PUT', '*'],
      [304, 'GET', '"b", "a"'],
      [200, 'GET', '"b", "c"'],
      [412, 'PUT', '"b", "a"'],
      [200, 'PUT', '"b", "c"'],
    ];

    for (const [status, method, header] of tests) {
      it(`should return ${status} when doing ${method} with If-None-Match: ${header}`, () => {

        const request = new MemoryRequest(method, '/foo', 'http://localhost', { 'If-None-Match': header });
        expect(conditionalCheck(request, null, '"a"')).to.eql(status);

      });
    }

  });

  describe('If-None-Match on a resource that has no ETag', () => {

    const tests: any = [
      [200, 'GET', '"a"'],
      [200, 'PUT', '"a"'],
      [200, 'PUT', '*'],
      [200, 'GET', '"b", "c"'],
    ];

    for (const [status, method, header] of tests) {
      it(`should return ${status} when doing ${method} with If-None-Match: ${header}`, () => {

        const request = new MemoryRequest(method, '/foo', 'http://localhost', { 'If-None-Match': header });
        expect(conditionalCheck(request, null, null)).to.eql(status);

      });
    }

  });

  describe('If-Modified-Since on a resource that changed Mar 6th, 2020', () => {

    const tests: any = [
      [200, 'GET', 'Thu, 5 Mar 2020 00:00:00 GMT'],
      [200, 'PUT', 'Thu, 5 Mar 2020 00:00:00 GMT'],
      [304, 'GET', 'Sat, 7 Mar 2020 00:00:00 GMT'],
      [200, 'PUT', 'Sat, 7 Mar 2020 00:00:00 GMT'],
    ];

    for (const [status, method, headerDate] of tests) {
      it(`should return ${status} when doing ${method} with If-Modified-Since: ${headerDate}`, () => {

        const request = new MemoryRequest(method, '/foo', 'http://localhost', { 'If-Modified-Since': headerDate });
        expect(conditionalCheck(request, new Date('2020-03-06 00:00:00'), null)).to.eql(status);

      });
    }

  });

  describe('If-Modified-Since on a resource with no modification date', () => {

    it('should return 200', () => {

      const request = new MemoryRequest('GET', '/foo', 'http://localhost', { 'If-Modified-Since': 'Thu, 7 Mar 2019 14:49:00 GMT' });
      expect(conditionalCheck(request, null, null)).to.eql(200);

    });

  });

  describe('If-Unmodified-Since on a resource that changed Mar 6th, 2020', () => {

    const tests: any = [
      [412, 'GET', 'Thu, 5 Mar 2020 14:49:00 GMT'],
      [412, 'PUT', 'Thu, 5 Mar 2020 14:49:00 GMT'],
      [200, 'GET', 'Sat, 7 Mar 2020 14:49:00 GMT'],
      [200, 'PUT', 'Sat, 7 Mar 2020 14:49:00 GMT'],
    ];

    for (const [status, method, headerDate] of tests) {
      it(`should return ${status} when doing ${method} with If-Unmodified-Since: ${headerDate}`, () => {

        const request = new MemoryRequest(method, '/foo', 'http://localhost', { 'If-Unmodified-Since': headerDate });
        expect(conditionalCheck(request, new Date('2020-03-06 00:00:00'), null)).to.eql(status);

      });
    }

  });

  describe('If-Unmodified-Since on a resource with no modification date', () => {

    it('should return 412', () => {

      const request = new MemoryRequest('GET', '/foo', 'http://localhost', { 'If-Unmodified-Since': 'Thu, 7 Mar 2019 14:49:00 GMT' });
      expect(conditionalCheck(request, null, null)).to.eql(412);

    });

  });

});
