# Dayboard — a calm, customizable new tab for Chrome and Edge

[![Chrome Web Store version](https://img.shields.io/chrome-web-store/v/gldaglgodbdhnpjjnoocfnclmdejpaii?label=Chrome%20Web%20Store)](https://chromewebstore.google.com/detail/gldaglgodbdhnpjjnoocfnclmdejpaii)
[![Build status](https://img.shields.io/github/actions/workflow/status/danielchalmers/Dayboard/ci.yml?label=build)](https://github.com/danielchalmers/Dayboard/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/danielchalmers/Dayboard/blob/main/LICENSE)

> A calm new tab board of clocks, countdowns, notes, timers, quotes, and habits.

<img width="1440" height="1000" alt="Dayboard new tab page: a greeting, today's date, and a board of widgets — a clock, a countdown, a sticky note, and a habit tracker." src="https://github.com/user-attachments/assets/5eaebcef-2e4f-447a-9c87-0aef467e0f8c" />

Every new tab is a small moment you get back dozens of times a day. Dayboard turns that moment into something calm and quietly useful: a greeting, today's date, and a board of widgets you choose — a world clock, a countdown to something you're looking forward to, a sticky note, a habit you're building. No feeds, no clutter, no noise. Just the few things worth a glance, cleanly arranged, ready the instant the page opens.

It's a free, open-source new tab extension for Chrome, Microsoft Edge, and other Chromium browsers — a minimal, customizable Chrome extension that favors good defaults over endless settings, works fully offline, and never tracks you.

## Why you'll want it

- **A better start than a blank page.** Instead of a search box or a wall of sponsored tiles, you land on a personal, uncluttered board.
- **Useful at a glance.** The time in another city, days until a deadline, a reminder, today's streak — all visible the moment the tab opens.
- **Yours, mixed freely.** Every widget is optional and editable. Add as many as you like, in any combination, and arrange them by dragging.
- **Quiet on purpose.** Solid colors, gentle motion, and restraint — it stays out of the way instead of shouting for attention.
- **Private by design.** No accounts, no analytics, no tracking — nothing you do leaves your browser.

## Widgets

Seven widget kinds, all optional, all editable, mixed however you like:

- **Clock** — a live clock for any time zone, using your system's 12- or 24-hour format automatically. Add several for a world clock.
- **Countdown** — a live countdown to any date or time in natural language ("5 days, 3 hours from now") — a handy countdown timer for a deadline or an event you're looking forward to. Optionally show it as a progress bar over a span (like your progress through the year), and set it to recur daily, weekly, monthly, or yearly so the target rolls forward on its own.
- **Note** — a sticky note for a reminder, a short list, or a passing thought.
- **Quote** — rotates through quotes you curate, refreshing once a day or on every new tab.
- **Stopwatch** — counts up, with start, pause, and reset.
- **Timer** — counts down from a duration you set, with start, pause, and reset, plus an optional gentle chime when it hits zero (opt-in per timer, never autoplays).
- **Habit** — a habit tracker: mark a daily habit done and build a streak, with history kept per day.

At the top, a time-of-day greeting — *Good morning, afternoon, evening,* or *night* — sits as the hero, optionally personalized with your name, above a friendly date line like *Monday, July 7*.

## Calm by design

- **A grid that arranges itself.** Cards stack into one column on narrow screens and flow into multiple columns on wide ones. There's no column setting to fiddle with — it adapts on its own.
- **Centered and comfortable.** The board centers vertically in the viewport, clear of the address-bar suggestions, and scrolls only once it outgrows the screen.
- **Refined through restraint.** Solid colors, calm decelerating motion, neutral shadows, and hairline separators. No gradients, glows, overshoot, or spin.
- **Matches your system.** Dayboard follows your system theme and accent color, with 12 curated per-widget color presets. New widgets pick a colorful preset automatically.

## Make it yours

- **Drag to rearrange, always on.** The card's padded outer ring is the drag handle, so the text and controls inside stay fully selectable.
- **Reorder from the menu** with *Move back* and *Move next*.
- **Archive what you're not using** behind a quiet *Show archived* toggle — drag a card to the drop zone or use its menu, then restore it the same ways.
- **Add widgets** anytime from the **+** menu.

## Private by default

Privacy isn't a setting here — it's how Dayboard is built:

- No accounts or sign-in.
- No analytics, no ads, no tracking, no remote code.
- No network requests — it works fully offline.
- It requests only the `storage` permission.

Your board is saved with `chrome.storage.sync`, so it follows you across browsers where you're signed in. It is never sent anywhere else.

## How to get it

### From the Chrome Web Store (recommended)

1. Open the [Dayboard listing on the Chrome Web Store](https://chromewebstore.google.com/detail/gldaglgodbdhnpjjnoocfnclmdejpaii).
2. Click **Add to Chrome** (or **Add to Edge** / your browser), then confirm.
3. Open a new tab.

This works on Chrome, Microsoft Edge, Brave, Opera, Vivaldi, Arc, and other Chromium browsers. On Microsoft Edge you install straight from the Chrome Web Store — Edge will prompt you to **Allow extensions from other stores** the first time, which you only need to accept once.

### Build from source (load unpacked)

For developers, or to try the latest before it reaches the store:

```sh
git clone https://github.com/danielchalmers/Dayboard.git
cd Dayboard
npm install
npm run build        # outputs to .output/chrome-mv3
# or, for Microsoft Edge:
npm run build:edge   # outputs to .output/edge-mv3
```

Then load the build:

1. Open `chrome://extensions` (or `edge://extensions`).
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select the `.output/chrome-mv3` folder (or `.output/edge-mv3` for Edge).
5. Open a new tab.

## Settings

Settings are deliberately minimal — an overlay you open from the gear button or your browser's Options link. There are no layout or behavior toggles; Dayboard leans on good defaults instead. What you'll find:

- An optional **greeting name**.
- **Export / import** your whole board as JSON, to back it up or move it between browsers.
- A link to the project on GitHub.

## For developers

Dayboard is built with [WXT](https://wxt.dev), [React](https://react.dev), and [TypeScript](https://www.typescriptlang.org), and ships as a Manifest V3 Chrome extension (minimum Chrome version 116).

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the Chrome development server |
| `npm run dev:edge` | Start the Edge development server |
| `npm run build` | Production build → `.output/chrome-mv3` |
| `npm run build:edge` | Production build → `.output/edge-mv3` |
| `npm test` | Run unit tests with [Vitest](https://vitest.dev) |
| `npm run e2e` | Run end-to-end tests with [Playwright](https://playwright.dev) |
| `npm run verify` | Typecheck, test, and build in one step |

## Contributing

Contributions, bug reports, and ideas are welcome. Please [open an issue](https://github.com/danielchalmers/Dayboard/issues) to report a bug or suggest a feature, and see the [Dayboard repository](https://github.com/danielchalmers/Dayboard) for the source. Run `npm run verify` before opening a pull request.

## License

Dayboard is released under the [MIT License](https://github.com/danielchalmers/Dayboard/blob/main/LICENSE). © 2026 Daniel Chalmers.
