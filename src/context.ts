import Request from './request';
import Response from './response';

export default class Context {

  request: Request;
  response: Response;

  constructor(req: Request, res: Response) {

    this.request = req;
    this.response = res;

  }

}
