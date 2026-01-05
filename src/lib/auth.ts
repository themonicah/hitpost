import { cookies } from "next/headers";
import db, { User } from "./db";
import { v4 as uuid } from "uuid";

const SESSION_COOKIE = "hitpost_session";

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) return null;

  const user = db.getUserById(sessionId);
  return user || null;
}

export async function createSession(email: string): Promise<User> {
  const cookieStore = await cookies();

  // Check if user exists
  let user = db.getUserByEmail(email);

  if (!user) {
    // Create new user
    user = {
      id: uuid(),
      email,
      created_at: new Date().toISOString(),
    };
    db.createUser(user);
  }

  // Set session cookie
  cookieStore.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
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
