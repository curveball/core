import { Headers } from './headers';
import Response from './response';

export class MemoryResponse<T> extends Response<T> {

  constructor() {

    super();
    this.headers = new Headers();
    this.status = 200;
    (this.body as any) = null;

  }

  /**
   * An object containing all headers.
   */
  headers: Headers;

}

export default MemoryResponse;
