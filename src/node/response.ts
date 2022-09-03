import * as http from 'http';
import { promisify } from 'util';
import { isHttp2Response, NodeHttpResponse } from './http-utils';
import push from './push';
import NodeHeaders from './response-headers';
import {
  Context,
  Response,
  MemoryRequest,
  MemoryResponse,
  HeadersInterface,
  HeadersObject,
  invokeMiddlewares,
  Middleware,
  headerHelpers,
} from '@curveball/kernel';


export class NodeResponse<T> implements Response<T> {

  private inner: NodeHttpResponse;
  private bodyValue!: T;
  private explicitStatus: boolean;

  constructor(inner: NodeHttpResponse, origin: string) {

    // The default response status is 404.
    this.inner = inner;

    // @ts-expect-error Typescript doesn't like null here because it might be
    // incompatible with T, but we're ignoring it as it's a good default.
    this.body = null;
    this.status = 404;
    this.explicitStatus = false;
    this.origin = origin;

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
   * Sends an informational response before the real response.
   *
   * This can be used to for example send a `100 Continue` or `103 Early Hints`
   * response.
   */
  async sendInformational(status: number, headers?: HeadersInterface | HeadersObject): Promise<void> {

    let outHeaders: HeadersObject = {};

    if (typeof headers !== 'undefined') {
      if (headers.getAll !== undefined) {
        outHeaders = (headers as HeadersInterface).getAll();
      } else {
        outHeaders = headers as HeadersObject;
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

      // @ts-expect-error let's ignore this
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
      new MemoryRequest('GET', '|||DELIBERATELY_INVALID|||', this.origin),
      new MemoryResponse(this.origin)
    );

    await invokeMiddlewares(pushCtx, [callback]);
    if (pushCtx.request.requestTarget === '|||DELIBERATELY_INVALID|||') {
      throw new Error('The "path" must be set in the push context\'s request');
    }

    return push(stream, pushCtx);

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

    return headerHelpers.is(this, type);

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
  readonly origin: string;

}

export default NodeResponse;
