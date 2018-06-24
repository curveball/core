/**
 * This interface represents a set of HTTP headers.
 */
export interface HeadersInterface {

  /**
   * Sets a HTTP header name and value
   */
  set(name: string, value:string | string[] | number): void; 

  /**
   * Gets a HTTP header's value.
   *
   * This function will return null if the header did not exist. If it did
   * exist, it will return a string.
   *
   * If there were multiple headers with the same value, it will join the
   * headers with a comma.
   */
  get(name: string): string|null;

}

type HeadersObj = {
  [headerName: string]: string | string[] | number
}

export class Headers implements HeadersInterface {

  private store:{
    [name: string]: [string, string | string[] | number]
  }

  constructor(headersObj: HeadersObj) {

    this.store = {};
    for(const key of Object.keys(headersObj)) {
      this.set(key, headersObj[key]);
    }

  }

  /**
   * Sets a HTTP header name and value.
   */
  set(name: string, value: string | string[] | number): void {

    // Storing the header name case-insenstive, but we retain the original
    // case as well.
    this.store[name.toLowerCase()] = [name, value];

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

    const tuple = this.store[name.toLowerCase()];
    if (tuple === undefined) {
      return null;
    }
    const value = tuple[1];
    if (typeof(value) === 'string') {
      return value;
    } else if (Array.isArray(value)) {
      return value.join(',');
    } else {
      return value.toString();
    }

  }

}


export default Headers;
