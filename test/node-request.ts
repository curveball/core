import { expect } from 'chai';
import { IncomingMessage } from 'http';
import { NodeRequest } from '../src/node-request';


describe('node-request', () => {

  it('should have all its properties correctly set after instantiation', () => {

    const inner = new IncomingMessage(<any>null);
    inner.headers ={ 
      'content-type': 'text/html'
    };

    const outer = new NodeRequest(inner);

    expect(outer.headers).to.eql({
      'content-type': 'text/html'
    });

  });

});
