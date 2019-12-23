import { Middleware } from './application';
import { is } from './header-helpers';
import { HeadersInterface, HeadersObject } from './headers';

/**
 * This interface represents an incoming server request.
 */
export abstract class Response<T = any> {

  /**
   * List of HTTP Headers
   */
  headers: HeadersInterface;

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
   * * application/*
   */
  is(type: string): boolean {

    return is(this, type);

  }

  /**
   * redirect performs an HTTP redirect to the provided path in address with a
   * default HTTP response status code 303 See Other. It accepts an optional status
   * parameter and a required location parameter.
   *
   * @param status (optional) the HTTP response code to set in the response header, defaults
   * to 303 See Other.
   * @param address the address to redirect to-gets set in the response.location header.
   */
  redirect(address: string): void;
  redirect(status: number, address: string): void;
  redirect(addrOrStatus: string|number, address?: string): void {
    let status: number = 303;
    let addr: string;
    if (typeof(addrOrStatus) === 'number') {
      status = addrOrStatus;
      addr = address || '';
    } else {
      addr = addrOrStatus;
    }

    this.status = status;
    this.headers.set('Location', addr);
  }

}

export default Response;
