import { BugeceAdapter } from "./src/adapters/bugece-adapter.js";

async function main() {
  const adapter = new BugeceAdapter({ listingUrls: ["https://bugece.co/en/browse/istanbul/events"] });

  const health = await adapter.healthCheck();
  console.log("healthCheck:", health);

  const urls = await adapter.discoverEventUrls();
  console.log(`discoverEventUrls: ${urls.length} URLs found`);

  const records = await adapter.collect();
  console.log(`collect(): ${records.length} normalized records`);
  console.log(JSON.stringify(records.slice(0, 3), null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
