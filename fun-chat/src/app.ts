import {
  close,
  connect,
  createRequestId,
  isConnected,
  onMessage,
  onResponse,
  onUnexpectedClose,
  parseCountPushPayload,
  parseMessagePayload,
  parseMsgDeliverPayload,
  parseMsgDeletePayload,
  parseMsgEditPayload,
  parseMsgReadPayload,
  requestActiveUsers,
  requestInactiveUsers,
  send,
} from './api';
import {
  deleteMessage,
  editMessage,
  getMessageHistory,
  markAsRead,
  sendMessage,
} from './api/messages';
import { createAboutPage } from './components/about-page';
import { createAuthPage } from './components/auth-page';
import { createChatPage } from './components/chat-page';
import { createFooter } from './components/footer';
import { createHeader } from './components/header';
import {
  CHAT_SERVER_WS_URL,
  CONNECTION_LOST_MESSAGE,
  MIN_UNREAD_COUNT,
  RECONNECT_DELAY_MS,
} from './constants';
import {
  createConnectionHandler,
  toConnectionLostMessage,
  type ConnectionHandler,
} from './utils/connection-handler';
import {
  clearCurrentUser,
  clearSessionPassword,
  getCurrentUser,
  getSessionPassword,
  setCurrentUser,
  setSessionPassword,
} from './storage/auth-storage';
import {
  AppState,
  AuthState,
  ChatState,
  AuthPageMode,
  type ListUser,
  ROUTE_PATHS,
  RoutePath,
} from './types/types';
import { isRoutePath } from './types/type-guards';
import {
  WS_MESSAGE_TYPE,
  type WsChatMessage,
  type WsErrorPayload,
  type WsExternalUserPayload,
  type WsMessageBase,
  type WsUserItem,
  type WsUserLoginResponsePayload,
} from './types/ws-types';
import DomElement from './utils/create-element';

export function doLogout(onNavigate: (path: RoutePath) => void): void {
  const user = appState.auth.user;
  const password = getSessionPassword();

  if (user !== null && password !== null && isConnected()) {
    send({
      id: createRequestId(),
      type: WS_MESSAGE_TYPE.USER_LOGOUT,
      payload: { user: { login: user.name, password } },
    });
  }

  close();
  clearSessionPassword();
  clearCurrentUser();
  appState.auth.user = null;
  appState.chat.listUsers = [];
  appState.chat.onlineUsers = [];
  appState.chat.unreadCounts = {};
  appState.chat.selectedUserLogin = null;
  appState.chat.messagesWithSelected = [];
  appState.chat.unreadDividerDismissedForSelected = false;
  chatUsersListLoaded = false;
  onNavigate(ROUTE_PATHS.login);
}

const PROTECTED_PATHS = new Set<RoutePath>([ROUTE_PATHS.chat]);

const initialAuthState: AuthState = {
  user: null,
};

const initialChatState: ChatState = {
  onlineUsers: [],
  listUsers: [],
  unreadCounts: {},
  selectedUserLogin: null,
  messagesWithSelected: [],
  unreadDividerDismissedForSelected: false,
};

const appState: AppState = {
  auth: initialAuthState,
  chat: initialChatState,
};

let rootElement: HTMLElement | null = null;

let chatUsersListLoaded = false;
let connectionHandler: ConnectionHandler | null = null;
let lastRenderedPath: RoutePath = ROUTE_PATHS.login;

function getLoginFromUserItem(item: WsUserItem): string {
  const desc = Object.getOwnPropertyDescriptor(item, 'login');
  const val: unknown = desc?.value;
  return typeof val === 'string' ? val : '';
}

function toUnreadCount(raw: unknown): number {
  if (typeof raw !== 'number' || raw < MIN_UNREAD_COUNT) {
    return 0;
  }
  const num: number = raw;
  return num;
}

