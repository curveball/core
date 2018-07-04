import { expect } from 'chai';
import Context from '../src/context';
import Request from '../src/node/request';
import Response from '../src/node/response';
import http from 'http';

describe('Context', () => {

  it('should instantiate correctly', () => {

    const nodeRequest = new http.IncomingMessage(<any>null);
    const request = new Request(nodeRequest);

    const nodeResponse = new http.ServerResponse(nodeRequest);
    const response = new Response(nodeResponse);

    const context = new Context(
      request,
      response
    );

    expect(context.request).to.equal(request);
    expect(context.response).to.equal(response);

  });

});
