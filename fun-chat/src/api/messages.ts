import { createRequestId, onResponse, send } from './chat-socket';
import type { WsChatMessage, WsMessageStatus } from '../types/ws-types';
import { WS_MESSAGE_TYPE } from '../types/ws-types';

function parseStatus(value: unknown): WsMessageStatus | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const isDeliveredVal: unknown = Object.getOwnPropertyDescriptor(
    value,
    'isDelivered'
  )?.value;
  const isReadedVal: unknown = Object.getOwnPropertyDescriptor(
    value,
    'isReaded'
  )?.value;
  const isEditedVal: unknown = Object.getOwnPropertyDescriptor(
    value,
    'isEdited'
  )?.value;

  if (
    typeof isDeliveredVal !== 'boolean' ||
    typeof isReadedVal !== 'boolean' ||
    typeof isEditedVal !== 'boolean'
  ) {
    return null;
  }

  return {
    isDelivered: isDeliveredVal,
    isReaded: isReadedVal,
    isEdited: isEditedVal,
  };
}

function getString(obj: unknown, key: string): string | null {
  if (typeof obj !== 'object' || obj === null) {
    return null;
  }

  const v: unknown = Object.getOwnPropertyDescriptor(obj, key)?.value;

  return typeof v === 'string' ? v : null;
}

function getNumber(obj: unknown, key: string): number | null {
  if (typeof obj !== 'object' || obj === null) {
    return null;
  }

  const v: unknown = Object.getOwnPropertyDescriptor(obj, key)?.value;

  return typeof v === 'number' ? v : null;
}

function parseMessageObject(messageVal: unknown): WsChatMessage | null {
  if (typeof messageVal !== 'object' || messageVal === null) {
    return null;
  }

  const id = getString(messageVal, 'id');
  const from = getString(messageVal, 'from');
  const to = getString(messageVal, 'to');
  const text = getString(messageVal, 'text');
  const datetime = getNumber(messageVal, 'datetime');
  const statusVal: unknown = Object.getOwnPropertyDescriptor(
    messageVal,
    'status'
  )?.value;

  const status = parseStatus(statusVal);

  if (
    id === null ||
    from === null ||
    to === null ||
    text === null ||
    datetime === null ||
    status === null
  ) {
    return null;
  }

  return { id, from, to, text, datetime, status };
}

export function parseMessagePayload(payload: unknown): WsChatMessage | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const messageVal: unknown = Object.getOwnPropertyDescriptor(
    payload,
    'message'
  )?.value;

  return parseMessageObject(messageVal);
}

function parseMessagesArray(payload: unknown): WsChatMessage[] {
  if (typeof payload !== 'object' || payload === null) {
    return [];
  }

  const messagesVal: unknown = Object.getOwnPropertyDescriptor(
    payload,
    'messages'
  )?.value;

  if (!Array.isArray(messagesVal)) {
    return [];
  }

  const result: WsChatMessage[] = [];

  for (const item of messagesVal) {
    const msg = parseMessageObject(item);

    if (msg !== null) {
      result.push(msg);
    }
  }

  return result;
}

function getErrorFromPayload(payload: unknown): string {
  if (typeof payload !== 'object' || payload === null) {
    return 'Unknown error';
  }

  const errorVal: unknown = Object.getOwnPropertyDescriptor(
    payload,
    'error'
  )?.value;

  return typeof errorVal === 'string' ? errorVal : 'Unknown error';
}

function parseCountFromPayload(payload: unknown): number {
  if (typeof payload !== 'object' || payload === null) {
    return 0;
  }

  const countVal: unknown = Object.getOwnPropertyDescriptor(
    payload,
    'count'
  )?.value;

  return typeof countVal === 'number' && countVal >= 0 ? countVal : 0;
}