function buildListUsers(
  activeLogins: string[],
  inactiveLogins: string[],
  onlineLogins: string[],
  currentLogin: string,
  unreadCounts: Record<string, number>
): ListUser[] {
  const seen = new Set<string>();
  const result: ListUser[] = [];

  for (const login of activeLogins) {
    if (seen.has(login) || login === currentLogin) continue;
    seen.add(login);
    const n = unreadCounts[login];
    result.push({
      login,
      isOnline: true,
      unreadCount: toUnreadCount(n),
    });
  }

  for (const login of inactiveLogins) {
    if (seen.has(login) || login === currentLogin) continue;
    seen.add(login);
    const n = unreadCounts[login];
    result.push({
      login,
      isOnline: onlineLogins.includes(login),
      unreadCount: toUnreadCount(n),
    });
  }

  return result;
}

function setUnreadCountForLogin(login: string, count: number): void {
  appState.chat.unreadCounts[login] = count;
  const next: ListUser[] = [];
  for (const u of appState.chat.listUsers) {
    const l = u.login;
    const n = l === login ? toUnreadCount(count) : u.unreadCount;
    next.push({
      login: l,
      isOnline: u.isOnline,
      unreadCount: n,
    });
  }
  appState.chat.listUsers = next;
}

function loadChatUsers(currentUserLogin: string): void {
  if (!isConnected()) return;

  Promise.all([requestActiveUsers(), requestInactiveUsers()])
    .then(([activeItems, inactiveItems]: [WsUserItem[], WsUserItem[]]) => {
      const activeLogins: string[] = activeItems.map((item) =>
        getLoginFromUserItem(item)
      );
      const inactiveLogins: string[] = inactiveItems.map((item) =>
        getLoginFromUserItem(item)
      );
      const list = buildListUsers(
        activeLogins,
        inactiveLogins,
        appState.chat.onlineUsers,
        currentUserLogin,
        appState.chat.unreadCounts
      );
      appState.chat.listUsers = list;
      chatUsersListLoaded = true;
      const path: RoutePath = ROUTE_PATHS.chat;
      renderCurrentRoute(path);
    })
    .catch(() => {
      appState.chat.listUsers = [];
    });
}

function isProtectedPath(path: RoutePath): boolean {
  return PROTECTED_PATHS.has(path);
}

function normalizePath(path: string): RoutePath {
  if (path === '/') {
    if (appState.auth.user !== null) {
      return ROUTE_PATHS.chat;
    }

    return ROUTE_PATHS.login;
  }

  return isRoutePath(path) ? path : ROUTE_PATHS.login;
}

function clearRoot(): void {
  if (rootElement === null) {
    return;
  }

  while (rootElement.firstChild !== null) {
    rootElement.firstChild.remove();
  }
}

function isErrorPayload(p: unknown): p is WsErrorPayload {
  if (typeof p !== 'object' || p === null) return false;
  const val: unknown = Object.getOwnPropertyDescriptor(p, 'error')?.value;
  return typeof val === 'string';
}

