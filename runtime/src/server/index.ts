import path from "node:path";
import { fileURLToPath } from "node:url";
import { draftDayModule } from "../modules/draftDay.js";
import { freeAgencyModule } from "../modules/freeAgency.js";
import { fullHouseModule } from "../modules/fullHouse.js";
import { hostTheLeagueModule } from "../modules/hostTheLeague.js";
import { lobbyDemoModule } from "../modules/lobbyDemo.js";
import { sameLineL1Module } from "../modules/sameLine/l1.js";
import { tradeDeadlineModule } from "../modules/tradeDeadline.js";
import { writeTheRuleModule } from "../modules/writeTheRule.js";
import { createHttpServer } from "./http.js";
import { SessionBus } from "./sessionBus.js";
import { SnapshotRepository } from "./snapshotRepository.js";
import { SessionService } from "./sessionService.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = process.env["RUNTIME_SNAPSHOT_FILE"] ?? path.join(here, "..", "..", "data", "snapshot.json");
const PORT = Number(process.env["PORT"] ?? 4300);

async function main(): Promise<void> {
  // Push in front of polling, never instead of it — see http.ts.
  const bus = new SessionBus();
  const repo = new SnapshotRepository(DATA_FILE, { bus });
  await repo.whenReady();

  const service = new SessionService(repo);
  service.registerModule(lobbyDemoModule);
  service.registerModule(draftDayModule);
  service.registerModule(tradeDeadlineModule);
  service.registerModule(freeAgencyModule);
  service.registerModule(fullHouseModule);
  service.registerModule(hostTheLeagueModule);
  service.registerModule(writeTheRuleModule);
  service.registerModule(sameLineL1Module);
  // Additional lesson modules register here as the gameplay team ships them.

  const server = createHttpServer(service, bus);
  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`BOW Economics runtime listening on http://localhost:${PORT}`);
    // eslint-disable-next-line no-console
    console.log(`  teacher console  http://localhost:${PORT}/teach`);
    // eslint-disable-next-line no-console
    console.log(`  student join     http://localhost:${PORT}/play`);
    // eslint-disable-next-line no-console
    console.log(`  projector        http://localhost:${PORT}/board`);
    // eslint-disable-next-line no-console
    console.log(`  snapshot file    ${DATA_FILE}`);
  });

  const shutdown = async () => {
    server.close();
    await repo.flushToDisk();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error("failed to start runtime:", error);
  process.exit(1);
});
