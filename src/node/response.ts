import http from 'http';
import { promisify } from 'util';
import { Middleware } from '../application';
import Context from '../context';
import { HeadersInterface, HeadersObject } from '../headers';
import MemoryRequest from '../memory-request';
import MemoryResponse from '../memory-response';
import Response from '../response';
import { isHttp2Response, NodeHttpResponse } from './http-utils';
import push from './push';

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
      return value.join(', ');
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
  /**
   * Appends a new header, without removing an old one with the same name.
   */
  append(name: string, value: string | string[] | number): void {

    let oldValue = this.inner.getHeader(name);
    if (oldValue === undefined) {
      oldValue = [];
    }
    if (!Array.isArray(oldValue)) {
      oldValue = [oldValue.toString()];
    }
    this.inner.setHeader(name, oldValue.concat(<string|string[]> value));

  }

}


export class NodeResponse<T> implements Response<T> {

  private inner: NodeHttpResponse;
  private bodyValue: T;
  private explicitStatus: boolean;

  constructor(inner: NodeHttpResponse) {

    // The default response status is 404.
    this.inner = inner;
    this.status = 404;
    this.bodyValue = null;
    this.explicitStatus = false;

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

    this.explicitStatus = true;
    this.inner.statusCode = value;

  }

  /**
   * Updates the response body.
   */
  set body(value: T) {

    if (!this.explicitStatus) {
      // If no status was set earlier, we set it to 200.
      this.inner.statusCode = 200;
    }
    this.bodyValue = value;
  }

  /**
   * Returns the response body.
   */
  get body(): T {

    return this.bodyValue;

  }

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
   * Shortcut for setting the Content-Type header.
   */
  set type(value: string) {

    this.headers.set('content-type', value);

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

      // @ts-ignore
      const writeRaw = promisify(this.inner._writeRaw.bind(this.inner));
      const message = `HTTP/1.1 ${status} ${http.STATUS_CODES[status]}\r\n${rawHeaders.join('')}\r\n`;
      await writeRaw(message, 'ascii');

    }

  }

  /**
   * Sends a HTTP/2 push.
   *
   * The passed middleware will be called with a new Context object specific
   * for pushes.
   */
  async push(callback: Middleware): Promise<void> {

    if (!isHttp2Response(this.inner)) {
      // Not HTTP2
      return;
    }

    const stream = this.inner.stream;
    if (!stream.pushAllowed) {
      // Client doesn't want pushes
      return;
    }

    const pushCtx = new Context(
      new MemoryRequest('GET'),
      new MemoryResponse()
    );

    await callback(pushCtx, async () => {
      // We're passing an empty function for the 'next' argument, so the
      // signature is compatible with middlewares, but next does nothing.
    });

    if (!pushCtx.request.requestTarget) {
      throw new Error('The "path" must be set in the push context\'s request');
    }

    return push(stream, pushCtx);

  }

}

export default NodeResponse;
