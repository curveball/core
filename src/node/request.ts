import rawBody from 'raw-body';
import { Readable } from 'stream';
import { Headers, HeadersInterface } from '../headers';
import Request from '../request';
import { NodeHttpRequest } from './http-utils';

export class NodeRequest<T> extends Request<T> {

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

    super();
    this.inner = inner;
    // @ts-ignore ignoring that headers might be undefined
    this.headers = new Headers(this.inner.headers);

  }

  /**
   * HTTP method
   *
   * For example: GET
   */
  get method(): string {

    return this.inner.method!;

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

    return this.inner.url!;

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
   * getStream returns a Node.js readable stream.
   *
   * A stream can typically only be read once.
   */
  getStream(): Readable {

    return this.inner;

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

    return this.inner.socket.remoteAddress!;

  }

}

export default NodeRequest;
