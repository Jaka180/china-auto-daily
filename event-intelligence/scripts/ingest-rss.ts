import { runRssIngestion } from "../ingestion/runRssIngestion";

function readArg(name: string) {
  const idx = process.argv.indexOf(`--${name}`);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

async function main() {
  const summary = await runRssIngestion({
    feed: readArg("feed"),
    priority: readArg("priority") ? Number(readArg("priority")) : undefined,
    sourcesPath: readArg("sources"),
    minPriority: readArg("min-priority") ? Number(readArg("min-priority")) : undefined,
    immediateOnly: process.argv.includes("--immediate"),
    deferredOnly: process.argv.includes("--deferred"),
    limit: Number(readArg("limit") || 20)
  });

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
