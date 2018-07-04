import http2 from 'http2';
import Context from '../context';
import { prepareBody } from './http-utils';

/**
 * This is a utility for helping with HTTP/2 Push for node servers.
 */
export default async function push(stream: http2.ServerHttp2Stream, pushCtx: Context) {

  const requestHeaders = {
    ':path': pushCtx.request.path,
    ...pushCtx.request.headers.getAll(),

  };
  let pushStream: http2.ServerHttp2Stream;

  try {
    pushStream = await getPushStream(
      stream,
      requestHeaders,
    );
  } catch (err) {
    if (err.message.startsWith('HTTP/2 client has disabled push')) {
      // HTTP/2 disabled pusing after all
      return;
    }
    throw err;
  }
  pushStream.on('error', err => {

    const isRefusedStream =
      pushStream.rstCode === http2.constants.NGHTTP2_REFUSED_STREAM;

    if (!isRefusedStream) {
      throw err;
    }

  });
  pushStream.respond({
    ':status': 200,
    ...pushCtx.response.headers.getAll(),
  });
  pushStream.end(
    prepareBody(pushCtx.response.body)
  );

}

function getPushStream(stream: http2.ServerHttp2Stream, requestHeaders: http2.OutgoingHttpHeaders): Promise<http2.ServerHttp2Stream> {

  return new Promise((res, rej) => {

    stream.pushStream(requestHeaders, (err, pushStream) => {

      if (err) {
        rej(err);
        return;
      }
      res(pushStream);

    });

  });

}
