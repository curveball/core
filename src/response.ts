import { Middleware } from './application';
import { is } from './header-helpers';
import { HeadersInterface, HeadersObject } from './headers';
import { Headers } from './headers';
import { Readable, Writable } from 'stream';

export type Body =
  Buffer |
  Record<string, any> |
  string |
  null |
  Readable |
  ((writeable: Writable) => void);


/**
 * This interface represents an incoming server request.
 */
export abstract class Response<T = Body> {

  constructor(publicBaseUrl: string) {

    this.headers = new Headers();
    this.status = 200;
    this.publicBaseUrl = publicBaseUrl;

  }

  /**
   * List of HTTP Headers
   */
  headers: HeadersInterface;

  /**
   * HTTP status code.
   */
  status: number;

  /**
   * Response Body
   */
  body!: T;

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

  redirect(address: string): void;
  redirect(status: number, address: string): void;
  /**
   * redirect redirects the response with an optionally provided HTTP status
   * code in the first position to the location provided in address. If no status
   * is provided, 303 See Other is used.
   *
   * @param {(string|number)} addrOrStatus if passed a string, the string will
   * be used to set the Location header of the response object and the default status
   * of 303 See Other will be used. If a number, an addressed must be passed in the second
   * argument.
   * @param {string} address If addrOrStatus is passed a status code, this value is
   * set as the value of the response's Location header.
   */
  redirect(addrOrStatus: string|number, address = ''): void {
    let status: number = 303;
    let addr: string;
    if (typeof(addrOrStatus) === 'number') {
      status = addrOrStatus;
      addr = address;
    } else {
      addr = addrOrStatus;
    }

    this.status = status;
    this.headers.set('Location', addr);
  }

  /**
   * Public base URL
   *
   * This will be used to determine the absoluteUrl
   */
  readonly publicBaseUrl: string;
}

export default Response;
