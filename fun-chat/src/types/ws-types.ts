export const WS_MESSAGE_TYPE = {
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_EXTERNAL_LOGIN: 'USER_EXTERNAL_LOGIN',
  USER_EXTERNAL_LOGOUT: 'USER_EXTERNAL_LOGOUT',
  USER_ACTIVE: 'USER_ACTIVE',
  USER_INACTIVE: 'USER_INACTIVE',
  ERROR: 'ERROR',
  MSG_SEND: 'MSG_SEND',
  MSG_FROM_USER: 'MSG_FROM_USER',
  MSG_COUNT_NOT_READED_FROM_USER: 'MSG_COUNT_NOT_READED_FROM_USER',
  MSG_DELIVER: 'MSG_DELIVER',
  MSG_READ: 'MSG_READ',
  MSG_DELETE: 'MSG_DELETE',
  MSG_EDIT: 'MSG_EDIT',
} as const;

export interface WsMessageStatus {
  isDelivered: boolean;
  isReaded: boolean;
  isEdited: boolean;
}

export interface WsChatMessage {
  id: string;
  from: string;
  to: string;
  text: string;
  datetime: number;
  status: WsMessageStatus;
}

export interface WsMsgSendRequestPayload {
  message: {
    to: string;
    text: string;
  };
}

export interface WsMsgSendResponsePayload {
  message: WsChatMessage;
}

export interface WsMsgFromUserRequestPayload {
  user: { login: string };
}

export interface WsMsgFromUserResponsePayload {
  messages: WsChatMessage[];
}

export interface WsMsgCountNotReadedFromUserRequestPayload {
  user: { login: string };
}

export interface WsMsgCountNotReadedFromUserResponsePayload {
  count: number;
}

export interface WsMsgDeliverPayload {
  message: { id: string; status: { isDelivered: boolean } };
}

export interface WsMsgReadRequestPayload {
  message: { id: string };
}

export interface WsMsgReadResponsePayload {
  message: { id: string; status: { isReaded: boolean } };
}

export interface WsMsgDeleteRequestPayload {
  message: { id: string };
}

export interface WsMsgDeleteResponsePayload {
  message: { id: string; status: { isDeleted: boolean } };
}

export interface WsMsgEditRequestPayload {
  message: { id: string; text: string };
}

export interface WsMsgEditResponsePayload {
  message: { id: string; text: string; status: { isEdited: boolean } };
}

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
