import http from 'http';
import Response from './response';
import { HeadersInterface } from './headers';

/**
 * This is a wrapper around the Node Response object, and handles creates a
 * nicer API around Headers access.
 */
class NodeHeaders implements HeadersInterface {

  private inner: http.ServerResponse;

  constructor(inner: http.ServerResponse) {

    this.inner = inner;

  }

  /**
   * Sets a HTTP header name and value
   */
  set(name: string, value: string) {

    this.inner.setHeader(name, value);

  }

  /**
   * Gets a HTTP header's value.
   *
   * This function will return null if the header did not exist. If it did
   * exist, it will return a string.
   *
   * If there were multiple headers with the same value, it will join the
   * headers with a comma.
   */
  get(name: string): string|null {

    const value = this.inner.getHeader(name);
    if (value === undefined || value === null) {
      return null;
    } else if (typeof(value) === 'string') {
      return value;
    } else if (Array.isArray(value)) {
      return value.join(',');
    } else {
      return value.toString();
    }

  }

  /**
   * Removes a HTTP header
   */
  delete(name: string): void {

    this.inner.removeHeader(name);

  }

}


export class NodeResponse implements Response {

  private inner: http.ServerResponse;

  constructor(inner: http.ServerResponse) {

    this.inner = inner;

  }

  /**
   * List of HTTP Headers
   */
  get headers(): NodeHeaders {

    return new NodeHeaders(this.inner);

  }

  /**
   * HTTP status code.
   */
  get status(): number {

    return this.inner.statusCode;

  }

  /**
   * Updates the HTTP status code for this response.
   */
  set status(value: number) {

    this.inner.statusCode = value;

  }

  /**
   * The response body.
   */
  body: null | object | string

  /**
   * Returns the value of the Content-Type header, with any additional
   * parameters such as charset= removed.
   *
   * If there was no Content-Type header, an empty string will be returned.
   */
  get type(): string {

    const type = this.headers.get('content-type');
    if (!type) return '';
    return type.split(';')[0];

  }
}

export default NodeResponse;
