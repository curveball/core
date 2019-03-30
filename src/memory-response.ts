import { Middleware } from './application';
import { is } from './header-helpers';
import { Headers, HeadersInterface, HeadersObject } from './headers';
import Response from './response';

export class MemoryResponse<T> implements Response<T> {

  constructor() {

    this.headers = new Headers();
    this.status = 200;
    // @ts-ignore: Typescript doesn't like null here because it might be
    // incompatible with T, but we're ignoring it as it's a good default.
    this.body = null;

  }

  /**
   * An object containing all headers.
   */
  headers: Headers;

  /**
   * HTTP status code.
   */
  status: number;

  /**
   * The response body.
   */
  body: T;

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

    // No need to do anything

  }

  /**
   * Sends a HTTP/2 push.
   *
   * The passed middleware will be called with a new Context object specific
   * for pushes.
   */
  async push(callback: Middleware): Promise<void> {

    // Don't do anything

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

export default MemoryResponse;
