import { HeadersInterface } from './headers';

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
  body: null | object | string

}

export default Response;
