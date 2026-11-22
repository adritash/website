import type { Db } from "@/pulse/infrastructure/db";
import type { ExchangeCode, InstrumentRef } from "./market-data.types";

export type InstrumentRecord = InstrumentRef & { aliases: string[] };

export type Resolution =
  | { status: "resolved"; instrument: InstrumentRef }
  | { status: "ambiguous"; options: InstrumentRef[] }
  | { status: "not_found"; suggestions: InstrumentRef[] };

const NOISE = /\b(ltd|limited|share|shares|stock|stocks|price|prices|the|of|india|co|company|corp|corporation|inc|nse|bse)\b/g;

/** Lower-case, strip punctuation and filler words: "Infosys Ltd." → "infosys". */
export function normalizeQuery(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(NOISE, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

function ref(i: InstrumentRecord): InstrumentRef {
  return { symbol: i.symbol, exchange: i.exchange, companyName: i.companyName };
}

/**
 * Resolves what a user typed to a listed instrument. Exact symbol or alias wins;
 * otherwise company-name and fuzzy matches. More than one plausible company is
 * returned as ambiguous so the user is asked, never silently guessed.
 * When the user did not name an exchange, NSE is preferred and the reply states it.
 */
export function resolveFromList(
  query: string,
  instruments: InstrumentRecord[],
  exchange?: ExchangeCode
): Resolution {
  const q = normalizeQuery(query);
  if (!q) return { status: "not_found", suggestions: [] };
  const qSymbol = q.replace(/\s+/g, "").toUpperCase();
  const pool = instruments.filter((i) => !exchange || i.exchange === exchange);

  const pickExchange = (matches: InstrumentRecord[]): Resolution => {
    const companies = new Map<string, InstrumentRecord[]>();
    for (const m of matches) {
      const key = m.companyName.toLowerCase();
      companies.set(key, [...(companies.get(key) ?? []), m]);
    }
    if (companies.size === 1) {
      const listings = [...companies.values()][0];
      const preferred = listings.find((l) => l.exchange === "NSE") ?? listings[0];
      return { status: "resolved", instrument: ref(preferred) };
    }
    const options = [...companies.values()].map((l) => ref(l.find((x) => x.exchange === "NSE") ?? l[0]));
    return { status: "ambiguous", options: options.slice(0, 5) };
  };

  const exactSymbol = pool.filter((i) => i.symbol.replace(/[^A-Z0-9]/g, "") === qSymbol.replace(/[^A-Z0-9]/g, ""));
  if (exactSymbol.length) return pickExchange(exactSymbol);

  const exactAlias = pool.filter((i) => i.aliases.includes(q) || normalizeQuery(i.companyName) === q);
  if (exactAlias.length) return pickExchange(exactAlias);

  const words = q.split(" ").filter((w) => w.length >= 3);
  const partial = pool.filter((i) => {
    const name = normalizeQuery(i.companyName);
    return name.startsWith(q) || i.aliases.some((a) => a.startsWith(q)) || (words.length > 0 && words.every((w) => name.includes(w)));
  });
  if (partial.length) return pickExchange(partial);

  // Typos: "infosis", "reliace". Only accept close matches.
  const scored = pool
    .map((i) => {
      const candidates = [i.symbol.toLowerCase(), normalizeQuery(i.companyName), ...i.aliases];
      const best = Math.min(...candidates.map((c) => levenshtein(q, c)));
      return { i, best };
    })
    .filter((s) => s.best <= Math.max(1, Math.floor(q.length / 4)))
    .sort((a, b) => a.best - b.best);
  if (scored.length) {
    const top = scored.filter((s) => s.best === scored[0].best).map((s) => s.i);
    const res = pickExchange(top);
    // A fuzzy match is never auto-selected: confirm with the user.
    if (res.status === "resolved") return { status: "ambiguous", options: [res.instrument] };
    return res;
  }
  return { status: "not_found", suggestions: [] };
}

let cache: { list: InstrumentRecord[]; at: number } | null = null;

export async function loadInstruments(db: Db): Promise<InstrumentRecord[]> {
  if (cache && Date.now() - cache.at < 10 * 60 * 1000) return cache.list;
  const rows = await db.instrument.findMany({ where: { active: true } });
  const list = rows.map((r) => ({ symbol: r.symbol, exchange: r.exchange, companyName: r.companyName, aliases: r.aliases }));
  cache = { list, at: Date.now() };
  return list;
}

export function clearInstrumentCache() {
  cache = null;
}

export async function resolveInstrument(db: Db, query: string, exchange?: ExchangeCode): Promise<Resolution> {
  return resolveFromList(query, await loadInstruments(db), exchange);
}
