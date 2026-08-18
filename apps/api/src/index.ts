import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { apiRouter } from "./api/router";
import { redirectRouter } from "./api/routers/redirect";
import type { AppEnv } from "./api/types";
import { env } from "./env";

export const app = new Hono<AppEnv>();

app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: env.CORS_ORIGINS,
    allowHeaders: ["Content-Type", "x-api-key"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.route("/api", apiRouter);
app.route("/", redirectRouter);

app.notFound((c) => c.json({ message: "Not found" }, 404));
app.onError((error: any, c) => {
  if (error?.code === "23505") return c.json({ message: "Slug already exists" }, 409);
  console.error(error);
  return c.json({ message: "Internal server error" }, 500);
});

export default { port: env.PORT, fetch: app.fetch };
