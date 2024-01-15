import rawBody from 'raw-body';
import { Readable } from 'node:stream';

import {
  Headers,
  Request
} from '@curveball/kernel';
import { NodeHttpRequest } from './http-utils.js';

export class NodeRequest<T> extends Request<T> {

  /**
   * Node.js Request object
   */
  private inner: NodeHttpRequest;

  constructor(inner: NodeHttpRequest, origin: string) {

    super(inner.method!, inner.url!, origin);
    this.inner = inner;
    // @ts-expect-error ignoring that headers might be undefined
    this.headers = new Headers(this.inner.headers);

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
      encoding?: string;
      limit?: string;
      length?: string;
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
   *
   * If trustProxy is not set, it defaults to false unless the
   * CURVEBALL_TRUSTPROXY environment variable is set. Using an environment
   * variable is a good idea for this as having a proxy may be environment
   * dependent.
   */
  ip(trustProxy: boolean = false): string {

    if (trustProxy ?? process.env.CURVEBALL_TRUSTPROXY) {
      const forwardedForHeader = this.headers.get('X-Forwarded-For');
      if (forwardedForHeader) {
        return forwardedForHeader.split(',')[0].trim();
      }
    }

    return this.inner.socket.remoteAddress!;

  }

}

export default NodeRequest;
