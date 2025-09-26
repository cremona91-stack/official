// Authentication setup using blueprint:javascript_auth_all_persistance
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { type SelectUser, insertUserSchema } from "@shared/schema";
import { z } from "zod";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupTraditionalAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !user.password || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        // Return user without password field for security
        const { password: _, ...safeUser } = user;
        return done(null, safeUser as SelectUser);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    const user = await storage.getUser(id);
    if (user) {
      const { password: _, ...safeUser } = user;
      done(null, safeUser as SelectUser);
    } else {
      done(null, null);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate input with Zod schema
      const validatedData = insertUserSchema.parse({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
      });

      // Check username uniqueness
      if (validatedData.username) {
        const existingUserByUsername = await storage.getUserByUsername(validatedData.username);
        if (existingUserByUsername) {
          return res.status(400).json({ error: "Username already exists" });
        }
      }

      // Check email uniqueness
      if (validatedData.email) {
        const existingUserByEmail = await storage.getUserByEmail(validatedData.email);
        if (existingUserByEmail) {
          return res.status(400).json({ error: "Email already exists" });
        }
      }

      // Force isAdmin = false for security (prevent privilege escalation)
      const user = await storage.createUser({
        username: validatedData.username || undefined,
        email: validatedData.email || undefined,
        password: validatedData.password ? await hashPassword(validatedData.password) : undefined,
        isAdmin: false, // SECURITY: Force false, never trust client
      });

      // Return user without password field for security
      const { password: _, ...safeUser } = user;

      // Regenerate session ID for security (prevent session fixation)
      req.session.regenerate((regenErr) => {
        if (regenErr) return next(regenErr);
        
        req.login(safeUser, (err) => {
          if (err) return next(err);
          res.status(201).json(safeUser);
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input data", details: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: SelectUser | false, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      
      // Regenerate session ID for security (prevent session fixation)
      req.session.regenerate((regenErr) => {
        if (regenErr) return next(regenErr);
        
        req.login(user, (loginErr) => {
          if (loginErr) return next(loginErr);
          res.status(200).json(user);
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      
      // Destroy session completely for security
      req.session.destroy((destroyErr) => {
        if (destroyErr) return next(destroyErr);
        
        // Clear session cookie
        res.clearCookie("connect.sid");
        res.sendStatus(200);
      });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}

// Export hash utilities for admin user creation
export { hashPassword, comparePasswords };