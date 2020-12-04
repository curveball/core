import * as accepts from 'accepts';
import * as http from 'http';
import { Readable } from 'stream';
import * as url from 'url';
import { is, parsePrefer } from './header-helpers';
import { HeadersInterface } from './headers';
import { Headers } from './headers';

/**
 * This interface represents an incoming server request.
 */
export abstract class Request<T = any> {

  constructor(method: string, requestTarget: string) {
    this.method = method;
    this.requestTarget = requestTarget;
    this.headers = new Headers();
  }

  /**
   * List of HTTP Headers
   */
  headers: HeadersInterface;

  /**
   * path-part of the request.
   *
   * For example /hello/world
   */
  get path(): string {

    return url.parse(this.requestTarget).pathname!;

  }

  /**
   * Sets the request path
   */
  set path(value: string) {

    this.requestTarget = value;

  }

  /**
   * HTTP method
   *
   * For example: GET
   */
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
   * Contains a parsed, stored representation of the body. It's up to
   * middlewares to do the actual parsing.
   */
  body?: T;

  /**
   * This function returns the request body.
   *
   * If encoding is not specified, this function returns a Buffer. If encoding
   * is specified, it will return a string.
   *
   * You can only call this function once. Most likely you'll want a single
   * middleware that calls this function and then sets `body`.
   */
  abstract rawBody(encoding: string, limit?: string): Promise<string>;
  abstract rawBody(encoding?: undefined, limit?: string): Promise<Buffer>;

  /**
   * getStream returns a Node.js readable stream.
   *
   * A stream can typically only be read once.
   */
  abstract getStream(): Readable;

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

    const mockRequestObj = {
      headers: {
        accept: this.headers.get('Accept')
      }
    };

    const result = <string|false> accepts(<http.IncomingMessage> mockRequestObj).type(types);
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
   * * application/*
   */
  is(type: string): boolean {

    return is(this, type);

  }

  /**
   * This method parses the contents of the Prefer header, as defined in
   * RFC7240.
   *
   * A prefer header can either stand alone, or contain a value. Examples:
   *
   * Prefer: return=minimal
   * Prefer: wait=20
   * Prefer: respond-async
   *
   * To get either of these values, pass the name of the preference (for
   * example 'return', 'wait', 'respond-async'.
   *
   * This method returns false if the preference did not appear in the header.
   * If it did appear, it will either return its value (minimal, 20) or 'true'
   * if there was no value.
   *
   * The list of supported preferences is taken from the IANA registry:
   * https://www.iana.org/assignments/http-parameters/http-parameters.xhtml#preferences
   *
   * In addition to this list, it also supports the 'transclude' draft:
   * https://github.com/inadarei/draft-prefer-transclude/blob/master/draft.md
   */
  prefer(preference: 'depth-noroot' | 'respond-async' | 'safe' | 'wait'): boolean;
  prefer(preference: 'return'): 'representation' | 'minimal' | false;
  prefer(preference: 'handling'): 'strict' | 'lenient' | false;
  prefer(preference: 'transclude'): string | false;
  prefer(preference: string): string | boolean {

    const prefer = parsePrefer(
      this.headers.get('Prefer')
    );

    const val = prefer[preference];
    if (val === undefined) {
      return false;
    }
    return val;

  }

}

export default Request;
