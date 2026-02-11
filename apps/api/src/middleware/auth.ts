import { createMiddleware } from "hono/factory";
import { getCookie, setCookie } from "hono/cookie";
import { db, users } from "@forge/db";
import { eq } from "drizzle-orm";
import { generateId } from "../lib/id.js";

type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
};

// Extend Hono's context variable types
declare module "hono" {
  interface ContextVariableMap {
    userId: string;
    user: AuthUser;
  }
}

const DEV_EMAIL = "dev@forge.local";
const DEV_NAME = "Dev User";

export const requireAuth = createMiddleware(async (c, next) => {
  // 1. Check cookie first, then header
  let userId = getCookie(c, "forge_user_id") || c.req.header("x-user-id");

  if (userId) {
    // Verify user exists
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user) {
      c.set("userId", user.id);
      c.set("user", user);
      return next();
    }
    // Invalid user ID in cookie — fall through to dev auth
  }

  // 2. Dev auth fallback: look up or create dev user
  const [existingUser] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.email, DEV_EMAIL))
    .limit(1);

  let authUser: AuthUser;
  if (existingUser) {
    authUser = existingUser;
  } else {
    const newId = generateId("user");
    await db.insert(users).values({
      id: newId,
      email: DEV_EMAIL,
      name: DEV_NAME,
    });
    authUser = { id: newId, email: DEV_EMAIL, name: DEV_NAME, avatarUrl: null };
  }

  // Set cookie for subsequent requests
  setCookie(c, "forge_user_id", authUser.id, {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  c.set("userId", authUser.id);
  c.set("user", authUser);
  return next();
});
