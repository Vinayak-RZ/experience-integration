import type { FastifyInstance } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import type { Auth } from "./index.js";

/**
 * Mount Better Auth under /api/auth/* for the product BFF.
 * Public customer /v1 auth is out of scope (DEC-010).
 */
export async function registerAuthRoutes(
  app: FastifyInstance,
  auth: Auth,
): Promise<void> {
  app.route({
    method: ["GET", "POST"],
    url: "/api/auth/*",
    async handler(request, reply) {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const headers = fromNodeHeaders(request.headers);
      let body: string | undefined;
      if (request.method !== "GET" && request.method !== "HEAD") {
        body =
          typeof request.body === "string"
            ? request.body
            : JSON.stringify(request.body ?? {});
      }
      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        body,
      });
      const response = await auth.handler(req);
      reply.status(response.status);
      response.headers.forEach((value, key) => {
        reply.header(key, value);
      });
      const text = await response.text();
      return reply.send(text === "" ? null : text);
    },
  });

  app.get("/api/me", async (request, reply) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) {
      return reply.status(401).send({
        type: "https://httpstatuses.com/401",
        title: "Unauthorized",
        status: 401,
        detail: "No active session",
        request_id: request.id,
      });
    }
    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        emailVerified: session.user.emailVerified,
      },
      session: {
        id: session.session.id,
        expiresAt: session.session.expiresAt,
      },
    };
  });
}
