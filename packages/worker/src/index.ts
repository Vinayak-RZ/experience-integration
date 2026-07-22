import { loadWorkerEnv } from "./config.js";
import { startWorker, stopWorker } from "./boss.js";

const env = loadWorkerEnv();
const boss = await startWorker(env);
console.log(JSON.stringify({ msg: "l6-worker started", queues: ["l6.fixture.ping", "l6.reports.generate"] }));

async function shutdown(signal: string) {
  console.log(JSON.stringify({ msg: "l6-worker shutting down", signal }));
  await stopWorker(boss);
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
