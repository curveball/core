import accepts from 'accepts';
import http from 'http';
import rawBody from 'raw-body';
import url from 'url';
import { Headers, HeadersInterface } from '../headers';
import Request from '../request';
import { NodeHttpRequest } from './http-utils';
import { is } from '../header-helpers';

export class NodeRequest<T> implements Request<T> {

  /**
   * List of HTTP Headers
   */
  headers: HeadersInterface;

  /**
   * Contains a parsed, stored representation of the body. It's up to
   * middlewares to do the actual parsing.
   */
  body: T;

  /**
   * Node.js Request object
   */
  private inner: NodeHttpRequest;

  constructor(inner: NodeHttpRequest) {

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
   * This function returns the request body.
   *
   * If encoding is not specified, this function returns a Buffer. If encoding
   * is specified, it will return a string.
   * This function returns the request body.
   *
   * If encoding is not specified, this function returns a Buffer. If encoding
   * is specified, it will return a string.
   *
   * You can only call this function once. Most likely you'll want a single
   * middleware that calls this function and then sets `body`.
   */
  rawBody(encoding?: string, limit?: string): Promise<string>;
  rawBody(encoding?: undefined, limit?: string): Promise<Buffer>;
  rawBody(encoding?: undefined|string, limit?: string): Promise<Buffer|string> {

    const options: {
      encoding?: string,
      limit?: string,
      length?: string
    } = {};
    if (limit) {
      options.limit = limit;
    }
    if (encoding) {
      options.encoding = encoding;
    }
    const length = this.headers.get('Content-Length');
    if (length) {
      options.length = length;
    }
    return rawBody(this.inner, options);

  }

  /**
   * This object contains parsed query parameters.
   */
  get query(): { [s: string]: string } {

    return <any> url.parse(this.requestTarget, true).query;

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
   */
  accepts(...types: string[]): null | string {

    const result = <string|false> accepts(<http.IncomingMessage> this.inner).type(types);
    return result === false ? null : result;

  }

  /**
   * Returns the IP address of the HTTP client.
   *
   * If trustProxy is set to true, it means this server is running behind a
   * proxy, and the X-Forwarded-For header should be used instead.
   */
  ip(trustProxy: boolean = false): string {

    if (trustProxy) {
      const forwardedForHeader = this.headers.get('X-Forwarded-For');
      if (forwardedForHeader) {
        return forwardedForHeader.split(',')[0].trim();
      }
    }

    return this.inner.socket.remoteAddress;

  }

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
   */
  is(type: string): boolean {

    return is(this, type);

  }

}

export default NodeRequest;
