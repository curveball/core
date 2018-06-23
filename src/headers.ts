/**
 * This interface represents a set of HTTP headers.
 *
 * This type mostly follows the definiton from node.js:
 * https://nodejs.org/api/http.html#http_message_headers
 *
 * Headers can sometimes appear twice in Requests and Responses. In the HTTP
 * protocol, a header appearing twice is identical to that header being joined
 * using a comma.
 *
 * However, due to a quick in the protocol, Set-Cookie is the only exception,
 * because it's the only header that can appear more than once, and already has
 * a special meaning for the comma.
 *
 * So node.js will normalize incoming HTTP headers and always concatenate them
 * with a comma, except the Set-Cookie header, which appears as an array of
 * strings.
 */
export type Headers = {
  'set-cookie'? : string[],
} & {
  [header: string]: string
};
export default Headers;
