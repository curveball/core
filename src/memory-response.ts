import { Headers } from './headers';
import Response from './response';

export class MemoryResponse<T> extends Response<T> {

  constructor() {

    super();
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

}

export default MemoryResponse;
