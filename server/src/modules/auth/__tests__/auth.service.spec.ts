import { UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserRole } from "../../../common/enums/user-role.enum.js";
import { AuthService } from "../auth.service.js";

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */

const mockUsersRepo = {
  findOne: vi.fn(),
  update: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
};

const fakeEnv: Record<string, string> = {
  JWT_REFRESH_SECRET: "test-refresh-secret",
  JWT_REFRESH_TTL: "7d",
  JWT_SECRET: "test-access-secret",
  NODE_ENV: "test",
};

const mockConfigService = {
  get: vi.fn((key: string) => fakeEnv[key]),
  getOrThrow: vi.fn((key: string) => {
    const val = fakeEnv[key];
    if (val === undefined) throw new Error(`Missing config key: ${key}`);
    return val;
  }),
};

const mockJwtAccess = {
  sign: vi.fn(() => "mock-access-token"),
  verify: vi.fn(),
  verifyAsync: vi.fn(),
};

let service: AuthService;

beforeEach(() => {
  vi.clearAllMocks();

  service = new AuthService(mockUsersRepo as any, mockJwtAccess as any, mockConfigService as any);
});

/* ------------------------------------------------------------------ */
/*  hashPassword / comparePassword                                     */
/* ------------------------------------------------------------------ */

describe("AuthService — Password helpers", () => {
  it("hashPassword should return a bcrypt hash", async () => {
    const hash = await service.hashPassword("Secret123!");
    expect(hash).toBeDefined();
    expect(hash).not.toBe("Secret123!");
    expect(hash.startsWith("$2")).toBe(true);
  });

  it("comparePassword should return true for matching pair", async () => {
    const hash = await service.hashPassword("MyPass99");
    const match = await service.comparePassword("MyPass99", hash);
    expect(match).toBe(true);
  });

  it("comparePassword should return false for wrong password", async () => {
    const hash = await service.hashPassword("CorrectPass");
    const match = await service.comparePassword("WrongPass", hash);
    expect(match).toBe(false);
  });

  it("should handle super-long strings without crashing", async () => {
    const longStr = "A".repeat(72);
    const hash = await service.hashPassword(longStr);
    const match = await service.comparePassword(longStr, hash);
    expect(match).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  Token sign / verify round trip                                     */
/* ------------------------------------------------------------------ */

describe("AuthService — Token signing", () => {
  it("signAccessToken should call jwtAccess.sign with correct payload", () => {
    const user = { id: "u1", role: UserRole.ADMIN, email: "a@b.com" };
    const token = service.signAccessToken(user);

    expect(mockJwtAccess.sign).toHaveBeenCalledWith({
      sub: "u1",
      role: UserRole.ADMIN,
      email: "a@b.com",
    });
    expect(token).toBe("mock-access-token");
  });

  it("signRefreshToken should return a token and a UUID jti", () => {
    const { token, jti } = service.signRefreshToken({ id: "u1" });

    expect(token).toBeDefined();
    expect(jti).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it("hashJti should produce a bcrypt hash of the jti", async () => {
    const jti = "550e8400-e29b-41d4-a716-446655440000";
    const hash = await service.hashJti(jti);

    expect(hash.startsWith("$2")).toBe(true);
    const match = await bcrypt.compare(jti, hash);
    expect(match).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  verifyAndRotateRefresh                                             */
/* ------------------------------------------------------------------ */

describe("AuthService — verifyAndRotateRefresh", () => {
  const userId = "user-123";
  const jti = "old-jti-value";

  it("success path — rotates tokens", async () => {
    const jtiHash = await bcrypt.hash(jti, 10);

    (service as any).jwtRefresh = {
      verifyAsync: vi.fn().mockResolvedValue({ sub: userId, jti }),
      sign: vi.fn().mockReturnValue("new-refresh-token"),
    };

    mockUsersRepo.findOne.mockResolvedValue({
      id: userId,
      role: UserRole.VIEWER,
      email: "test@test.com",
      isActive: true,
      refreshTokenHash: jtiHash,
    });

    mockUsersRepo.update.mockResolvedValue({});

    const result = await service.verifyAndRotateRefresh("old-raw-token");

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBe("new-refresh-token");
    expect(mockUsersRepo.update).toHaveBeenCalled();
  });

  it("reuse detection — revokes session on jti mismatch", async () => {
    (service as any).jwtRefresh = {
      verifyAsync: vi.fn().mockResolvedValue({ sub: userId, jti: "wrong-jti" }),
      sign: vi.fn(),
    };

    mockUsersRepo.findOne.mockResolvedValue({
      id: userId,
      role: UserRole.VIEWER,
      email: "test@test.com",
      isActive: true,
      refreshTokenHash: await bcrypt.hash("correct-jti", 10),
    });

    await expect(service.verifyAndRotateRefresh("stolen-token")).rejects.toThrow(
      UnauthorizedException,
    );

    expect(mockUsersRepo.update).toHaveBeenCalledWith(userId, {
      refreshTokenHash: null,
    });
  });

  it("missing user — throws UnauthorizedException", async () => {
    (service as any).jwtRefresh = {
      verifyAsync: vi.fn().mockResolvedValue({ sub: "ghost", jti: "x" }),
      sign: vi.fn(),
    };

    mockUsersRepo.findOne.mockResolvedValue(null);

    await expect(service.verifyAndRotateRefresh("bad-token")).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("inactive user — throws UnauthorizedException", async () => {
    (service as any).jwtRefresh = {
      verifyAsync: vi.fn().mockResolvedValue({ sub: userId, jti }),
      sign: vi.fn(),
    };

    mockUsersRepo.findOne.mockResolvedValue({
      id: userId,
      role: UserRole.VIEWER,
      email: "inactive@test.com",
      isActive: false,
      refreshTokenHash: "some-hash",
    });

    await expect(service.verifyAndRotateRefresh("inactive-token")).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("expired / invalid JWT — throws UnauthorizedException", async () => {
    (service as any).jwtRefresh = {
      verifyAsync: vi.fn().mockRejectedValue(new Error("jwt expired")),
      sign: vi.fn(),
    };

    await expect(service.verifyAndRotateRefresh("expired-token")).rejects.toThrow(
      UnauthorizedException,
    );
  });
});

/* ------------------------------------------------------------------ */
/*  Security — malicious inputs                                        */
/* ------------------------------------------------------------------ */

describe("AuthService — Security", () => {
  it("should reject $ne injection object in password compare", async () => {
    const hash = await service.hashPassword("RealPassword");
    const malicious = { $ne: "" } as any;

    await expect(service.comparePassword(malicious, hash)).rejects.toThrow();
  });

  it("should handle null/undefined gracefully", async () => {
    await expect(service.comparePassword(null as any, "hash")).rejects.toThrow();
  });
});
