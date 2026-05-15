import { fetcher, setAccessToken } from "./client";
import type { AuthResponse, LoginDto, RegisterDto, User, UserPreferences } from "./types";

export async function login(dto: LoginDto): Promise<AuthResponse> {
  const data = await fetcher<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(dto),
  });
  setAccessToken(data.accessToken);
  return data;
}

export async function register(dto: RegisterDto): Promise<AuthResponse> {
  const data = await fetcher<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(dto),
  });
  setAccessToken(data.accessToken);
  return data;
}

export async function refresh(): Promise<AuthResponse> {
  const data = await fetcher<AuthResponse>("/auth/refresh", {
    method: "POST",
  });
  setAccessToken(data.accessToken);
  return data;
}

export async function logout(): Promise<void> {
  await fetcher("/auth/logout", { method: "POST" });
  setAccessToken(null);
}

export function getMe(): Promise<User> {
  return fetcher<User>("/auth/me");
}

export function updateMe(
  dto: Partial<Pick<User, "name" | "phone"> & { preferences: UserPreferences }>,
): Promise<User> {
  return fetcher<User>("/auth/me", {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
}

export function changePassword(dto: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  return fetcher("/auth/me/password", {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
}

export function deleteAccount(): Promise<void> {
  return fetcher("/auth/me", { method: "DELETE" });
}
