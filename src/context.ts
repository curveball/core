import { Middleware } from './application';
import { HeadersInterface, HeadersObject } from './headers';
import Request from './request';
import Response from './response';
import * as WebSocket from 'ws';

export interface Context<ReqT = unknown, ResT = any> {

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

  /**
   * The Request path.
   *
   * Shortcut for request.path
   */
  path: string;

  /**
   * HTTP method
   *
   * Shortcut for request.method
   */
   method: string;

  /**
   * This object contains parsed query string parameters.
   *
   * This is a shortcut for request.query
   */
  query: { [s: string]: string };

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
  accepts(...types: string[]): null | string;

  /**
   * HTTP status code.
   *
   * This is a shortcut for response.status
   */
  status: number;

  /**
   * Sends an informational (1xx status code) response.
   *
   * This is a shortcut for response.sendInformational()
   */
  sendInformational(status: number, headers?: HeadersInterface | HeadersObject): Promise<void>;

  /**
   * Sends a HTTP/2 push.
   *
   * The passed middleware will be called with a new Context object specific
   * for pushes.
   *
   * This is a shortcut for response.push()
   */
  push(callback: Middleware): Promise<void>;

  /**
   * returns the ip address of the client that's trying to connect.
   *
   * If 'trustProxy' is set to true, it means the server is running behind a
   * proxy, and the X-Forwarded-For header should be parsed instead.
   *
   * If there was no real HTTP client, this method will return null.
   */
  ip(trustProxy?: boolean): null | string;

  redirect(address: string): void;
  redirect(status: number, address: string): void;

  /**
   * WebSocket object.
   *
   * If the current request is a websocket request, this proprerty will be set
   *
   * @see https://github.com/websockets/ws#simple-server
   */
  webSocket?: WebSocket;
}

/**
 * WebSocket Context
 *
 * This is the Context that will be passed in case a WebSocket request was
 * initiated.
 */
export interface WsContext extends Context<unknown, any> {

  /**
   * WebSocket object.
   *
   * @see https://github.com/websockets/ws#simple-server
   */
  webSocket: WebSocket;

}
