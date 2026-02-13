import { createMiddleware } from "hono/factory";
import { getCookie, setCookie } from "hono/cookie";
import { db, users } from "@forge/db";
import { eq } from "drizzle-orm";
import { generateId } from "../lib/id.js";
import { auth } from "../lib/auth.js";

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

const isDev = process.env.NODE_ENV !== "production";
const DEV_EMAIL = "dev@forge.local";
const DEV_NAME = "Dev User";

export const requireAuth = createMiddleware(async (c, next) => {
  // 1. Try Better Auth session first
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });
    if (session?.user) {
      c.set("userId", session.user.id);
      c.set("user", {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        avatarUrl: session.user.image ?? null,
      });
      return next();
    }
  } catch {
    // Session check failed — fall through
  }

  // 2. In dev mode: check cookie/header fallback
  if (isDev) {
    let userId = getCookie(c, "forge_user_id") || c.req.header("x-user-id");

    if (userId) {
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
    }

    // Dev auth fallback: look up or create dev user
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

    setCookie(c, "forge_user_id", authUser.id, {
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      maxAge: 60 * 60 * 24 * 30,
    });

    c.set("userId", authUser.id);
    c.set("user", authUser);
    return next();
  }

  // 3. Production: no session = unauthorized
  return c.json({ error: "Unauthorized" }, 401);
});
