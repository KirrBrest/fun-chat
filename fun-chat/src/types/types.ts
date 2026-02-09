import type { WsChatMessage } from './ws-types';

export const APP_NAME = 'Fun Chat' as const;

export const ROUTE_PATHS = {
  login: '/login',
  register: '/register',
  chat: '/chat',
  about: '/about',
} as const;

export type RouteKey = keyof typeof ROUTE_PATHS;

export type RoutePath = (typeof ROUTE_PATHS)[RouteKey] | '/';

export interface User {
  name: string;
}

export interface AuthState {
  user: User | null;
}

export interface ListUser {
  login: string;
  isOnline: boolean;
  unreadCount: number;
}

export interface ChatState {
  onlineUsers: string[];
  listUsers: ListUser[];
  unreadCounts: Record<string, number>;
  selectedUserLogin: string | null;
  messagesWithSelected: WsChatMessage[];
  unreadDividerDismissedForSelected: boolean;
}

export interface AppState {
  auth: AuthState;
  chat: ChatState;
}

export type AuthPageMode = 'login' | 'register';

export type AuthSubmitHandler = (
  userName: string,
  password: string,
  onError: (message: string) => void
) => void;

export type NavigateHandler = (path: RoutePath) => void;

export type ConnectionHandlerOptions =
  import('../utils/connection-handler').ConnectionHandlerOptions;

export type ConnectionHandler =
  import('../utils/connection-handler').ConnectionHandler;
