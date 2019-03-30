import accepts from 'accepts';
import url from 'url';
import { is } from './header-helpers';
import { Headers, HeadersInterface, HeadersObject } from './headers';
import Request from './request';

export class MemoryRequest<T> implements Request<T> {

  /**
   * List of HTTP Headers
   */
  headers: HeadersInterface;

  /**
   * Contains a parsed, stored representation of the body. It's up to
   * middlewares to do the actual parsing.
   */
  body: T;

  constructor(method: string, requestTarget: string, headers?: HeadersInterface | HeadersObject, body: any = null) {

    this.method = method;
    this.requestTarget = requestTarget;
    if (headers && (<HeadersInterface> headers).get !== undefined) {
      this.headers = <HeadersInterface> headers;
    } else {
      this.headers = new Headers(<HeadersObject> headers);
    }
    this.originalBody = body;
    // @ts-ignore: Typescript doesn't like null here because it might be
    // incompatible with T, but we're ignoring it as it's a good default.
    this.body = null;

  }

  /**
   * path-part of the request.
   *
   * For example /hello/world
   */
  get path(): string {

    return url.parse(this.requestTarget).pathname!;

  }

  /**
   * Sets the path
   */
  set path(value: string) {

    this.requestTarget = value;

  }

  method: string;

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
  requestTarget: string;

  /**
   * Internal representation of body.
   *
   * We keep a private copy so we can maintain compatibility with rawBody.
   */
  private originalBody: Buffer|string|object|null;

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
  async rawBody(encoding?: undefined|string, limit?: string): Promise<Buffer|string> {

    if (!this.originalBody) {
      // Memoizing the null case
      this.originalBody = '';
    }
    if (typeof this.originalBody === 'object' && !(this.originalBody instanceof Buffer)) {
      // Memoizing the JSON object case.
      this.originalBody = JSON.stringify(this.originalBody);
    }

    if (this.originalBody instanceof Buffer) {
      // The buffer case
      if (typeof encoding === 'undefined') {
        return this.originalBody;
      } else {
        return this.originalBody.toString(encoding);
      }
    } else {
      // The string case
      if (typeof encoding === 'undefined') {
        return Buffer.from(this.originalBody);
      } else {
        return this.originalBody;
      }
    }

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

    const dummyRequest: any = {
      headers: {}
    };
    const acceptHeader = this.headers.get('accept');
    if (acceptHeader) {
      dummyRequest.headers.accept = acceptHeader;
    }
    const result = <string|false> accepts(dummyRequest).type(types);
    return result === false ? null : result;

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

export default MemoryRequest;
