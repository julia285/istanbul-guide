import { BugeceAdapter } from "./src/adapters/bugece-adapter.js";

async function main() {
  const adapter = new BugeceAdapter({ listingUrls: ["https://bugece.co/en/browse/istanbul/events"] });
  const urls = await adapter.discoverEventUrls();
  let ok = 0;
  for (const url of urls) {
    const details = await adapter.fetchEventDetails({ url });
    const record = adapter.normalizeEvent(details);
    if (record) {
      ok++;
    } else {
      console.log("FAILED:", url, "hasJson:", !!details.json);
    }
  }
  console.log(`${ok}/${urls.length} succeeded`);
}
main().catch((e) => { console.error(e); process.exit(1); });
