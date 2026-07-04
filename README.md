# CSV Viewer

**Free, privacy-first online CSV viewer — open and explore CSV files instantly in your browser.**

### 🌐 [csvviewer.net](https://csvviewer.net)

[![Live Demo](https://img.shields.io/badge/Live-csvviewer.net-2563eb?style=for-the-badge&logo=googlechrome&logoColor=white)](https://csvviewer.net)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Cloudflare](https://img.shields.io/badge/Deployed%20on-Cloudflare-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://csvviewer.net)

---

## What is CSV Viewer?

[CSV Viewer](https://csvviewer.net) is a lightweight, browser-based tool for opening, browsing, and inspecting CSV files — no install, no account, no upload to a server.

Drop a `.csv` file on [csvviewer.net](https://csvviewer.net), and it is parsed entirely in your browser. Your data never leaves your device.

## Features

- **Drag & drop upload** — drop a CSV file or click to browse
- **Instant table view** — headers, row numbers, and horizontal scroll for wide files
- **Pagination** — browse large files page by page without freezing the tab
- **Privacy by design** — parsing runs locally with [Papa Parse](https://www.papaparse.com/); nothing is sent to our servers
- **No installation** — works on desktop and mobile browsers
- **i18n ready** — English and Chinese UI

## Try it now

Open **[https://csvviewer.net](https://csvviewer.net)** and upload any `.csv` file.

```
https://csvviewer.net
```

## Tech stack

| Layer | Stack |
| --- | --- |
| Framework | [Next.js](https://nextjs.org/) (App Router) |
| UI | React, TypeScript, Tailwind CSS, shadcn/ui |
| CSV parsing | Papa Parse (client-side) |
| Deploy | Cloudflare Workers (OpenNext) |

## Getting started

### Prerequisites

- Node.js 20+
- pnpm (recommended)

### Install & run

```bash
# clone
git clone https://github.com/CoderLim/csv-viewer.git
cd csv-viewer

# install dependencies
pnpm install

# configure environment
cp .env.example .env.development

# start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

Key variables (see `.env.example`):

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Public site URL (production: `https://csvviewer.net`) |
| `NEXT_PUBLIC_APP_NAME` | App display name |
| `AUTH_SECRET` | Auth secret (`openssl rand -base64 32`) |
| `DATABASE_PROVIDER` / `DATABASE_URL` | Database connection |

Production is configured for **[csvviewer.net](https://csvviewer.net)**.

### Scripts

```bash
pnpm dev          # local development (Turbopack)
pnpm build        # production build
pnpm start        # start production server
pnpm lint         # ESLint
pnpm cf:deploy    # build & deploy to Cloudflare
```

## Project structure

```
src/
├── app/                    # Next.js App Router pages
├── shared/blocks/csv-viewer/  # CSV upload, parse, table UI
├── config/                 # locale, DB schema, app config
├── core/                   # auth, db, theme
└── themes/                 # landing page blocks
```

Core CSV logic lives in `src/shared/blocks/csv-viewer/`:

- `parse-csv.ts` — client-side CSV parsing
- `csv-upload-zone.tsx` — drag & drop zone
- `csv-table-view.tsx` — paginated table
- `csv-hero-workspace.tsx` — upload → view workspace

## Privacy

CSV Viewer is built around a simple rule:

> **Your files stay in your browser.**

Files are read and parsed on the client. They are not uploaded to [csvviewer.net](https://csvviewer.net) servers for viewing.

## Contributing

Contributions are welcome.

1. Fork the repo
2. Create a branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Open a Pull Request

Ideas that fit well:

- Column sort / filter / search
- Export filtered results (CSV / JSON)
- Better handling of large files
- Accessibility and mobile UX improvements

## Links

| | |
| --- | --- |
| **Website** | [https://csvviewer.net](https://csvviewer.net) |
| **Support** | [support@csvviewer.net](mailto:support@csvviewer.net) |
| **Repository** | [github.com/CoderLim/csv-viewer](https://github.com/CoderLim/csv-viewer) |

## License

See [LICENSE](./LICENSE) for details.

---

<p align="center">
  <strong>Open a CSV in seconds → <a href="https://csvviewer.net">csvviewer.net</a></strong>
</p>
