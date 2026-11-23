export interface IRateLimitRepository {
  checkLimit(key: string, limit: number, windowSeconds: number): Promise<boolean>;
}
