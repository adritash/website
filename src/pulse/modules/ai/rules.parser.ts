import type { Intent } from "./intent.schema";

/**
 * Deterministic interpreter for the common phrasings. It runs before any AI call,
 * so most messages cost nothing and behave predictably. Returns UNKNOWN when it is
 * not sure; the caller may then try the AI interpreter.
 */

const clean = (s: string) =>
  s
    .replace(/[’']/g, "'")
    .replace(/[?!.]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** Parses "₹4,000", "rs. 1,400.50", "4k", "1400". */
export function parsePrice(text: string): number | undefined {
  const m = text.match(/(?:₹|rs\.?|inr)?\s*(\d{1,3}(?:,\d{2,3})+(?:\.\d+)?|\d+(?:\.\d+)?)\s*(k)?\b/i);
  if (!m) return undefined;
  const n = Number(m[1].replace(/,/g, "")) * (m[2] ? 1000 : 1);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** "every hour" → 60, "every 30 minutes" → 30, "hourly" → 60, "every half hour" → 30. */
export function parseFrequency(text: string): number | undefined {
  const t = text.toLowerCase();
  if (/\b(hourly|every hour|each hour|once an hour|every 1 ?(hour|hr))\b/.test(t)) return 60;
  if (/\bevery half[- ]?(an )?hour\b/.test(t)) return 30;
  const m = t.match(/\bevery (\d{1,4}) ?(minutes?|mins?|m|hours?|hrs?|h)\b/);
  if (m) {
    const n = Number(m[1]);
    return /^h/.test(m[2]) ? n * 60 : n;
  }
  return undefined;
}

function exchangeOf(text: string): "NSE" | "BSE" | undefined {
  if (/\bbse\b/i.test(text)) return "BSE";
  if (/\bnse\b/i.test(text)) return "NSE";
  return undefined;
}

/** Strips filler around a stock name: "the price of Tata Consultancy" → "Tata Consultancy". */
function stockFrom(fragment: string | undefined): string | undefined {
  if (!fragment) return undefined;
  const s = fragment
    .replace(/\b(on|at|in) (nse|bse)\b/gi, " ")
    .replace(/\b(nse|bse)\b/gi, " ")
    .replace(/\b(the|current|latest|live|today'?s?|share|shares|stock|stocks|price|prices|of|for|about|me|my|please|pls|now|right now|today)\b/gi, " ")
    .replace(/[₹"“”]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!s || s.length > 60) return undefined;
  if (/^(it|this|that|them|all|everything|my watchlist|watchlist)$/i.test(s)) return undefined;
  return s;
}

const base = (intent: Intent["intent"], confidence: number, extra: Partial<Intent> = {}): Intent => ({ intent, confidence, ...extra });

export function parseWithRules(input: string): Intent {
  const text = clean(input);
  const t = text.toLowerCase();
  const exchange = exchangeOf(text);
  if (!t) return base("UNKNOWN", 0);

  // Keywords (exact).
  if (/^(stop|unsubscribe|stop all messages)$/.test(t)) return base("OPT_OUT", 1);
  if (/^(start|resume messages|subscribe)$/.test(t)) return base("OPT_IN", 1);
  if (/^(agree|i agree|accept|yes,? i agree)$/.test(t)) return base("AGREE", 1);
  if (/^(help|menu|options|commands|\?)$/.test(t)) return base("HELP", 1);
  if (/^(hi|hello|hey|namaste|good (morning|afternoon|evening))\b/.test(t) && t.split(" ").length <= 3) return base("GREETING", 1);
  if (/\b(delete|erase|remove) (all )?my (data|account)\b/.test(t)) return base("DELETE_DATA", 1);
  if (/\b(dashboard|web link|login link|log ?in)\b/.test(t)) return base("DASHBOARD_LINK", 0.95);
  if (/\b(upgrade|subscribe to plus|buy plus|pulse plus)\b/.test(t)) return base("UPGRADE", 0.95);
  if (/\b(my plan|subscription|which plan|plan status|my usage)\b/.test(t)) return base("SUBSCRIPTION_STATUS", 0.95);

  // Lists.
  if (/\b(show|list|what are|see|view)\b.*\b(alerts?|updates|notifications)\b/.test(t) || /^(my )?(active )?alerts$/.test(t)) {
    return base("LIST_ALERTS", 0.95);
  }
  if (/\b(how much|how have|how did|performance|changed|moved)\b.*\b(my )?(tracked|watchlist|watch list|portfolio|stocks)\b/.test(t) && /\b(my|tracked|watchlist)\b/.test(t)) {
    return base("WATCHLIST_PERFORMANCE", 0.9);
  }
  if (/\b(show|list|what'?s in|see|view)\b.*\b(watch ?list|tracked stocks|my stocks)\b/.test(t) || /^(my )?watch ?list$/.test(t)) {
    return base("LIST_WATCHLIST", 0.95);
  }

  // Pause / resume.
  let m = t.match(/^(pause|hold|mute)\s+(?:all\s+)?(?:my\s+)?(.*?)\s*(alerts?|updates|notifications)?$/);
  if (m) {
    const stock = stockFrom(m[2].replace(/\b(alerts?|updates)\b/g, ""));
    return base("PAUSE_ALERTS", 0.9, stock ? { stock_query: stock, scope: "stock" } : { scope: "all" });
  }
  m = t.match(/^(resume|unpause|restart)\s+(?:all\s+)?(?:my\s+)?(.*?)\s*(alerts?|updates|notifications)?$/);
  if (m) {
    const stock = stockFrom(m[2].replace(/\b(alerts?|updates)\b/g, ""));
    return base("RESUME_ALERTS", 0.9, stock ? { stock_query: stock, scope: "stock" } : { scope: "all" });
  }

  // Cancel.
  if (/^(stop|cancel|end|delete|remove)\b.*\b(all|every)\b.*\b(alerts?|updates|notifications|messages)\b/.test(t)) {
    return base("CANCEL_ALERT", 0.95, { scope: "all" });
  }
  m = text.match(/^(?:stop|cancel|end|delete|remove|no more)\s+(?:sending\s+(?:me\s+)?)?(?:the\s+|my\s+)?(?:alerts?|updates|notifications|messages)?\s*(?:about|for|on|of)?\s*(.+?)\s*(?:alerts?|updates|notifications|messages)?$/i);
  if (m && !/\bwatch ?list\b/.test(t)) {
    const stock = stockFrom(m[1]);
    if (stock) return base("CANCEL_ALERT", 0.9, { stock_query: stock, scope: "stock", exchange });
  }

  // Watchlist add/remove.
  m = text.match(/^(?:please\s+)?(?:remove|delete|drop|untrack|stop tracking)\s+(.+?)\s+(?:from|off)\s+(?:my\s+)?watch ?list$/i)
    ?? text.match(/^(?:please\s+)?(?:untrack|stop tracking)\s+(.+)$/i);
  if (m) {
    const stock = stockFrom(m[1]);
    if (stock) return base("REMOVE_WATCHLIST", 0.95, { stock_query: stock, exchange });
  }
  m = text.match(/^(?:please\s+)?(?:add|put|save)\s+(.+?)\s+(?:to|in|on|into)\s+(?:my\s+)?watch ?list$/i)
    ?? text.match(/^(?:please\s+)?(?:track|follow|watch)\s+(.+)$/i);
  if (m && !/\bevery\b|\balert\b|\bupdates?\b/i.test(text)) {
    const stock = stockFrom(m[1]);
    if (stock) return base("ADD_WATCHLIST", 0.95, { stock_query: stock, exchange });
  }

  // Update frequency.
  m = text.match(/\b(?:change|set|update|make)\b\s+(?:my\s+)?(.+?)\s+(?:update|alert)s?\s*(?:frequency|interval)?\s+to\s+(.+)$/i);
  if (m) {
    const freq = parseFrequency(`every ${m[2]}`) ?? parseFrequency(m[2]);
    const stock = stockFrom(m[1]);
    if (freq) return base("UPDATE_ALERT", 0.9, { stock_query: stock, frequency_minutes: freq, exchange });
  }

  // Threshold alerts.
  m = text.match(/\b(?:alert|notify|tell|message|ping|let)\b.*?\bif\s+(.+?)\s+(?:goes|go|rises|rise|crosses|cross|is|trades|moves|climbs|jumps|hits|reaches|gets)\s+(above|over|beyond|past|higher than|more than)\s+(.+)$/i)
    ?? text.match(/\b(?:alert|notify|tell|message|ping|let)\b.*?\bif\s+(.+?)\s+(?:goes|go|falls|fall|drops|drop|dips|dip|is|trades|moves|slips|gets)\s+(below|under|beneath|lower than|less than)\s+(.+)$/i);
  if (m) {
    const threshold = parsePrice(m[3]);
    const stock = stockFrom(m[1]);
    const direction = /above|over|beyond|past|higher|more/i.test(m[2]) ? "above" : "below";
    if (threshold && stock) return base("CREATE_PRICE_ALERT", 0.95, { stock_query: stock, threshold, direction, exchange });
  }
  m = text.match(/\b(?:alert|notify|tell)\b.*?\bif\s+(.+?)\s+(?:moves|changes|swings|falls|rises|drops)\s+(?:by\s+)?(?:more than\s+)?(\d+(?:\.\d+)?)\s*%/i);
  if (m) {
    const stock = stockFrom(m[1]);
    if (stock) return base("CREATE_PRICE_ALERT", 0.9, { stock_query: stock, percent: Number(m[2]), exchange });
  }

  // Daily summary.
  if (/\b(daily|every day|each day|end of day|eod)\b.*\b(clos(e|ing)|summary|prices?|update)\b/.test(t) || /\b(closing prices?|daily summary|closing summary)\b/.test(t)) {
    if (/\b(send|give|update|message|i want|get|share)\b/.test(t)) {
      const fm = text.match(/\b(?:closing price|closing prices|summary|close)\s+(?:of|for)\s+(.+)$/i);
      const stock = fm ? stockFrom(fm[1].replace(/\ball (of )?my watch ?list stocks\b|\bmy watch ?list\b|\ball my stocks\b/gi, "")) : undefined;
      return base("CREATE_DAILY_SUMMARY", 0.9, stock ? { stock_query: stock, exchange } : {});
    }
  }

  // Recurring updates.
  const frequency = parseFrequency(t);
  if (frequency && /\b(send|update|message|notify|ping|give|tell|share)\b/.test(t)) {
    m = text.match(/\b(?:send|give|share)\s+(?:me\s+)?(.+?)\s+(?:price\s+)?(?:updates?|prices?|alerts?|quotes?)\b/i)
      ?? text.match(/\b(?:updates?|prices?|alerts?)\s+(?:on|for|about|of)\s+(.+?)\s+every\b/i)
      ?? text.match(/\b(?:update|notify|message|ping|tell)\s+me\s+(?:about|on)\s+(.+?)\s+every\b/i);
    const stock = m ? stockFrom(m[1]) : undefined;
    return base("CREATE_RECURRING_ALERT", 0.9, { stock_query: stock, frequency_minutes: frequency, exchange });
  }

  // Previous close.
  if (/\b(clos(e|ed|ing)( price)?|yesterday)\b/.test(t) && /\b(what|how much|show|tell|was)\b/.test(t)) {
    const fm = text.match(/\b(?:of|for)\s+(.+?)(?:\s+yesterday)?$/i) ?? text.match(/^(?:what was\s+)?(.+?)'?s?\s+clos/i);
    const stock = fm ? stockFrom(fm[1].replace(/\b(closing|close|yesterday|what was|price)\b/gi, "")) : undefined;
    return base("PREVIOUS_CLOSE", 0.9, stock ? { stock_query: stock, exchange } : {});
  }

  // Performance today.
  m = text.match(/\bhow (?:much )?(?:has|did|is)\s+(.+?)\s+(?:moved|move|changed|change|done|doing|performed|perform)\b/i);
  if (m) {
    const stock = stockFrom(m[1]);
    if (stock) return base("STOCK_PERFORMANCE", 0.95, { stock_query: stock, exchange });
  }

  // Price queries.
  m = text.match(/\b(?:price|quote|rate|value|cmp|ltp)\s+(?:of|for)\s+(.+)$/i)
    ?? text.match(/^(?:what(?:'s| is)|whats)\s+(.+?)\s+(?:trading at|at|price|share price|stock price|quoting at)$/i)
    ?? text.match(/^(?:what(?:'s| is)|whats)\s+(?:the\s+)?(?:current\s+|latest\s+|live\s+)?(?:share\s+|stock\s+)?price\s+(?:of\s+)?(.+)$/i)
    ?? text.match(/^(?:check|show|get|quote|lookup|look up)\s+(.+)$/i)
    ?? text.match(/^(.+?)\s+(?:price|share price|stock price|quote|ltp|cmp|rate)$/i)
    ?? text.match(/^how much is\s+(.+?)(?:\s+trading at)?$/i);
  if (m) {
    const stock = stockFrom(m[1]);
    if (stock) return base("STOCK_PRICE", 0.95, { stock_query: stock, exchange });
  }

  // A bare ticker or short name ("TCS", "infosys") is most likely a price query.
  if (/^[a-z0-9&.\- ]{2,30}$/i.test(text) && text.split(" ").length <= 3) {
    return base("STOCK_PRICE", 0.65, { stock_query: text, exchange });
  }

  return base("UNKNOWN", 0);
}
