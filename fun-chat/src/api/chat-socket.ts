import { RADIX, RANDOM_ID_LENGTH } from '../constants';
import type { WsMessageBase } from '../types/ws-types';

type ResponseCallback = (message: WsMessageBase) => void;

let socket: WebSocket | null = null;
const responseHandlers = new Map<string, ResponseCallback>();
const messageListeners: ResponseCallback[] = [];

function generateId(): string {
  const radix = Number(RADIX);
  const length = Number(RANDOM_ID_LENGTH);

  return `${Date.now()}-${Math.random().toString(radix).slice(2, length)}`;
}

function handleMessage(event: MessageEvent): void {
  try {
    if (typeof event.data !== 'string') {
      return;
    }

    const raw: unknown = JSON.parse(event.data);

    if (typeof raw !== 'object' || raw === null) {
      return;
    }

    const rawId: unknown = Object.getOwnPropertyDescriptor(raw, 'id')?.value;
    const rawType: unknown = Object.getOwnPropertyDescriptor(
      raw,
      'type'
    )?.value;
    const rawPayload: unknown = Object.getOwnPropertyDescriptor(
      raw,
      'payload'
    )?.value;

    if (rawType === undefined || rawPayload === undefined) {
      return;
    }
    const id = typeof rawId === 'string' || rawId === null ? rawId : null;
    const type = typeof rawType === 'string' ? rawType : '';

    const message: WsMessageBase = { id, type, payload: rawPayload };

    if (message.id !== null) {
      const id = message.id;
      const handler = responseHandlers.get(id);

      if (handler !== undefined) {
        responseHandlers.delete(id);
        handler(message);
      }
    }

    for (const listener of messageListeners) {
      listener(message);
    }
  } catch {
    return;
  }
}

export function connect(url: string): Promise<void> {
  if (socket !== null && socket.readyState === WebSocket.OPEN) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);

    ws.addEventListener('open', () => {
      socket = ws;
      resolve();
    });

    ws.addEventListener('error', () => {
      reject(new Error('WebSocket connection failed'));
    });

    ws.addEventListener('close', () => {
      socket = null;
    });

    ws.addEventListener('message', handleMessage);
  });
}

export function send(message: WsMessageBase): void {
  if (socket === null || socket.readyState !== WebSocket.OPEN) {
    return;
  }

  socket.send(JSON.stringify(message));
}

export function onResponse(
  requestId: string,
  callback: ResponseCallback
): void {
  responseHandlers.set(requestId, callback);
}

export function onMessage(callback: ResponseCallback): void {
  messageListeners.push(callback);
}

export function close(): void {
  if (socket !== null) {
    socket.close();
    socket = null;
  }

  responseHandlers.clear();
}

export function createRequestId(): string {
  return generateId();
}

export function isConnected(): boolean {
  return socket !== null && socket.readyState === WebSocket.OPEN;
}
