// Stáhne denní kurzovní lístek ČNB a uloží ho jako kurzy.json v rootu repa.
// Spouští se z GitHub Actions (cron), ale funguje i lokálně: node scripts/aktualizuj-kurzy.mjs
import { writeFile } from "node:fs/promises";

const URL_CNB = "https://api.cnb.cz/cnbapi/exrates/daily?lang=CZ";
const VYSTUP = new URL("../kurzy.json", import.meta.url);

const res = await fetch(URL_CNB);
if (!res.ok) throw new Error("ČNB API vrátilo HTTP " + res.status);
const data = await res.json();

if (!Array.isArray(data.rates) || data.rates.length === 0) {
    throw new Error("ČNB API vrátilo neplatná data");
}

const kurzy = {};
for (const r of data.rates) {
    if (!r.currencyCode || !(r.rate > 0)) continue;
    kurzy[r.currencyCode] = { m: r.amount, r: r.rate };
}
if (!kurzy.EUR) throw new Error("V datech ČNB chybí kurz EUR");

const vystup = {
    datum: data.rates[0].validFor,
    stazeno: new Date().toISOString(),
    zdroj: "ČNB",
    kurzy: kurzy
};

await writeFile(VYSTUP, JSON.stringify(vystup), "utf8");
console.log("kurzy.json uloženo, lístek dne " + vystup.datum + " (" + Object.keys(kurzy).length + " měn)");
