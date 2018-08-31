import { Middleware } from './application';
import { HeadersInterface, HeadersObject } from './headers';
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

  /**
   * The Request path.
   *
   * Shortcut for request.path
   */
  get path(): string {

    return this.request.path;

  }

  /**
   * HTTP method
   *
   * Shortcut for request.method
   */
  get method(): string {

    return this.request.method;

  }

  /**
   * This object contains parsed query string parameters.
   *
   * This is a shortcut for request.query
   */
  get query(): { [s: string]: string } {

    return this.request.query;

  }

  /**
   * accepts is used for negotation the Content-Type with a client.
   *
   * You can pass a content-type, or an array of content-types.
   * The Content-Types you provide are a list of types your application
   * supports.
   *
   * This function will then return the best possible type based on the Accept
   * header.
   *
   * If no compatible types are found, this function returns null.
   *
   * This is a shortcut to request.accepts()
   */
  accepts(...types: string[]): null | string {

    return this.request.accepts(...types);

  }

  /**
   * HTTP status code.
   *
   * This is a shortcut for response.status
   */
  get status(): number {

    return this.response.status;

  }

  /**
   * Sends an informational (1xx status code) response.
   *
   * This is a shortcut for response.sendInformational()
   */
  sendInformational(status: number, headers?: HeadersInterface | HeadersObject): Promise<void> {

    return this.response.sendInformational(status, headers);

  }

  /**
   * Sends a HTTP/2 push.
   *
   * The passed middleware will be called with a new Context object specific
   * for pushes.
   *
   * This is a shortcut for response.push()
   */
  push(callback: Middleware): Promise<void> {

    return this.response.push(callback);

  }

}
