import http from 'http';
import Request from './request';
import { Headers, HeadersInterface } from './headers';
import url from 'url';

export class NodeRequest implements Request {

  /**
   * List of HTTP Headers
   */
  headers: HeadersInterface;

  /**
   * Node.js Request object
   */
  private inner: http.IncomingMessage;

  constructor(inner: http.IncomingMessage) {

    this.inner = inner;
    this.headers = new Headers(this.inner.headers);

  }

  /**
   * path-part of the request.
   *
   * For example /hello/world
   */
  get path(): string {

    return url.parse(this.requestTarget).pathname;

  }

  /**
   * HTTP method
   *
   * For example: GET
   */
  get method(): string {

    return this.inner.method;

  }

  /**
   * The request target.
   *
   * This contains the literal value after the HTTP method in the request.
   * So for:
   *
   * GET /foo HTTP/1.1
   *
   * This would contain '/foo'. In many cases this is the same as the 'path'
   * property, but there's 3 other forms in the HTTP specificatio. Here's the
   * different formats:
   *
   * * origin-form    - This is the most common. Example: /foo.
   * * absolute-form  - Clients might sent an entire path. Also used by proxies.
   *                    Example: https://example.org/foo
   * * authority-form - Used by the CONNECT method. Example: example.org:1212
   * * asterisk-form  - Used by the OPTIONS method. Example: *
   *
   * In most cases users will want to use the 'path' property instead. only use
   * this if you know what you're doing.
   *
   * @see {@link https://tools.ietf.org/html/rfc7230#section-5.3}
   */
  get requestTarget(): string {

    return this.inner.url;

  }

  /**
   * Contains a parsed, stored representation of the body. It's up to
   * middlewares to do the actual parsing.
   */
  body: any;

  /**
   * This object contains parsed query parameters.
   */
  get query(): { [s: string]: string } {

    return <any>url.parse(this.requestTarget, true).query;

  }

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

export default NodeRequest;
