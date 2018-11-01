import { HttpProblem } from '@curveball/http-errors';
import Context from '../context';

/**
 * This middleware simply triggers a 'NotFound' error.
 *
 * This is a utility middleware that's automatically added to the middleware
 * stack to be 'last'.
 *
 * The purpose of this mw is that if no other middlewares did anything to
 * handle a request, we automatically respond with a 404.
 */

class NoHandler extends Error implements HttpProblem {

  detail: string;
  httpStatus: number;
  instance: null;
  title: string;
  type: string;

  constructor() {

    super();
    this.type = 'https://curveballjs.org/errors/no-handler';
    this.title = 'No handler for this request';
    this.detail = 'This server doesn\'t know what to do with your request. Did you make a typo?';
    this.message = this.title;
    this.httpStatus = 404;

  }

}

export default function mw(ctx: Context) {

  throw new NoHandler();

}
