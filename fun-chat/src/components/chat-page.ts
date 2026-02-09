import type { AppState, ListUser } from '../types/types';
import type { WsChatMessage } from '../types/ws-types';
import Tag from '../utils/tag';

const USERS_HEADING = 'Users';
const SEARCH_PLACEHOLDER = 'Search users…';
const DIALOG_PLACEHOLDER = 'Select a chat or start a conversation';
const INPUT_PLACEHOLDER = 'Type a message…';
const SEND_LABEL = 'Send';
const UNREAD_DIVIDER_LABEL = 'New messages';
const BEGINNING_OF_DIALOG_LABEL = 'Beginning of dialog';
const EDITED_LABEL = 'edited';
const DELETE_LABEL = 'Delete';
const EDIT_LABEL = 'Edit';
const SAVE_LABEL = 'Save';
const CANCEL_LABEL = 'Cancel';
const SENDER_ME_LABEL = 'You';
const STATUS_DELIVERED_LABEL = 'Delivered';
const STATUS_READ_LABEL = 'Read';

function formatMessageTime(datetime: number): string {
  const date = new Date(datetime);
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildMessageMeta(msg: WsChatMessage, currentLogin: string): Tag {
  const isMine = msg.from === currentLogin;
  const meta = new Tag('div', 'chat-message-meta');
  const senderName = isMine ? SENDER_ME_LABEL : msg.from;
  const sender = new Tag('span', 'chat-message-sender', senderName);
  const timeSpan = new Tag(
    'span',
    'chat-message-time',
    formatMessageTime(msg.datetime)
  );
  meta.append(sender.element);
  meta.append(timeSpan.element);
  return meta;
}

function buildMessageStatusTag(
  msg: WsChatMessage,
  isMine: boolean
): Tag | null {
  if (!isMine || (!msg.status.isDelivered && !msg.status.isReaded)) {
    return null;
  }
  const label = msg.status.isReaded
    ? STATUS_READ_LABEL
    : STATUS_DELIVERED_LABEL;
  return new Tag('span', 'chat-message-status', label);
}

function filterUsersBySearch(users: ListUser[], query: string): ListUser[] {
  const q = query.trim().toLowerCase();
  if (q === '') return users;
  return users.filter((u) => u.login.toLowerCase().includes(q));
}

function buildUserListItem(
  user: ListUser,
  onSelectUser: (login: string) => void
): Tag {
  const li = new Tag('li', 'chat-user-item');
  const name = new Tag('span', 'chat-user-name', user.login);
  const indicators = new Tag('span', 'chat-user-indicators');

  const onlineClass = user.isOnline ? 'chat-user-online' : 'chat-user-offline';
  const onlineLabel = user.isOnline ? 'online' : 'offline';
  const onlineDot = new Tag('span', onlineClass);
  onlineDot.setAttribute('aria-label', onlineLabel);
  onlineDot.setAttribute('title', onlineLabel);

  indicators.append(onlineDot.element);

  if (user.unreadCount > 0) {
    const unread = new Tag(
      'span',
      'chat-user-unread',
      String(user.unreadCount)
    );
    unread.setAttribute('aria-label', `Unread: ${user.unreadCount}`);
    indicators.append(unread.element);
  }

  li.append(name.element);
  li.append(indicators.element);
  li.element.addEventListener('click', () => onSelectUser(user.login));
  li.element.setAttribute('role', 'button');
  return li;
}

function renderUserList(
  listElement: HTMLElement,
  users: ListUser[],
  searchQuery: string,
  onSelectUser: (login: string) => void
): void {
  const filtered = filterUsersBySearch(users, searchQuery);

  while (listElement.firstChild !== null) {
    listElement.firstChild.remove();
  }

  for (const user of filtered) {
    const item = buildUserListItem(user, onSelectUser);
    listElement.append(item.element);
  }
}

function buildUserList(
  state: AppState,
  onSelectUser: (login: string) => void
): Tag {
  const aside = new Tag('aside', 'chat-users');
  const heading = new Tag('h2', 'chat-users-heading', USERS_HEADING);
  const searchInput = new Tag('input', 'chat-users-search');
  const list = new Tag('ul', 'chat-users-list');

  searchInput.setAttribute('type', 'text');
  searchInput.setAttribute('placeholder', SEARCH_PLACEHOLDER);
  searchInput.setAttribute('aria-label', SEARCH_PLACEHOLDER);

  aside.append(heading.element);
  aside.append(searchInput.element);
  aside.append(list.element);

  renderUserList(list.element, state.chat.listUsers, '', onSelectUser);

  searchInput.addEventListener('input', () => {
    const el = searchInput.element;
    const query =
      el instanceof HTMLInputElement && typeof el.value === 'string'
        ? el.value
        : '';
    renderUserList(list.element, state.chat.listUsers, query, onSelectUser);
  });

  return aside;
}

function buildDialogHeader(selectedLogin: string, isOnline: boolean): Tag {
  const header = new Tag('div', 'chat-dialog-header');
  const name = new Tag('span', 'chat-dialog-header-name', selectedLogin);
  const dot = new Tag(
    'span',
    isOnline ? 'chat-dialog-header-online' : 'chat-dialog-header-offline'
  );
  dot.setAttribute('aria-label', isOnline ? 'online' : 'offline');
  dot.setAttribute('title', isOnline ? 'online' : 'offline');
  header.append(name.element);
  header.append(dot.element);
  return header;
}

function showEditMode(
  body: HTMLElement,
  msg: WsChatMessage,
  onEditMessage: (messageId: string, text: string) => void,
  onCancelEdit: () => void
): void {
  const input = new Tag('input', 'chat-message-edit-input');
  input.setAttribute('type', 'text');
  input.element.setAttribute('value', msg.text);
  const saveBtn = new Tag('button', 'chat-message-edit-save', SAVE_LABEL);
  saveBtn.setAttribute('type', 'button');
  const cancelBtn = new Tag('button', 'chat-message-edit-cancel', CANCEL_LABEL);
  cancelBtn.setAttribute('type', 'button');
  const row = new Tag('div', 'chat-message-edit-row');
  row.append(saveBtn.element);
  row.append(cancelBtn.element);
  while (body.firstChild !== null) body.firstChild.remove();
  body.append(input.element);
  body.append(row.element);
  if (input.element instanceof HTMLInputElement) {
    input.element.focus();
    input.element.select();
  }
  saveBtn.element.addEventListener('click', () => {
    const newText =
      input.element instanceof HTMLInputElement
        ? input.element.value.trim()
        : '';
    if (newText !== '') onEditMessage(msg.id, newText);
  });
  cancelBtn.element.addEventListener('click', () => onCancelEdit());
}

function buildMessageItem(
  msg: WsChatMessage,
  currentLogin: string,
  onDeleteMessage: (messageId: string) => void,
  onEditMessage: (messageId: string, text: string) => void,
  onCancelEdit: () => void
): Tag {
  const isMine = msg.from === currentLogin;
  const root = new Tag(
    'div',
    isMine
      ? 'chat-message chat-message--mine'
      : 'chat-message chat-message--theirs'
  );
  root.append(buildMessageMeta(msg, currentLogin).element);
  root.append(new Tag('span', 'chat-message-text', msg.text).element);
  const statusTag = buildMessageStatusTag(msg, isMine);
  if (statusTag !== null) root.append(statusTag.element);
  if (msg.status.isEdited) {
    root.append(new Tag('span', 'chat-message-edited', EDITED_LABEL).element);
  }
  if (isMine) {
    const actions = new Tag('div', 'chat-message-actions');
    const editBtn = new Tag('button', 'chat-message-edit', EDIT_LABEL);
    editBtn.setAttribute('type', 'button');
    editBtn.setAttribute('aria-label', 'Edit message');
    editBtn.element.addEventListener('click', () => {
      showEditMode(root.element, msg, onEditMessage, onCancelEdit);
    });
    const deleteBtn = new Tag('button', 'chat-message-delete', DELETE_LABEL);
    deleteBtn.setAttribute('type', 'button');
    deleteBtn.setAttribute('aria-label', `Delete message: ${msg.text}`);
    deleteBtn.element.addEventListener('click', () => onDeleteMessage(msg.id));
    actions.append(editBtn.element);
    actions.append(deleteBtn.element);
    root.append(actions.element);
  }
  return root;
}

function buildUnreadDivider(): Tag {
  const div = new Tag('div', 'chat-unread-divider');
  const label = new Tag(
    'span',
    'chat-unread-divider-label',
    UNREAD_DIVIDER_LABEL
  );
  div.append(label.element);
  return div;
}

function buildBeginningOfDialog(): Tag {
  const div = new Tag('div', 'chat-beginning-of-dialog');
  const label = new Tag(
    'span',
    'chat-beginning-of-dialog-label',
    BEGINNING_OF_DIALOG_LABEL
  );
  div.append(label.element);
  return div;
}

function appendSelectedDialogContent(
  state: AppState,
  wrap: Tag,
  messagesContainer: Tag,
  onDeleteMessage: (messageId: string) => void,
  onEditMessage: (messageId: string, text: string) => void,
  onCancelEdit: () => void
): void {
  const selectedLogin = state.chat.selectedUserLogin;
  if (selectedLogin === null) return;
  const currentLogin = state.auth.user?.name ?? '';
  const selectedUser = state.chat.listUsers.find((u) => u.login === selectedLogin);
  const isOnline =
    selectedUser?.isOnline ?? state.chat.onlineUsers.includes(selectedLogin);
  wrap.append(buildDialogHeader(selectedLogin, isOnline).element);
  const sorted = [...state.chat.messagesWithSelected].sort(
    (a, b) => a.datetime - b.datetime
  );
  if (sorted.length > 0) {
    messagesContainer.element.append(buildBeginningOfDialog().element);
  }
  const showDivider =
    !state.chat.unreadDividerDismissedForSelected && currentLogin !== '';
  let dividerInserted = false;
  for (const msg of sorted) {
    const isIncoming = msg.from !== currentLogin;
    if (showDivider && !dividerInserted && isIncoming && !msg.status.isReaded) {
      messagesContainer.element.append(buildUnreadDivider().element);
      dividerInserted = true;
    }
    messagesContainer.element.append(
      buildMessageItem(
        msg,
        currentLogin,
        onDeleteMessage,
        onEditMessage,
        onCancelEdit
      ).element
    );
  }
}

function buildDialogArea(
  state: AppState,
  onDeleteMessage: (messageId: string) => void,
  onEditMessage: (messageId: string, text: string) => void,
  onCancelEdit: () => void
): {
  wrap: Tag;
  messagesElement: HTMLElement;
} {
  const wrap = new Tag('div', 'chat-dialog-wrap');
  const messagesContainer = new Tag('div', 'chat-messages');
  if (state.chat.selectedUserLogin === null) {
    const placeholder = new Tag(
      'p',
      'chat-dialog-placeholder',
      DIALOG_PLACEHOLDER
    );
    messagesContainer.element.append(placeholder.element);
  } else {
    appendSelectedDialogContent(
      state,
      wrap,
      messagesContainer,
      onDeleteMessage,
      onEditMessage,
      onCancelEdit
    );
  }
  wrap.append(messagesContainer.element);
  return { wrap, messagesElement: messagesContainer.element };
}

function buildInputArea(
  state: AppState,
  onSendMessage: (text: string) => void
): { wrap: Tag; inputElement: HTMLElement } {
  const wrap = new Tag('div', 'chat-input-wrap');
  const row = new Tag('div', 'chat-input-row');
  const input = new Tag('input', 'chat-input');
  const sendBtn = new Tag('button', 'chat-send', SEND_LABEL);
  const status = new Tag('div', 'chat-status');

  input.setAttribute('type', 'text');
  input.setAttribute('placeholder', INPUT_PLACEHOLDER);
  sendBtn.setAttribute('type', 'button');
  status.setAttribute('aria-label', 'Message status');

  const disabled = state.chat.selectedUserLogin === null;
  if (input.element instanceof HTMLInputElement) {
    input.element.disabled = disabled;
  }
  if (sendBtn.element instanceof HTMLButtonElement) {
    sendBtn.element.disabled = disabled;
  }

  const trySend = (): void => {
    if (!(input.element instanceof HTMLInputElement)) return;
    const text = input.element.value.trim();
    if (text === '') return;
    onSendMessage(text);
  };

  sendBtn.element.addEventListener('click', trySend);
  input.element.addEventListener('keydown', (e: Event) => {
    if (e instanceof KeyboardEvent && e.key === 'Enter') {
      e.preventDefault();
      trySend();
    }
  });

  row.append(input.element);
  row.append(sendBtn.element);
  wrap.append(row.element);
  wrap.append(status.element);
  return { wrap, inputElement: input.element };
}

function buildChatLayout(
  state: AppState,
  onSelectUser: (login: string) => void,
  onSendMessage: (text: string) => void,
  onDeleteMessage: (messageId: string) => void,
  onEditMessage: (messageId: string, text: string) => void,
  onCancelEdit: () => void
): { layout: Tag; messagesElement: HTMLElement; inputElement: HTMLElement } {
  const layout = new Tag('div', 'chat-layout');
  const userList = buildUserList(state, onSelectUser);
  const { wrap: dialogWrap, messagesElement } = buildDialogArea(
    state,
    onDeleteMessage,
    onEditMessage,
    onCancelEdit
  );
  const { wrap: inputAreaWrap, inputElement } = buildInputArea(
    state,
    onSendMessage
  );
  const dialogColumn = new Tag('div', 'chat-dialog-column');

  dialogColumn.append(dialogWrap.element);
  dialogColumn.append(inputAreaWrap.element);
  layout.append(userList.element);
  layout.append(dialogColumn.element);
  return { layout, messagesElement, inputElement };
}

function scrollMessagesToBottom(messagesElement: HTMLElement): void {
  requestAnimationFrame(() => {
    messagesElement.scrollTop = messagesElement.scrollHeight;
  });
}

export function createChatPage(
  state: AppState,
  onSelectUser: (login: string) => void,
  onDismissUnreadDivider: () => void,
  onSendMessage: (text: string) => void,
  onDeleteMessage: (messageId: string) => void,
  onEditMessage: (messageId: string, text: string) => void,
  onCancelEdit: () => void
): HTMLElement {
  const container = new Tag('section', 'page chat-page');
  const { layout, messagesElement, inputElement } = buildChatLayout(
    state,
    onSelectUser,
    onSendMessage,
    onDeleteMessage,
    onEditMessage,
    onCancelEdit
  );

  container.append(layout.element);

  if (state.chat.selectedUserLogin !== null) {
    if (state.chat.messagesWithSelected.length > 0) {
      scrollMessagesToBottom(messagesElement);
    }
    if (inputElement instanceof HTMLInputElement && !inputElement.disabled) {
      requestAnimationFrame(() => inputElement.focus());
    }
  }

  if (
    state.chat.selectedUserLogin !== null &&
    !state.chat.unreadDividerDismissedForSelected
  ) {
    const handler = (): void => onDismissUnreadDivider();
    messagesElement.addEventListener('scroll', handler);
    messagesElement.addEventListener('click', handler);
  }

  return container.element;
}
