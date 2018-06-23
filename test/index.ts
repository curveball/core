import { hello } from '../src/index';
import { expect } from 'chai';

describe('Hello function', () => {

  it('should return hello world', () => {

    const result = hello();
    expect(result).to.equal('Hello world!');

  });

});
