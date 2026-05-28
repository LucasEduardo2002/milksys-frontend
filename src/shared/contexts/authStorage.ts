export const UNAUTHORIZED_EVENT = "sertao-serdo:unauthorized";

export type StoredAuthUser = {
  username: string;
};

export type StoredAuthState = {
  user: StoredAuthUser;
};
