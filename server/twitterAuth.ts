// Direct Twitter OAuth 1.0a authentication (NO Replit branding)
import passport from "passport";
import { Strategy as TwitterStrategy } from "passport-twitter";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET || !process.env.TWITTER_CALLBACK_URL) {
  throw new Error("Twitter OAuth credentials missing. Please set TWITTER_API_KEY, TWITTER_API_SECRET, and TWITTER_CALLBACK_URL");
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

export async function setupTwitterAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Twitter OAuth Strategy
  passport.use(
    new TwitterStrategy(
      {
        consumerKey: process.env.TWITTER_API_KEY!,
        consumerSecret: process.env.TWITTER_API_SECRET!,
        callbackURL: process.env.TWITTER_CALLBACK_URL!,
      },
      async (token, tokenSecret, profile, done) => {
        try {
          // Upsert user in database with Twitter profile data
          await storage.upsertUser({
            id: profile.id,
            email: profile.emails?.[0]?.value || null,
            firstName: profile.displayName?.split(" ")[0] || profile.username || null,
            lastName: profile.displayName?.split(" ").slice(1).join(" ") || null,
            profileImageUrl: profile.photos?.[0]?.value || null,
          });

          const user = {
            id: profile.id,
            username: profile.username,
            displayName: profile.displayName,
            photos: profile.photos,
          };

          done(null, user);
        } catch (error) {
          console.error("Twitter auth error:", error);
          done(error as Error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Twitter OAuth routes
  app.get("/auth/twitter", passport.authenticate("twitter"));

  app.get(
    "/auth/twitter/callback",
    passport.authenticate("twitter", {
      failureRedirect: "/",
    }),
    (req, res) => {
      // Successful authentication, redirect to dashboard
      res.redirect("/dashboard");
    }
  );

  app.get("/auth/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });

  app.get("/auth/user", (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
};
