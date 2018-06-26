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

  sendInformational: (status: number, headers?: HeadersInterface | HeadersObject) => Promise<void>

}

export default Response;
