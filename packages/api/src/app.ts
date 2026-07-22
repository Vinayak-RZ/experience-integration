import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from "fastify";
import sensible from "@fastify/sensible";
import { type Env, loadEnv } from "./config.js";
import { problemHandler } from "./problems.js";

export type AppDeps = {
  env?: Env;
  /** Optional readiness probe — returns true when dependencies are healthy. */
  checkReady?: () => Promise<boolean> | boolean;
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
          redact: ["req.headers.authorization", "req.headers.cookie"],
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

  // Product BFF routes land in later phases. Public /v1 is Phase H — deferred
  // while Auto prioritizes Forge UX and operational surfaces.
  app.get("/api/meta", async () => ({
    name: "stamped-l6-bff",
    surface: "product",
    public_api: false,
  }));

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
