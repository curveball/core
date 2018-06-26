import http from 'http';
import { promisify } from 'util';
import { HeadersInterface, HeadersObject } from './headers';
import { isHttp2Response, NodeHttpResponse } from './node-http-utils';
import Response from './response';

/**
 * This is a wrapper around the Node Response object, and handles creates a
 * nicer API around Headers access.
 */
class NodeHeaders implements HeadersInterface {

  private inner: NodeHttpResponse;

  constructor(inner: NodeHttpResponse) {

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

  /**
   * Returns all HTTP headers.
   *
   * Headernames are not lowercased. Values may be either strings or arrays of
   * strings.
   */
  getAll(): HeadersObject {

    return this.inner.getHeaders();

  }


}


export class NodeResponse implements Response {

  private inner: NodeHttpResponse;

  constructor(inner: NodeHttpResponse) {

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
  body: null | object | string;

  /**
   * Returns the value of the Content-Type header, with any additional
   * parameters such as charset= removed.
   *
   * If there was no Content-Type header, an empty string will be returned.
   */
  get type(): string {

    const type = this.headers.get('content-type');
    if (!type) { return ''; }
    return type.split(';')[0];

  }

  /**
   * Sends an informational response before the real response.
   *
   * This can be used to for example send a `100 Continue` or `103 Early Hints`
   * response.
   */
  async sendInformational(status: number, headers?: HeadersInterface | HeadersObject): Promise<void> {

    let outHeaders: HeadersObject = {};

    if (typeof headers !== 'undefined') {
      if ((<HeadersInterface> headers).getAll !== undefined) {
        outHeaders = (<HeadersInterface> headers).getAll();
      } else {
        outHeaders = <HeadersObject> headers;
      }
    }

    /**
     * It's a HTTP2 connection.
     */
    if (isHttp2Response(this.inner)) {
      this.inner.stream.additionalHeaders({
        ':status': status,
        ...outHeaders
      });

    } else {

      const rawHeaders: string[] = [];
      for (const headerName of Object.keys(outHeaders)) {
        const headerValue = outHeaders[headerName];
        if (Array.isArray(headerValue)) {
          for (const headerVal of headerValue) {
            rawHeaders.push(`${headerName}: ${headerVal}\r\n`);
          }
        } else {
          rawHeaders.push(`${headerName}: ${headerValue}\r\n`);
        }
      }
      // @ts-ignore _writeRaw is private but its the only sane way to access
      // it.
      const writeRaw = promisify(this.inner._writeRaw.bind(this.inner));
      const message = `HTTP/1.1 ${status} ${http.STATUS_CODES[status]}\r\n${rawHeaders.join('')}\r\n`;
      await writeRaw(message, 'ascii');

    }

  }

}

export default NodeResponse;
