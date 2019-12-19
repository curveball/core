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
 * * application/*
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

  if (type === mainType + '/*') {
    // matches application/*
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

type Preferences = {
  [preference: string]: true | string;
};

/**
 * Parses a RFC7240 Prefer header.
 *
 * It's a naive parser as it assumes a fairly simple subset of
 * Prefer.
 *
 * TODO: Make this parse every possible variation.
 */
export function parsePrefer(header: string | null): Preferences {

  if (!header) {
    return {};
  }

  const result: Preferences = {};

  for (const headerItem of splitHeader(header)) {

    const [keyValue] = headerItem.split(';');
    const [key, value] = keyValue.split('=');
    result[key.toLowerCase()] = value !== undefined ? value : true;

  }

  return result;

}

/**
 * This function takes a multi-value comma-separated header and splits it
 * into multiple headers.
 *
 * TODO: In the future this function will respect comma's appearing within
 * quotes and ignore them. It doesn't right now.
 */
export function splitHeader(header: string): string[] {

  return header.split(',').map(item => item.trim());

}
