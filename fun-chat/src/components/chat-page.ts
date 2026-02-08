import type { AppState, ListUser } from '../types/types';
import Tag from '../utils/tag';

const USERS_HEADING = 'Users';
const SEARCH_PLACEHOLDER = 'Search users…';
const DIALOG_PLACEHOLDER = 'Select a chat or start a conversation';
const INPUT_PLACEHOLDER = 'Type a message…';
const SEND_LABEL = 'Send';

function filterUsersBySearch(users: ListUser[], query: string): ListUser[] {
  const q = query.trim().toLowerCase();
  if (q === '') return users;
  return users.filter((u) => u.login.toLowerCase().includes(q));
}

function buildUserListItem(user: ListUser): Tag {
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
  return li;
}

function renderUserList(
  listElement: HTMLElement,
  users: ListUser[],
  searchQuery: string
): void {
  const filtered = filterUsersBySearch(users, searchQuery);

  while (listElement.firstChild !== null) {
    listElement.firstChild.remove();
  }

  for (const user of filtered) {
    const item = buildUserListItem(user);
    listElement.append(item.element);
  }
}

function buildUserList(state: AppState): Tag {
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

  renderUserList(list.element, state.chat.listUsers, '');

  searchInput.addEventListener('input', () => {
    const el = searchInput.element;
    const query =
      el instanceof HTMLInputElement && typeof el.value === 'string'
        ? el.value
        : '';
    renderUserList(list.element, state.chat.listUsers, query);
  });

  return aside;
}

function buildDialogArea(): Tag {
  const wrap = new Tag('div', 'chat-dialog-wrap');
  const messages = new Tag('div', 'chat-messages');
  const placeholder = new Tag(
    'p',
    'chat-dialog-placeholder',
    DIALOG_PLACEHOLDER
  );

  messages.element.append(placeholder.element);
  wrap.append(messages.element);
  return wrap;
}

function buildInputArea(): Tag {
  const wrap = new Tag('div', 'chat-input-wrap');
  const row = new Tag('div', 'chat-input-row');
  const input = new Tag('input', 'chat-input');
  const sendBtn = new Tag('button', 'chat-send', SEND_LABEL);
  const status = new Tag('div', 'chat-status');

  input.setAttribute('type', 'text');
  input.setAttribute('placeholder', INPUT_PLACEHOLDER);
  sendBtn.setAttribute('type', 'button');
  status.setAttribute('aria-label', 'Message status');

  row.append(input.element);
  row.append(sendBtn.element);
  wrap.append(row.element);
  wrap.append(status.element);
  return wrap;
}

function buildChatLayout(state: AppState): Tag {
  const layout = new Tag('div', 'chat-layout');
  const userList = buildUserList(state);
  const dialog = buildDialogArea();
  const inputArea = buildInputArea();
  const dialogColumn = new Tag('div', 'chat-dialog-column');

  dialogColumn.append(dialog.element);
  dialogColumn.append(inputArea.element);
  layout.append(userList.element);
  layout.append(dialogColumn.element);
  return layout;
}

export function createChatPage(state: AppState): HTMLElement {
  const container = new Tag('section', 'page chat-page');
  const layout = buildChatLayout(state);

  container.append(layout.element);
  return container.element;
}