export function parseMsgReadPayload(
  payload: unknown
): { id: string; isReaded: boolean } | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const messageVal: unknown = Object.getOwnPropertyDescriptor(
    payload,
    'message'
  )?.value;

  if (typeof messageVal !== 'object' || messageVal === null) {
    return null;
  }

  const id = getString(messageVal, 'id');
  const statusVal: unknown = Object.getOwnPropertyDescriptor(
    messageVal,
    'status'
  )?.value;

  if (id === null || typeof statusVal !== 'object' || statusVal === null) {
    return null;
  }

  const isReadedVal: unknown = Object.getOwnPropertyDescriptor(
    statusVal,
    'isReaded'
  )?.value;

  if (typeof isReadedVal !== 'boolean') {
    return null;
  }

  return { id, isReaded: isReadedVal };
}

export function parseMsgDeletePayload(
  payload: unknown
): { id: string; isDeleted: boolean } | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const messageVal: unknown = Object.getOwnPropertyDescriptor(
    payload,
    'message'
  )?.value;

  if (typeof messageVal !== 'object' || messageVal === null) {
    return null;
  }

  const id = getString(messageVal, 'id');
  const statusVal: unknown = Object.getOwnPropertyDescriptor(
    messageVal,
    'status'
  )?.value;

  if (id === null || typeof statusVal !== 'object' || statusVal === null) {
    return null;
  }

  const isDeletedVal: unknown = Object.getOwnPropertyDescriptor(
    statusVal,
    'isDeleted'
  )?.value;

  if (typeof isDeletedVal !== 'boolean') {
    return null;
  }

  return { id, isDeleted: isDeletedVal };
}

export function parseMsgEditPayload(
  payload: unknown
): { id: string; text: string; isEdited: boolean } | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const messageVal: unknown = Object.getOwnPropertyDescriptor(
    payload,
    'message'
  )?.value;

  if (typeof messageVal !== 'object' || messageVal === null) {
    return null;
  }

  const id = getString(messageVal, 'id');
  const text = getString(messageVal, 'text');
  const statusVal: unknown = Object.getOwnPropertyDescriptor(
    messageVal,
    'status'
  )?.value;

  if (
    id === null ||
    text === null ||
    typeof statusVal !== 'object' ||
    statusVal === null
  ) {
    return null;
  }

  const isEditedVal: unknown = Object.getOwnPropertyDescriptor(
    statusVal,
    'isEdited'
  )?.value;

  if (typeof isEditedVal !== 'boolean') {
    return null;
  }

  return { id, text, isEdited: isEditedVal };
}

export function parseMsgDeliverPayload(
  payload: unknown
): { id: string; isDelivered: boolean } | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const messageVal: unknown = Object.getOwnPropertyDescriptor(
    payload,
    'message'
  )?.value;

  if (typeof messageVal !== 'object' || messageVal === null) {
    return null;
  }

  const id = getString(messageVal, 'id');
  const statusVal: unknown = Object.getOwnPropertyDescriptor(
    messageVal,
    'status'
  )?.value;

  if (id === null || typeof statusVal !== 'object' || statusVal === null) {
    return null;
  }

  const isDeliveredVal: unknown = Object.getOwnPropertyDescriptor(
    statusVal,
    'isDelivered'
  )?.value;

  if (typeof isDeliveredVal !== 'boolean') {
    return null;
  }

  return { id, isDelivered: isDeliveredVal };
}

export function parseCountPushPayload(
  payload: unknown
): { login: string; count: number } | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const userVal: unknown = Object.getOwnPropertyDescriptor(
    payload,
    'user'
  )?.value;

  if (typeof userVal !== 'object' || userVal === null) {
    return null;
  }

  const login = getString(userVal, 'login');
  const count = parseCountFromPayload(payload);

  if (login === null) {
    return null;
  }

  return { login, count };
}

export function sendMessage(to: string, text: string): Promise<WsChatMessage> {
  return new Promise((resolve, reject) => {
    const id = createRequestId();

    onResponse(id, (msg) => {
      if (msg.type === WS_MESSAGE_TYPE.ERROR) {
        reject(new Error(getErrorFromPayload(msg.payload)));
        return;
      }

      if (msg.type === WS_MESSAGE_TYPE.MSG_SEND) {
        const message = parseMessagePayload(msg.payload);

        if (message === null) {
          reject(new Error('Invalid response'));
        } else {
          resolve(message);
        }
      }
    });

    send({
      id,
      type: WS_MESSAGE_TYPE.MSG_SEND,
      payload: { message: { to, text } },
    });
  });
}

