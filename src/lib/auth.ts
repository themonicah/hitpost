import { cookies } from "next/headers";
import db, { User } from "./db";
import { v4 as uuid } from "uuid";

const SESSION_COOKIE = "hitpost_session";

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) return null;

  const user = await db.getUserById(sessionId);
  return user || null;
}

// Create session from email (legacy, for when user adds email later)
export async function createSessionFromEmail(email: string): Promise<User> {
  const cookieStore = await cookies();

  let user = await db.getUserByEmail(email);

  if (!user) {
    const newUser: User = {
      id: uuid(),
      email,
      device_id: null,
      created_at: new Date().toISOString(),
    };
    await db.createUser(newUser);
    user = newUser;
  }

  cookieStore.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });

  return user;
}

// Create session from device ID (primary method - no email required)
export async function createSessionFromDeviceId(deviceId: string): Promise<User> {
  const cookieStore = await cookies();

  const user = await db.getOrCreateUserByDeviceId(deviceId);

  cookieStore.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });

  return user;
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export function requireAuth(user: User | null): asserts user is User {
  if (!user) {
    throw new Error("Unauthorized");
  }
}
