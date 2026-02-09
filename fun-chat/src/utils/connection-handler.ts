import { connect } from '../api';
import type { RoutePath } from '../types/types';
import DomElement from './create-element';

const CONNECTION_BANNER_CLASS = 'app-connection-banner';

export function toConnectionLostMessage(value: unknown): string {
  return typeof value === 'string' ? value : 'Connection lost. Reconnecting…';
}

export interface ConnectionHandlerOptions {
  wsUrl: string;
  getReconnectDelayMs(): number;
  connectionLostMessageText: string;
  getCredentials(): { userName: string; password: string } | null;
  restoreSession(userName: string, password: string): Promise<boolean>;
  getLastRenderedPath(): RoutePath;
  render(path: RoutePath): void;
  onReauthSuccess(): void;
  onReauthFail(): void;
}

export interface ConnectionHandler {
  getConnectionLostMessage(): string | null;
  handleUnexpectedClose(): void;
  appendBanner(rootElement: HTMLElement | null): void;
}

interface ConnectionState {
  connectionLostMessage: string | null;
  reconnecting: boolean;
}

function runAfterReconnect(
  state: ConnectionState,
  options: ConnectionHandlerOptions
): void {
  const credentials = options.getCredentials();

  if (credentials === null) {
    state.reconnecting = false;
    state.connectionLostMessage = null;
    options.onReauthFail();
    return;
  }

  void options
    .restoreSession(credentials.userName, credentials.password)
    .then((ok) => {
      state.reconnecting = false;
      state.connectionLostMessage = null;
      if (ok) {
        options.onReauthSuccess();
      } else {
        options.onReauthFail();
      }
    });
}

function createStartReconnect(
  state: ConnectionState,
  options: ConnectionHandlerOptions
): () => void {
  function startReconnect(): void {
    connect(options.wsUrl)
      .then(() => runAfterReconnect(state, options))
      .catch(() => {
        const delayMs: number = options.getReconnectDelayMs();

        globalThis.setTimeout(startReconnect, delayMs);
      });
  }

  return startReconnect;
}

function createHandleUnexpectedClose(
  state: ConnectionState,
  options: ConnectionHandlerOptions,
  startReconnect: () => void
): () => void {
  return function handleUnexpectedClose(): void {
    if (state.reconnecting) {
      return;
    }

    state.reconnecting = true;
    state.connectionLostMessage = toConnectionLostMessage(
      options.connectionLostMessageText
    );
    options.render(options.getLastRenderedPath());
    startReconnect();
  };
}

function createAppendBanner(
  state: ConnectionState
): (rootElement: HTMLElement | null) => void {
  return function appendBanner(rootElement: HTMLElement | null): void {
    if (state.connectionLostMessage === null || rootElement === null) {
      return;
    }

    const banner = new DomElement('div', CONNECTION_BANNER_CLASS);
    banner.element.textContent = state.connectionLostMessage;
    rootElement.append(banner.element);
  };
}

export function createConnectionHandler(
  options: ConnectionHandlerOptions
): ConnectionHandler {
  const state: ConnectionState = {
    connectionLostMessage: null,
    reconnecting: false,
  };

  const startReconnect = createStartReconnect(state, options);
  const handleUnexpectedClose = createHandleUnexpectedClose(
    state,
    options,
    startReconnect
  );
  const appendBanner = createAppendBanner(state);

  return {
    getConnectionLostMessage: () => state.connectionLostMessage,
    handleUnexpectedClose,
    appendBanner,
  };
}
