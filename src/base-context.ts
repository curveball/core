import { Middleware } from './application';
import { Context } from './context';
import { HeadersInterface, HeadersObject } from './headers';
import Request from './request';
import Response from './response';
import * as WebSocket from 'ws';

/**
 * The Context object encapsulates a single HTTP request.
 *
 * It has references to the internal request and response object.
 */
export default class BaseContext<ReqT = any, ResT = any> implements Context<ReqT, ResT> {

  /**
   * HTTP Request
   */
  request: Request<ReqT>;

  /**
   * HTTP Response
   */
  response: Response<ResT>;

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
    [s: string]: any;
  };

  constructor(req: Request<ReqT>, res: Response<ResT>) {

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
   * Sets the HTTP response status code.
   *
   * This is a shortcut for response.status.
   */
  set status(value: number) {

    this.response.status = value;

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

  /**
   * returns the ip address of the client that's trying to connect.
   *
   * If 'trustProxy' is set to true, it means the server is running behind a
   * proxy, and the X-Forwarded-For header should be parsed instead.
   *
   * If there was no real HTTP client, this method will return null.
   */
  ip(trustProxy = false): null | string {

    if ((this.request as any).ip !== undefined) {
      return (this.request as any).ip(trustProxy);
    }
    return null;

  }

  redirect(address: string): void;
  redirect(status: number, address: string): void;
  /**
   * redirect redirects the response with an optionally provided HTTP status
   * code in the first position to the location provided in address. If no status
   * is provided, 303 See Other is used.
   *
   * It is a wrapper method for the underlying Response.redirect function.
   *
   * @param {(string|number)} addrOrStatus if passed a string, the string will
   * be used to set the Location header of the response object and the default status
   * of 303 See Other will be used. If a number, an addressed must be passed in the second
   * argument.
   * @param {string} address If addrOrStatus is passed a status code, this value is
   * set as the value of the response's Location header.
   */
  redirect(addrOrStatus: string|number, address = ''): void {
    if (typeof(addrOrStatus) === 'number') {
      return this.response.redirect(addrOrStatus, address);
    } else {
      return this.response.redirect(addrOrStatus);
    }
  }

  /**
   * WebSocket object.
   *
   * If the current request is a websocket request, this proprerty will be set
   *
   * @see https://github.com/websockets/ws#simple-server
   */
  webSocket?: WebSocket;

}