function isLoginResponsePayload(p: unknown): p is WsUserLoginResponsePayload {
  if (typeof p !== 'object' || p === null) return false;
  const userVal: unknown = Object.getOwnPropertyDescriptor(p, 'user')?.value;
  if (typeof userVal !== 'object' || userVal === null) return false;
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

function isExternalUserPayload(p: unknown): p is WsExternalUserPayload {
  if (typeof p !== 'object' || p === null) return false;
  const userVal: unknown = Object.getOwnPropertyDescriptor(p, 'user')?.value;
  if (typeof userVal !== 'object' || userVal === null) return false;
  const loginVal: unknown = Object.getOwnPropertyDescriptor(
    userVal,
    'login'
  )?.value;
  return typeof loginVal === 'string';
}

function handleLoginResponse(
  msg: WsMessageBase,
  userName: string,
  password: string,
  onError: (message: string) => void
): void {
  const payload: unknown = msg.payload;

  if (msg.type === WS_MESSAGE_TYPE.ERROR && isErrorPayload(payload)) {
    onError(String(payload.error ?? 'Unknown error'));
    return;
  }

  if (msg.type !== WS_MESSAGE_TYPE.USER_LOGIN) {
    return;
  }

  if (!isLoginResponsePayload(payload)) {
    return;
  }

  const loginPayload: WsUserLoginResponsePayload = payload;
  if (loginPayload.user?.isLogined === true) {
    setCurrentUser(userName);
    setSessionPassword(password);
    appState.auth.user = { name: userName };
    navigate(ROUTE_PATHS.chat);
  } else {
    onError('Login failed');
  }
}

function handleAuthSubmit(
  userName: string,
  password: string,
  onError: (message: string) => void
): void {
  connect(CHAT_SERVER_WS_URL)
    .then(() => {
      const id = createRequestId();
      send({
        id,
        type: WS_MESSAGE_TYPE.USER_LOGIN,
        payload: { user: { login: userName, password } },
      });
      onResponse(id, (msg) =>
        handleLoginResponse(msg, userName, password, onError)
      );
    })
    .catch(() => {
      onError('Connection failed');
    });
}

function selectUserAndLoadHistory(login: string): void {
  appState.chat.selectedUserLogin = login;
  appState.chat.unreadDividerDismissedForSelected = false;
  appState.chat.messagesWithSelected = [];

  void getMessageHistory(login)
    .then((msgs: WsChatMessage[]) => {
      appState.chat.messagesWithSelected = msgs;
      renderCurrentRoute(ROUTE_PATHS.chat);
    })
    .catch(() => {
      renderCurrentRoute(ROUTE_PATHS.chat);
    });
}

function dismissUnreadDivider(): void {
  appState.chat.unreadDividerDismissedForSelected = true;
  const currentUser = appState.auth.user;
  if (currentUser === null) {
    renderCurrentRoute(ROUTE_PATHS.chat);
  } else {
    const toMark = appState.chat.messagesWithSelected.filter(
      (m) => m.from !== currentUser.name && !m.status.isReaded
    );
    if (toMark.length > 0) {
      void Promise.all(toMark.map((m) => markAsRead(m.id))).then(() => {
        renderCurrentRoute(ROUTE_PATHS.chat);
      });
    } else {
      renderCurrentRoute(ROUTE_PATHS.chat);
    }
  }
}

function sendMessageFromDialog(text: string): void {
  const to = appState.chat.selectedUserLogin;
  if (to === null) return;
  if (text.trim() === '') return;

  void sendMessage(to, text.trim())
    .then((msg: WsChatMessage) => {
      appState.chat.messagesWithSelected = [
        ...appState.chat.messagesWithSelected,
        msg,
      ];
      renderCurrentRoute(ROUTE_PATHS.chat);
    })
    .catch(() => {
      renderCurrentRoute(ROUTE_PATHS.chat);
    });
}

function deleteMessageFromDialog(messageId: string): void {
  void deleteMessage(messageId)
    .then((result) => {
      if (result.isDeleted) {
        appState.chat.messagesWithSelected =
          appState.chat.messagesWithSelected.filter((m) => m.id !== messageId);
      }
      renderCurrentRoute(ROUTE_PATHS.chat);
    })
    .catch(() => {
      renderCurrentRoute(ROUTE_PATHS.chat);
    });
}

function editMessageFromDialog(messageId: string, text: string): void {
  const trimmed = text.trim();
  if (trimmed === '') return;

  void editMessage(messageId, trimmed)
    .then((result) => {
      const list = appState.chat.messagesWithSelected;
      const next = list.map((m) =>
        m.id === result.id
          ? {
              ...m,
              text: result.text,
              status: { ...m.status, isEdited: result.isEdited },
            }
          : m
      );
      appState.chat.messagesWithSelected = next;
      renderCurrentRoute(ROUTE_PATHS.chat);
    })
    .catch(() => {
      renderCurrentRoute(ROUTE_PATHS.chat);
    });
}

function reRenderChat(): void {
  renderCurrentRoute(ROUTE_PATHS.chat);
}

function createPageForPath(path: RoutePath): HTMLElement {
  if (path === ROUTE_PATHS.chat) {
    return createChatPage(
      appState,
      selectUserAndLoadHistory,
      dismissUnreadDivider,
      sendMessageFromDialog,
      deleteMessageFromDialog,
      editMessageFromDialog,
      reRenderChat
    );
  }

  if (path === ROUTE_PATHS.about) {
    return createAboutPage();
  }

  const mode: AuthPageMode =
    path === ROUTE_PATHS.register ? 'register' : 'login';

  return createAuthPage(mode, handleAuthSubmit);
}

function maybeLoadChatUsers(path: RoutePath): void {
  const onChat = path === ROUTE_PATHS.chat;
  const connected = isConnected();
  const currentUser = appState.auth.user;
  const shouldLoadUsers =
    onChat && connected && currentUser !== null && !chatUsersListLoaded;

  if (shouldLoadUsers && currentUser !== null) {
    loadChatUsers(currentUser.name);
  }
}

function renderCurrentRoute(path: RoutePath): void {
  if (rootElement === null) {
    return;
  }

  const normalizedPath: RoutePath = normalizePath(path);

  if (isProtectedPath(normalizedPath) && appState.auth.user === null) {
    navigate(ROUTE_PATHS.login, true);

    return;
  }

  const authPaths: RoutePath[] = [ROUTE_PATHS.login, ROUTE_PATHS.register];

  if (authPaths.includes(normalizedPath) && appState.auth.user !== null) {
    navigate(ROUTE_PATHS.chat, true);

    return;
  }

  lastRenderedPath = normalizedPath;
  clearRoot();
  connectionHandler?.appendBanner(rootElement);

  const headerElement: HTMLElement = createHeader(
    appState,
    normalizedPath,
    navigate,
    () => doLogout(navigate)
  );
  const mainContainer = new DomElement('main', 'app-main');
  const footerElement: HTMLElement = createFooter();

  const pageElement: HTMLElement = createPageForPath(normalizedPath);

  mainContainer.element.append(pageElement);

  rootElement.append(headerElement);
  rootElement.append(mainContainer.element);
  rootElement.append(footerElement);

  maybeLoadChatUsers(normalizedPath);
}

export function navigate(path: RoutePath, replace: boolean = false): void {
  const normalizedPath: RoutePath = normalizePath(path);
  const currentPath: string = globalThis.location.pathname;

  if (currentPath !== normalizedPath) {
    if (replace) {
      globalThis.history.replaceState(null, '', normalizedPath);
    } else {
      globalThis.history.pushState(null, '', normalizedPath);
    }
  }

  renderCurrentRoute(normalizedPath);
}

function isLoginInListUsers(login: string): boolean {
  for (const u of appState.chat.listUsers) {
    const desc = Object.getOwnPropertyDescriptor(u, 'login');
    const val: unknown = desc?.value;
    if (typeof val === 'string' && val === login) return true;
  }
  return false;
}

function addNewUserToList(login: string): void {
  const next: ListUser[] = [];
  for (const u of appState.chat.listUsers) {
    const desc = Object.getOwnPropertyDescriptor(u, 'login');
    const val: unknown = desc?.value;
    const l: string = typeof val === 'string' ? val : '';
    const unreadDesc = Object.getOwnPropertyDescriptor(u, 'unreadCount');
    const unreadVal: unknown = unreadDesc?.value;
    const onlineDesc = Object.getOwnPropertyDescriptor(u, 'isOnline');
    const onlineVal: unknown = onlineDesc?.value;
    const isOnline = typeof onlineVal === 'boolean' ? onlineVal : false;
    next.push({
      login: l,
      isOnline,
      unreadCount: toUnreadCount(unreadVal),
    });
  }
  next.push({
    login,
    isOnline: true,
    unreadCount: toUnreadCount(MIN_UNREAD_COUNT),
  });
  appState.chat.listUsers = next;
}

function handleExternalUserMessage(
  type: string,
  payload: WsExternalUserPayload
): void {
  const rawLogin: unknown = payload.user?.login;

  if (typeof rawLogin !== 'string' || rawLogin === '') {
    return;
  }

  const login: string = rawLogin;

  if (type === WS_MESSAGE_TYPE.USER_EXTERNAL_LOGIN) {
    if (!appState.chat.onlineUsers.includes(login)) {
      appState.chat.onlineUsers = [...appState.chat.onlineUsers, login];
    }
    if (isLoginInListUsers(login)) {
      setUserOnlineInList(login);
    } else {
      addNewUserToList(login);
    }
  } else if (type === WS_MESSAGE_TYPE.USER_EXTERNAL_LOGOUT) {
    appState.chat.onlineUsers = appState.chat.onlineUsers.filter(
      (name) => name !== login
    );
    setUserOfflineInList(login);
  }

  renderCurrentRoute(ROUTE_PATHS.chat);
}

function setUserOnlineInList(login: string): void {
  const nextList: ListUser[] = [];
  for (const u of appState.chat.listUsers) {
    const loginDesc = Object.getOwnPropertyDescriptor(u, 'login');
    const loginVal: unknown = loginDesc?.value;
    const l: string = typeof loginVal === 'string' ? loginVal : '';
    const unreadDesc = Object.getOwnPropertyDescriptor(u, 'unreadCount');
    const unreadVal: unknown = unreadDesc?.value;
    const onlineDesc = Object.getOwnPropertyDescriptor(u, 'isOnline');
    const onlineVal: unknown = onlineDesc?.value;
    const wasOnline = typeof onlineVal === 'boolean' ? onlineVal : false;
    const isOnline = l === login ? true : wasOnline;
    nextList.push({
      login: l,
      isOnline,
      unreadCount: toUnreadCount(unreadVal),
    });
  }
  appState.chat.listUsers = nextList;
}

function setUserOfflineInList(login: string): void {
  const nextList: ListUser[] = [];
  for (const u of appState.chat.listUsers) {
    const loginDesc = Object.getOwnPropertyDescriptor(u, 'login');
    const loginVal: unknown = loginDesc?.value;
    const l: string = typeof loginVal === 'string' ? loginVal : '';
    const unreadDesc = Object.getOwnPropertyDescriptor(u, 'unreadCount');
    const unreadVal: unknown = unreadDesc?.value;
    const onlineDesc = Object.getOwnPropertyDescriptor(u, 'isOnline');
    const onlineVal: unknown = onlineDesc?.value;
    const wasOnline = typeof onlineVal === 'boolean' ? onlineVal : false;
    const isOnline = l === login ? false : wasOnline;
    nextList.push({
      login: l,
      isOnline,
      unreadCount: toUnreadCount(unreadVal),
    });
  }
  appState.chat.listUsers = nextList;
}

function handleRestoreResponse(
  msg: WsMessageBase,
  userName: string,
  password: string,
  resolve: (ok: boolean) => void
): void {
  const payload = msg.payload;

  if (msg.type === WS_MESSAGE_TYPE.ERROR && isErrorPayload(payload)) {
    clearCurrentUser();
    clearSessionPassword();
    resolve(false);
    return;
  }

  if (
    msg.type !== WS_MESSAGE_TYPE.USER_LOGIN ||
    !isLoginResponsePayload(payload)
  ) {
    resolve(false);
    return;
  }

  const loginPayload: WsUserLoginResponsePayload = payload;
  if (loginPayload.user?.isLogined !== true) {
    clearCurrentUser();
    clearSessionPassword();
    resolve(false);
    return;
  }

  setCurrentUser(userName);
  setSessionPassword(password);
  appState.auth.user = { name: userName };
  resolve(true);
}

function restoreSession(userName: string, password: string): Promise<boolean> {
  return connect(CHAT_SERVER_WS_URL)
    .then(() => {
      return new Promise<boolean>((resolve) => {
        const id = createRequestId();
        send({
          id,
          type: WS_MESSAGE_TYPE.USER_LOGIN,
          payload: { user: { login: userName, password } },
        });
        onResponse(id, (msg: WsMessageBase) => {
          handleRestoreResponse(msg, userName, password, resolve);
        });
      });
    })
    .catch(() => {
      return false;
    });
}

function handleMsgFromUserPush(payload: unknown): void {
  const message = parseMessagePayload(payload);
  if (message === null) return;

  const currentUser = appState.auth.user;
  if (currentUser === null) return;
  if (message.to !== currentUser.name) return;

  const fromLogin = message.from;
  if (appState.chat.selectedUserLogin === fromLogin) {
    appState.chat.messagesWithSelected = [
      ...appState.chat.messagesWithSelected,
      message,
    ];
    appState.chat.unreadDividerDismissedForSelected = true;
    void markAsRead(message.id);
  }

  if (appState.chat.selectedUserLogin !== fromLogin) {
    const prev = appState.chat.unreadCounts[fromLogin] ?? 0;
    setUnreadCountForLogin(fromLogin, prev + 1);
  }
  renderCurrentRoute(lastRenderedPath);
}

function handleMsgDeliver(payload: unknown): void {
  const parsed = parseMsgDeliverPayload(payload);
  if (parsed === null) return;

  const list = appState.chat.messagesWithSelected;
  const next = list.map((m) =>
    m.id === parsed.id
      ? { ...m, status: { ...m.status, isDelivered: parsed.isDelivered } }
      : m
  );
  appState.chat.messagesWithSelected = next;
  renderCurrentRoute(ROUTE_PATHS.chat);
}

function handleMsgRead(payload: unknown): void {
  const parsed = parseMsgReadPayload(payload);
  if (parsed === null) return;

  const list = appState.chat.messagesWithSelected;
  const next = list.map((m) =>
    m.id === parsed.id
      ? { ...m, status: { ...m.status, isReaded: parsed.isReaded } }
      : m
  );
  appState.chat.messagesWithSelected = next;
  renderCurrentRoute(ROUTE_PATHS.chat);
}

function handleMsgDelete(payload: unknown): void {
  const parsed = parseMsgDeletePayload(payload);
  if (parsed === null || !parsed.isDeleted) return;

  appState.chat.messagesWithSelected =
    appState.chat.messagesWithSelected.filter((m) => m.id !== parsed.id);
  renderCurrentRoute(ROUTE_PATHS.chat);
}

function handleMsgEdit(payload: unknown): void {
  const parsed = parseMsgEditPayload(payload);
  if (parsed === null) return;

  const list = appState.chat.messagesWithSelected;
  const next = list.map((m) =>
    m.id === parsed.id
      ? {
          ...m,
          text: parsed.text,
          status: { ...m.status, isEdited: parsed.isEdited },
        }
      : m
  );
  appState.chat.messagesWithSelected = next;
  renderCurrentRoute(ROUTE_PATHS.chat);
}

function handleMsgCountPush(payload: unknown): void {
  const parsed = parseCountPushPayload(payload);
  if (parsed === null) return;

  setUnreadCountForLogin(parsed.login, parsed.count);
  renderCurrentRoute(ROUTE_PATHS.chat);
}

function isMsgFromUserPush(payload: unknown): boolean {
  if (typeof payload !== 'object' || payload === null) return false;
  return (
    Object.getOwnPropertyDescriptor(payload, 'message') !== undefined &&
    Object.getOwnPropertyDescriptor(payload, 'messages') === undefined
  );
}

function dispatchTypedPush(msg: WsMessageBase): boolean {
  if (
    msg.type === WS_MESSAGE_TYPE.MSG_FROM_USER &&
    msg.id === null &&
    isMsgFromUserPush(msg.payload)
  ) {
    handleMsgFromUserPush(msg.payload);
    return true;
  }
  if (msg.type === WS_MESSAGE_TYPE.MSG_DELIVER) {
    handleMsgDeliver(msg.payload);
    return true;
  }
  if (msg.type === WS_MESSAGE_TYPE.MSG_READ && msg.id === null) {
    handleMsgRead(msg.payload);
    return true;
  }
  if (msg.type === WS_MESSAGE_TYPE.MSG_DELETE && msg.id === null) {
    handleMsgDelete(msg.payload);
    return true;
  }
  if (msg.type === WS_MESSAGE_TYPE.MSG_EDIT && msg.id === null) {
    handleMsgEdit(msg.payload);
    return true;
  }
  if (
    msg.type === WS_MESSAGE_TYPE.MSG_COUNT_NOT_READED_FROM_USER &&
    msg.id === null
  ) {
    handleMsgCountPush(msg.payload);
    return true;
  }
  return false;
}

function tryHandleIncomingMessagePush(msg: WsMessageBase): void {
  if (msg.id !== null) return;
  const parsed = parseMessagePayload(msg.payload);
  const currentUser = appState.auth.user;
  if (
    parsed !== null &&
    currentUser !== null &&
    parsed.to === currentUser.name
  ) {
    handleMsgFromUserPush(msg.payload);
  }
}

function handleWsMessage(msg: WsMessageBase): void {
  const isExternal =
    msg.type === WS_MESSAGE_TYPE.USER_EXTERNAL_LOGIN ||
    msg.type === WS_MESSAGE_TYPE.USER_EXTERNAL_LOGOUT;

  if (isExternal && isExternalUserPayload(msg.payload)) {
    handleExternalUserMessage(msg.type, msg.payload);
    return;
  }
  if (dispatchTypedPush(msg)) return;
  tryHandleIncomingMessagePush(msg);
}

function getReconnectDelayMsValue(): number {
  return RECONNECT_DELAY_MS;
}

function setupInitialRoute(initialPath: RoutePath): void {
  const storedUser = getCurrentUser();
  const storedPassword = getSessionPassword();

  if (storedUser !== null && storedPassword !== null) {
    void restoreSession(storedUser, storedPassword).then((ok) => {
      if (ok) {
        if (globalThis.location.pathname !== ROUTE_PATHS.chat) {
          globalThis.history.replaceState(null, '', ROUTE_PATHS.chat);
        }
        renderCurrentRoute(ROUTE_PATHS.chat);
      } else {
        renderCurrentRoute(initialPath);
      }
    });
  } else {
    renderCurrentRoute(initialPath);
  }
}

export function initApp(root: HTMLElement): void {
  rootElement = root;

  connectionHandler = createConnectionHandler({
    wsUrl: CHAT_SERVER_WS_URL,
    getReconnectDelayMs: getReconnectDelayMsValue,
    connectionLostMessageText: toConnectionLostMessage(CONNECTION_LOST_MESSAGE),
    getCredentials: () => {
      const userName = getCurrentUser();
      const password = getSessionPassword();

      return userName !== null && password !== null
        ? { userName, password }
        : null;
    },
    restoreSession,
    getLastRenderedPath: () => lastRenderedPath,
    render: renderCurrentRoute,
    onReauthSuccess: () => {
      chatUsersListLoaded = false;
      if (globalThis.location.pathname !== ROUTE_PATHS.chat) {
        globalThis.history.replaceState(null, '', ROUTE_PATHS.chat);
      }
      renderCurrentRoute(ROUTE_PATHS.chat);
    },
    onReauthFail: () => renderCurrentRoute(lastRenderedPath),
  });

  onUnexpectedClose(() => connectionHandler?.handleUnexpectedClose());
  onMessage(handleWsMessage);

  const currentPathname: string = globalThis.location.pathname;
  const initialPath: RoutePath = normalizePath(currentPathname);

  lastRenderedPath = initialPath;

  if (currentPathname !== initialPath) {
    globalThis.history.replaceState(null, '', initialPath);
  }

  globalThis.addEventListener('popstate', () => {
    renderCurrentRoute(normalizePath(globalThis.location.pathname));
  });

  setupInitialRoute(initialPath);
}
