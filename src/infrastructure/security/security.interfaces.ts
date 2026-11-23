export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}

export interface ITokenService {
  signSession(payload: { userId: string; role: string }): Promise<string>;
  verifySession(token: string): Promise<{ userId: string; role: string } | null>;
}
