import RequestInterface from './request';

/**
 * This method will check the following request headers:
 *
 * 1. If-Match
 * 2. If-None-Match
 * 3. If-Modified-Since
 * 4. If-Unmodified-Since
 *
 * To check these headers,v alues for lastModified and etag should be passed.
 *
 * The result of this function will return a suggested HTTP status. It will
 * return
 * * '200' if all the preconditions passed.
 * * '304' is a 'Not Modified' status should be returned, and
 * * '412' if a 'Precondition failed' error should be returned.
 */
export function conditionalCheck(request: RequestInterface, lastModified: Date|null, etag: string|null): 200 | 304 | 412 {

  validateETag(etag);
  if (request.headers.has('If-Match')) {
    return ifMatchCheck(
      request.headers.get('If-Match')!,
      etag
    );
  }
  if (request.headers.has('If-None-Match')) {
    return ifNoneMatchCheck(
      request.method,
      request.headers.get('If-None-Match')!,
      etag
    );
  }
  if (request.headers.has('If-Modified-Since')) {
    return ifModifiedSinceCheck(
      request.method,
      request.headers.get('If-Modified-Since')!,
      lastModified
    );
  }
  if (request.headers.has('If-Unmodified-Since')) {
    return ifUnmodifiedSinceCheck(
      request.headers.get('If-Unmodified-Since')!,
      lastModified
    );
  }
  return 200;

}

function ifMatchCheck(header: string, serverState: string | null): 200 | 412 {

  if (header==='*') {
    return serverState !== null ? 200 : 412;
  }
  const headerTags = header.split(',').map( foo => foo.trim() );

  for(const tag of headerTags) {
    if (tag===serverState) return 200;
  }
  return 412;

}

function ifNoneMatchCheck(method: string, header: string, serverState: string | null): 200 | 304 | 412 {

  let pass;
  if (header==='*') {
    pass = serverState === null;
  } else {
    const headerTags = header.split(',').map( foo => foo.trim() );

    pass = true;
    for(const tag of headerTags) {
      if (tag===serverState) {
        pass = false;
      }
    }
  }

  if (!pass) {
    if (method === 'GET' || method === 'HEAD') {
      return 304;
    } else {
      return 412;
    }
  }
  return 200;

}

function ifModifiedSinceCheck(method: string, header: string, serverState: Date|null): 200 | 304 {

  if (method !== 'GET' && method !== 'HEAD') {
    // Only GET and HEAD are supported, everything else is ignored
    return 200;
  }

  if (serverState === null) {
    return 200;
  }

  const headerDate = new Date(header);
  return (serverState.getTime() > headerDate.getTime()) ? 200 : 304;

}

function ifUnmodifiedSinceCheck(header: string, serverState: Date|null): 200 | 412 {

  // This is not in any spec, but I believe that we should reject requests
  // if we don't know that the Last-Modified value is.
  if (serverState === null) {
    return 412;
  }

  const headerDate = new Date(header);
  return (serverState.getTime() <= headerDate.getTime()) ? 200 : 412;

}

function validateETag(etag: null|string) {

  if (etag===null) return;
  if (!/^(W\/)?"[\x21\x23-\x7e]+"$/.test(etag)) {
    throw new Error('Etags must be valid. Did you forget the double-quotes?');
  }

}
