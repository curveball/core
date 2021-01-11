import { Headers } from './headers';
import { Response, Body } from './response';

export class MemoryResponse<T = Body> extends Response<T> {

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
