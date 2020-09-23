import { HeadersInterface, HeadersObject } from '../headers';
import { NodeHttpResponse } from './http-utils';

/**
 * This is a wrapper around the Node Response object, and handles creates a
 * nicer API around Headers access.
 */
export default class NodeHeaders implements HeadersInterface {

  private inner: NodeHttpResponse;

  constructor(inner: NodeHttpResponse) {

    this.inner = inner;

  }

  /**
   * Sets a HTTP header name and value
   */
  set(name: string, value: string) {

    this.inner.setHeader(name, value);

  }

  /**
   * Gets a HTTP header's value.
   *
   * This function will return null if the header did not exist. If it did
   * exist, it will return a string.
   *
   * If there were multiple headers with the same value, it will join the
   * headers with a comma.
   */
  get(name: string): string|null {

    const value = this.inner.getHeader(name);
    if (value === undefined || value === null) {
      return null;
    } else if (typeof(value) === 'string') {
      return value;
    } else if (Array.isArray(value)) {
      return value.join(', ');
    } else {
      return value.toString();
    }

  }

  /**
   * Gets all values of a HTTP header
   * 
   * This function will return an array with 0 or more values of a header. 
   * 
   */
  getMany(name: string): string[] {

    const value = this.inner.getHeader(name);

    if (value === undefined || value === null) {
      return [];
    } else if (Array.isArray(value)) {
      return value;
    } else {
      return [value.toString()];
    }
  }
  /**
   * Returns true or false depending on if a HTTP header exists.
   */
  has(name: string): boolean {

    return !!this.inner.getHeader(name);

  }

  /**
   * Removes a HTTP header
   */
  delete(name: string): void {

    this.inner.removeHeader(name);

  }

  /**
   * Returns all HTTP headers.
   *
   * Headernames are not lowercased. Values may be either strings or arrays of
   * strings.
   */
  getAll(): HeadersObject {

    // @ts-expect-error typescript doesn't like that the getHeaders function can
    // have undefined values, so we're just ignoring that problem.
    return this.inner.getHeaders();

  }
  /**
   * Appends a new header, without removing an old one with the same name.
   */
  append(name: string, value: string | string[] | number): void {

    let oldValue = this.inner.getHeader(name);
    if (oldValue === undefined) {
      oldValue = [];
    }
    if (!Array.isArray(oldValue)) {
      oldValue = [oldValue.toString()];
    }
    this.inner.setHeader(name, oldValue.concat(<string|string[]> value));

  }

}
