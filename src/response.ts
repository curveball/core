import { Middleware } from './application';
import { HeadersInterface, HeadersObject } from './headers';

/**
 * This interface represents an incoming server request.
 */
export interface Response<T = any> {

  /**
   * List of HTTP Headers
   */
  headers: HeadersInterface;

  /**
   * HTTP status code.
   */
  status: number;

  /**
   * The response body.
   */
  body: T;

  /**
   * Returns the value of the Content-Type header, with any additional
   * parameters such as charset= removed.
   *
   * If there was no Content-Type header, an empty string will be returned.
   */
  type: string;

  /**
   * Sends an informational response before the real response.
   *
   * This can be used to for example send a `100 Continue` or `103 Early Hints`
   * response.
   */
  sendInformational(status: number, headers?: HeadersInterface | HeadersObject): Promise<void>;

  /**
   * Sends a HTTP/2 push.
   *
   * The passed middleware will be called with a new Context object specific
   * for pushes.
   */
  push(callback: Middleware): Promise<void>;

  /**
   * This method will return true or false if a Request or Response has a
   * Content-Type header that matches the argument.
   *
   * For example, if the Content-Type header has the value: application/hal+json,
   * then the arguments will all return true:
   *
   * * application/hal+json
   * * application/json
   * * hal+json
   * * json
   * * application/*
   */
  is(type: string): boolean;

  redirect(address: string): void;
  redirect(status: number, address: string): void;

}

export default Response;
