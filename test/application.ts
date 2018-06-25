import { expect } from 'chai';
import Application from '../src/application';
import fetch from 'node-fetch';

describe('Application', () => {

  it('should instantiate', () => {

    const application = new Application();
    expect(application).to.be.an.instanceof(Application);

  });

  it('should respond to HTTP requests', async () => {

    const application = new Application();
    application.listen(5555);

    const response = await fetch('http://localhost:5555'); 
    const body = await response.text();

    expect(body).to.equal('hi');
    expect(response.headers.get('server')).to.equal('curveball/' + require('../package.json').version);
    expect(response.status).to.equal(200);

  });

});
