import { Middleware } from './application';
import { Headers, HeadersInterface, HeadersObject } from './headers';
import Response from './response';

export class MemoryResponse<T> implements Response<T> {

  constructor() {

    this.body = null;
    this.headers = new Headers();
    this.status = 200;

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

}

export default MemoryResponse;
