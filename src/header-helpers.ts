import RequestInterface from './request';
import ResponseInterface from './response';

/**
 * This method will return true or false if a Request or Response has a
 * Content-Type header that matches the argument.
 *
 * For example, if the Content-Type header has the value: application/hal+json,
 * then the arguments will all return true:
 *
 * * application/hal+json
 * * application/json
 * * hal+json
 * * json
 */
export function is(message: RequestInterface | ResponseInterface, type: string): boolean {

  const messageType = message.type;

  // No Content-Type header
  if (!messageType) {
    return false;
  }

  if (type === messageType) {
    // Matches application/hal+json 
    return true;
  }

  const [mainType, subType] = messageType.split('/', 2);

  if (subType === type) {
    // Matches hal+json
    return true;
  }

  const subTypeParts = subType.split('+', 2);

  if (subTypeParts.length === 2) {

    if (subTypeParts[1] === type) {
      // Matches 'json'
      return true;
    }

    if (mainType + '/' + subTypeParts[1] === type) {
      // matches application/json
      return true;
    }
  }
  return false;

}
