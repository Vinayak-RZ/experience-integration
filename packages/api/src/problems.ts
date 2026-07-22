import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";

/** RFC 9457 problem+json body. */
export type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  request_id?: string;
};

export function toProblem(
  err: FastifyError,
  request: FastifyRequest,
): ProblemDetails {
  const status = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
  const title =
    status >= 500
      ? "Internal Server Error"
      : err.message || "Request Error";
  return {
    type: `https://httpstatuses.com/${status}`,
    title,
    status,
    detail: status >= 500 ? "An unexpected error occurred." : err.message,
    instance: request.url,
    request_id: request.id,
  };
}

export async function problemHandler(
  err: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const problem = toProblem(err, request);
  if (problem.status >= 500) {
    request.log.error({ err, request_id: request.id }, "unhandled error");
  } else {
    request.log.warn({ err, request_id: request.id }, "request error");
  }
  await reply
    .status(problem.status)
    .header("content-type", "application/problem+json; charset=utf-8")
    .send(problem);
}
