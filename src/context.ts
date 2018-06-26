import Request from './request';
import Response from './response';

/**
 * The Context object encapsulates a single HTTP request.
 *
 * It has references to the internal request and response object.
 */
export default class Context {

  /**
   * HTTP Request
   */
  request: Request;

  /**
   * HTTP Response
   */
  response: Response;

  /**
   * State information.
   *
   * The state property can be used to store request-specific state
   * information. It's used to pass information between middlewares.
   *
   * For example, and authentication middleware might set a username
   * in this property for other middlewares to use.
   */
  state: {
    [s: string]: any
  };

  constructor(req: Request, res: Response) {

    this.request = req;
    this.response = res;
    this.state = {};

  }

}
