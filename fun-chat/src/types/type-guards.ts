import { ROUTE_PATHS, RoutePath } from './types';
import {
  type WsErrorPayload,
  type WsExternalUserPayload,
  type WsUserLoginResponsePayload,
} from './ws-types';

export function isMessageShape(obj: unknown): obj is Record<string, unknown> {
  return (
    typeof obj === 'object' && obj !== null && 'type' in obj && 'payload' in obj
  );
}

export function isRoutePath(path: string): path is RoutePath {
  return (
    path === '/' ||
    path === ROUTE_PATHS.login ||
    path === ROUTE_PATHS.register ||
    path === ROUTE_PATHS.chat ||
    path === ROUTE_PATHS.about
  );
}

export function isHTMLInputElement(el: HTMLElement): el is HTMLInputElement {
  return el.tagName.toLowerCase() === 'input';
}

export function isHTMLAnchorElement(
  element: HTMLElement
): element is HTMLAnchorElement {
  return element.tagName.toLowerCase() === 'a';
}

export function isWsErrorPayload(payload: unknown): payload is WsErrorPayload {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  const errorVal: unknown = Object.getOwnPropertyDescriptor(
    payload,
    'error'
  )?.value;

  return typeof errorVal === 'string';
}

export function isWsUserLoginResponsePayload(
  payload: unknown
): payload is WsUserLoginResponsePayload {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  const userVal: unknown = Object.getOwnPropertyDescriptor(
    payload,
    'user'
  )?.value;

  if (typeof userVal !== 'object' || userVal === null) {
    return false;
  }

  const loginVal: unknown = Object.getOwnPropertyDescriptor(
    userVal,
    'login'
  )?.value;
  const isLoginedVal: unknown = Object.getOwnPropertyDescriptor(
    userVal,
    'isLogined'
  )?.value;

  return (
    typeof loginVal === 'string' &&
    (typeof isLoginedVal === 'boolean' || isLoginedVal === undefined)
  );
}

export function isWsExternalUserPayload(
  payload: unknown
): payload is WsExternalUserPayload {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  const userVal: unknown = Object.getOwnPropertyDescriptor(
    payload,
    'user'
  )?.value;

  if (typeof userVal !== 'object' || userVal === null) {
    return false;
  }

  const loginVal: unknown = Object.getOwnPropertyDescriptor(
    userVal,
    'login'
  )?.value;

  return typeof loginVal === 'string';
}
