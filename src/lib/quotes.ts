// Helpers for the quote widget's master list and rotation.

// Split editor text into one quote per line, preserving what the user typed so
// editing stays natural. Blank lines are cleaned out at display time.
export const textToQuotes = (text: string): string[] => text.split("\n")

export const quotesToText = (quotes: string[]): string => quotes.join("\n")

// The list actually shown: trimmed, with empty lines removed.
export const cleanQuotes = (quotes: string[]): string[] =>
  quotes.map((quote) => quote.trim()).filter((quote) => quote.length > 0)

// Cards are one fixed size, so a quote adapts to the card instead of growing
// it: short lines render as a large pull-quote and longer ones step down to
// calmer sizes. "large" is the base `.quote-text` look. This picks the
// starting tier from the text length; QuoteField then measures the rendered
// text and steps down further whenever the clamp would actually trim it.
export type QuoteSize = "large" | "medium" | "small"

export const QUOTE_SIZES: readonly QuoteSize[] = ["large", "medium", "small"]

export const quoteSize = (quote: string): QuoteSize => {
  if (quote.length <= 80) {
    return "large"
  }

  return quote.length <= 170 ? "medium" : "small"
}

// A whole-day number in local time, so the daily quote is stable across reloads
// on the same calendar day and advances at local midnight.
const localDayNumber = (now: Date): number =>
  Math.floor(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000
  )

// Deterministic index into the list for "daily" rotation.
export const dailyQuoteIndex = (now: Date, length: number): number => {
  if (length <= 0) {
    return 0
  }

  return ((localDayNumber(now) % length) + length) % length
}
