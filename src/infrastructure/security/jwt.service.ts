import { SignJWT, jwtVerify } from "jose";
import { ITokenService } from "./security.interfaces";

export class JoseTokenService implements ITokenService {
  private readonly defaultSecret = "default_jwt_secret_must_be_set_in_env_file";

  private getSecretKey(): Uint8Array {
    const secret = process.env.JWT_SECRET || this.defaultSecret;
    return new TextEncoder().encode(secret);
  }

  async signSession(payload: { userId: string; role: string }): Promise<string> {
    return await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(this.getSecretKey());
  }

  async verifySession(token: string): Promise<{ userId: string; role: string } | null> {
    try {
      const { payload } = await jwtVerify(token, this.getSecretKey());
      return {
        userId: payload.userId as string,
        role: (payload.role as string) || "USER",
      };
    } catch {
      return null;
    }
  }
}
