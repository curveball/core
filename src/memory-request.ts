import { Readable } from 'stream';
import { Headers, HeadersInterface, HeadersObject } from './headers';
import { LinkManager } from './links';
import Request from './request';

export class MemoryRequest<T> extends Request<T> {

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

    super();
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
    this.links = new LinkManager(this.headers);

  }

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

    return this.getBody(encoding);

  }

  /**
   * getStream returns a Node.js readable stream.
   *
   * A stream can typically only be read once.
   */
  getStream(): Readable {

    const s = new Readable();
    s.push(this.getBody());
    s.push(null);
    return s;

  }

  private getBody(encoding?: string) {

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

}

export default MemoryRequest;
