import { readFileSync } from "node:fs";
import { BugeceAdapter } from "./src/adapters/bugece-adapter.js";

const html = readFileSync("./src/adapters/__fixtures__/bugece/event-soundscape-festival.html", "utf8");

const adapter = new BugeceAdapter({ listingUrls: [] });
// @ts-expect-error accessing protected for debug
const json = adapter.extractJsonLd(html);
console.log("extracted json-ld present:", !!json);
if (json) console.log("name:", json.name, "startDate:", json.startDate, "offers:", JSON.stringify(json.offers).slice(0,200));

const record = adapter.normalizeEvent({ url: "https://bugece.co/en/events/soundscape-festival-istanbul-2026-07-25-26--f20fb9ef", html, json: json ?? undefined });
console.log("normalizeEvent result:", record);
