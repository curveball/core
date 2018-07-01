import { Middleware } from './application';
import { HeadersInterface, HeadersObject } from './headers';

/**
 * This interface represents an incoming server request.
 */
export interface Response {

  /**
   * List of HTTP Headers.
   */
  headers: HeadersInterface;

  /**
   * HTTP status code.
   */
  status: number;

  /**
   * The response body.
   */
  body: any;

  /**
   * Returns the value of the Content-Type header, with any additional
   * parameters such as charset= removed.
   *
   * If there was no Content-Type header, an empty string will be returned.
   */
  readonly type: string;

  /**
   * Sends an informational (1xx status code) response.
   */
  sendInformational: (status: number, headers?: HeadersInterface | HeadersObject) => Promise<void>;

  /**
   * Sends a HTTP/2 push.
   *
   * The passed middleware will be called with a new Context object specific
   * for pushes.
   */
  push: (callback: Middleware) => Promise<void>;

}

export default Response;
