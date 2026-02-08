export const WS_MESSAGE_TYPE = {
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_EXTERNAL_LOGIN: 'USER_EXTERNAL_LOGIN',
  USER_EXTERNAL_LOGOUT: 'USER_EXTERNAL_LOGOUT',
  USER_ACTIVE: 'USER_ACTIVE',
  USER_INACTIVE: 'USER_INACTIVE',
  ERROR: 'ERROR',
} as const;

export interface WsUserItem {
  login: string;
  isLogined?: boolean;
}

export interface WsUserActiveResponsePayload {
  users: WsUserItem[];
}

export interface WsUserInactiveResponsePayload {
  users: WsUserItem[];
}

export interface WsMessageBase<T = unknown> {
  id: string | null;
  type: string;
  payload: T;
}

export type MessageListener = (message: WsMessageBase) => void;

export interface WsUserLoginPayload {
  user: {
    login: string;
    password: string;
  };
}

export interface WsUserLoginResponsePayload {
  user: {
    login: string;
    isLogined: boolean;
  };
}

export interface WsUserLogoutPayload {
  user: {
    login: string;
    password: string;
  };
}

export interface WsUserLogoutResponsePayload {
  user: {
    login: string;
    isLogined: boolean;
  };
}

export interface WsErrorPayload {
  error: string;
}

export interface WsExternalUserPayload {
  user: {
    login: string;
    isLogined: boolean;
  };
}
