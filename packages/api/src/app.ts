import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import { registerAdminRoutes } from "./admin/routes.js";
import type { Auth } from "./auth/index.js";
import { registerAuthRoutes } from "./auth/routes.js";
import { type Env, loadEnv } from "./config.js";
import type { Db } from "./db/client.js";
import type { Mailer } from "./mail/mailer.js";
import { registerPlantRoutes } from "./plants/routes.js";
import { problemHandler } from "./problems.js";

export type AppDeps = {
  env?: Env;
  checkReady?: () => Promise<boolean> | boolean;
  auth?: Auth;
  mailer?: Mailer;
  db?: Db;
};

export async function buildApp(
  opts: AppDeps = {},
): Promise<FastifyInstance> {
  const env = opts.env ?? loadEnv();
  const logger: FastifyServerOptions["logger"] =
    env.NODE_ENV === "test"
      ? false
      : {
          level: env.LOG_LEVEL,
          base: { service: "l6-api" },
          redact: [
            "req.headers.authorization",
            "req.headers.cookie",
            "password",
            "newPassword",
            "token",
          ],
        };

  const app = Fastify({
    logger,
    requestIdHeader: "x-request-id",
    genReqId: (req) => {
      const header = req.headers["x-request-id"];
      if (typeof header === "string" && header.length > 0) return header;
      return crypto.randomUUID();
    },
  });

  await app.register(sensible);
  await app.register(cors, {
    origin: env.WEB_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-Request-Id",
    ],
  });

  await app.register(rateLimit, {
    global: true,
    max: env.NODE_ENV === "test" ? 10_000 : 300,
    timeWindow: "1 minute",
    ban: 0,
  });

  app.setErrorHandler(problemHandler);
  app.setNotFoundHandler(async (request, reply) => {
    await reply
      .status(404)
      .header("content-type", "application/problem+json; charset=utf-8")
      .send({
        type: "https://httpstatuses.com/404",
        title: "Not Found",
        status: 404,
        detail: `Route ${request.method} ${request.url} not found`,
        instance: request.url,
        request_id: request.id,
      });
  });

  app.addHook("onSend", async (request, reply, payload) => {
    reply.header("x-request-id", request.id);
    return payload;
  });

  app.get("/health", async () => ({
    status: "ok",
    service: "l6-api",
  }));

  app.get("/ready", async (_request, reply) => {
    if (env.REQUIRE_DATABASE && opts.checkReady) {
      const ready = await opts.checkReady();
      if (!ready) {
        return reply.status(503).send({
          type: "https://httpstatuses.com/503",
          title: "Service Unavailable",
          status: 503,
          detail: "Database is not ready",
          request_id: _request.id,
        });
      }
    }
    return { status: "ready", service: "l6-api" };
  });

  app.get("/api/meta", async () => ({
    name: "stamped-l6-bff",
    surface: "product",
    public_api: false,
    auth: Boolean(opts.auth),
  }));

  if (opts.auth && opts.mailer) {
    await registerAuthRoutes(app, opts.auth, opts.mailer, env);
  }
  if (opts.auth && opts.db) {
    await registerAdminRoutes(app, opts.auth, opts.db);
    await registerPlantRoutes(app, opts.auth, opts.db);
  }

  return app;
}

export async function startServer(
  opts: AppDeps = {},
): Promise<FastifyInstance> {
  const env = opts.env ?? loadEnv();
  const app = await buildApp({ ...opts, env });
  await app.listen({ host: env.HOST, port: env.PORT });
  return app;
}
