// Stáhne denní kurzovní lístek ČNB a uloží ho jako kurzy.json v rootu repa.
// Spouští se z GitHub Actions (cron), ale funguje i lokálně: node scripts/aktualizuj-kurzy.mjs
import { writeFile } from "node:fs/promises";

const URL_CNB = "https://api.cnb.cz/cnbapi/exrates/daily?lang=CZ";
// Měny, které ČNB v lístku neuvádí – doplní se z tržních kurzů open.er-api
const DOPLNKOVE_MENY = ["EGP", "TND"];
const URL_ERAPI = "https://open.er-api.com/v6/latest/CZK";
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

// Doplnění měn chybějících v ČNB lístku (tržní kurzy, přepočteno na CZK)
try {
    const resEr = await fetch(URL_ERAPI);
    if (resEr.ok) {
        const dataEr = await resEr.json();
        for (const kod of DOPLNKOVE_MENY) {
            const hodnota = dataEr?.rates?.[kod];
            if (hodnota > 0) kurzy[kod] = { m: 1, r: 1 / hodnota };
        }
    } else {
        console.warn("er-api vrátilo HTTP " + resEr.status + ", doplňkové měny se přeskočí");
    }
} catch (e) {
    console.warn("er-api selhalo, doplňkové měny se přeskočí: " + e.message);
}

const vystup = {
    datum: data.rates[0].validFor,
    stazeno: new Date().toISOString(),
    zdroj: kurzy.EGP || kurzy.TND ? "ČNB + er-api" : "ČNB",
    kurzy: kurzy
};

await writeFile(VYSTUP, JSON.stringify(vystup), "utf8");
console.log("kurzy.json uloženo, lístek dne " + vystup.datum + " (" + Object.keys(kurzy).length + " měn)");
