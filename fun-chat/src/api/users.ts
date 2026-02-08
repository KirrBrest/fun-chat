import { createRequestId, onResponse, send } from './chat-socket';
import type { WsUserItem } from '../types/ws-types';
import { WS_MESSAGE_TYPE } from '../types/ws-types';

function parseUsersPayload(payload: unknown): WsUserItem[] {
  if (typeof payload !== 'object' || payload === null) {
    return [];
  }

  const usersVal: unknown = Object.getOwnPropertyDescriptor(
    payload,
    'users'
  )?.value;

  if (!Array.isArray(usersVal)) {
    return [];
  }

  const result: WsUserItem[] = [];

  for (const item of usersVal) {
    if (typeof item !== 'object' || item === null) {
      continue;
    }

    const loginVal: unknown = Object.getOwnPropertyDescriptor(
      item,
      'login'
    )?.value;

    if (typeof loginVal !== 'string' || loginVal === '') {
      continue;
    }

    result.push({ login: loginVal });
  }

  return result;
}

export function requestActiveUsers(): Promise<WsUserItem[]> {
  return new Promise((resolve) => {
    const id = createRequestId();

    onResponse(id, (msg) => {
      if (msg.type === WS_MESSAGE_TYPE.USER_ACTIVE) {
        resolve(parseUsersPayload(msg.payload));
      } else {
        resolve([]);
      }
    });

    send({
      id,
      type: WS_MESSAGE_TYPE.USER_ACTIVE,
      payload: null,
    });
  });
}

export function requestInactiveUsers(): Promise<WsUserItem[]> {
  return new Promise((resolve) => {
    const id = createRequestId();

    onResponse(id, (msg) => {
      if (msg.type === WS_MESSAGE_TYPE.USER_INACTIVE) {
        resolve(parseUsersPayload(msg.payload));
      } else {
        resolve([]);
      }
    });

    send({
      id,
      type: WS_MESSAGE_TYPE.USER_INACTIVE,
      payload: null,
    });
  });
}