export function getMessageHistory(login: string): Promise<WsChatMessage[]> {
  return new Promise((resolve, reject) => {
    const id = createRequestId();

    onResponse(id, (msg) => {
      if (msg.type === WS_MESSAGE_TYPE.ERROR) {
        reject(new Error(getErrorFromPayload(msg.payload)));
        return;
      }

      if (msg.type === WS_MESSAGE_TYPE.MSG_FROM_USER) {
        resolve(parseMessagesArray(msg.payload));
      }
    });

    send({
      id,
      type: WS_MESSAGE_TYPE.MSG_FROM_USER,
      payload: { user: { login } },
    });
  });
}

export function getUnreadCount(login: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const id = createRequestId();

    onResponse(id, (msg) => {
      if (msg.type === WS_MESSAGE_TYPE.ERROR) {
        reject(new Error(getErrorFromPayload(msg.payload)));
        return;
      }

      if (msg.type === WS_MESSAGE_TYPE.MSG_COUNT_NOT_READED_FROM_USER) {
        resolve(parseCountFromPayload(msg.payload));
      }
    });

    send({
      id,
      type: WS_MESSAGE_TYPE.MSG_COUNT_NOT_READED_FROM_USER,
      payload: { user: { login } },
    });
  });
}

export function markAsRead(
  messageId: string
): Promise<{ id: string; isReaded: boolean }> {
  return new Promise((resolve, reject) => {
    const id = createRequestId();

    onResponse(id, (msg) => {
      if (msg.type === WS_MESSAGE_TYPE.ERROR) {
        reject(new Error(getErrorFromPayload(msg.payload)));
        return;
      }

      if (msg.type === WS_MESSAGE_TYPE.MSG_READ) {
        const result = parseMsgReadPayload(msg.payload);

        if (result === null) {
          reject(new Error('Invalid response'));
        } else {
          resolve(result);
        }
      }
    });

    send({
      id,
      type: WS_MESSAGE_TYPE.MSG_READ,
      payload: { message: { id: messageId } },
    });
  });
}

export function deleteMessage(
  messageId: string
): Promise<{ id: string; isDeleted: boolean }> {
  return new Promise((resolve, reject) => {
    const id = createRequestId();

    onResponse(id, (msg) => {
      if (msg.type === WS_MESSAGE_TYPE.ERROR) {
        reject(new Error(getErrorFromPayload(msg.payload)));
        return;
      }

      if (msg.type === WS_MESSAGE_TYPE.MSG_DELETE) {
        const result = parseMsgDeletePayload(msg.payload);

        if (result === null) {
          reject(new Error('Invalid response'));
        } else {
          resolve(result);
        }
      }
    });

    send({
      id,
      type: WS_MESSAGE_TYPE.MSG_DELETE,
      payload: { message: { id: messageId } },
    });
  });
}

export function editMessage(
  messageId: string,
  text: string
): Promise<{ id: string; text: string; isEdited: boolean }> {
  return new Promise((resolve, reject) => {
    const id = createRequestId();

    onResponse(id, (msg) => {
      if (msg.type === WS_MESSAGE_TYPE.ERROR) {
        reject(new Error(getErrorFromPayload(msg.payload)));
        return;
      }

      if (msg.type === WS_MESSAGE_TYPE.MSG_EDIT) {
        const result = parseMsgEditPayload(msg.payload);

        if (result === null) {
          reject(new Error('Invalid response'));
        } else {
          resolve(result);
        }
      }
    });

    send({
      id,
      type: WS_MESSAGE_TYPE.MSG_EDIT,
      payload: { message: { id: messageId, text } },
    });
  });
}
