# EMB Global DMS Frontend

Enterprise dashboard for the Document Management System described in the project specification. The app is built with Next.js (App Router) and TypeScript, styled with TailwindCSS and shadcn-inspired primitives, and wired with TanStack Query for data orchestration.

## Features

- **Dashboard pulse** – KPI cards, PO utilization trends, document type distribution, exception feed, and alerts.
- **Document inventory** – Filterable table of POs, invoices, and agreements, linking to detail views with metadata, validation history, and PDF preview placeholder.
- **Exception workspace** – Severity-based triage columns with owner assignment indicators and remediation guidance.
- **Alert center** – Manage automation rules for PO caps, expiries, and unlinked invoices with quick actions.
- **Settings** – Configure ingestion integrations, role-based access defaults, and automation thresholds.
- **Conversational assistant** – Floating chatbot widget to answer PO, invoice, and agreement questions.

## Stack

- Next.js 14 (App Router) + TypeScript
- TailwindCSS + custom shadcn-style UI primitives
- TanStack React Query for client data fetching/hooks
- Recharts for analytics visualisation
- React Dropzone & React PDF stubs for uploads/previews (replace with live integrations)

## Getting Started

```bash
pnpm install
pnpm dev
```

The project also supports `npm` or `yarn`. Running the dev server starts the dashboard on `http://localhost:3000`.

### Chatbot Lambda integration

The floating assistant can call a lightweight AWS Lambda demo without backend auth. Configure it by setting `NEXT_PUBLIC_LAMBDA_URL` (e.g. via `.env.local`) to the Lambda “Function URL” that you created with **Auth type = NONE** and CORS origin `*`. Once the env var is present, the widget will issue:

```
POST $NEXT_PUBLIC_LAMBDA_URL
Content-Type: application/json
{ "query": "Give me invoice 23247004" }
```

The handler is expected to return `{ "answer": "..." }` (the assistant also falls back to `reply`/`message` keys). Share the same URL and payload with teammates so they can call the chatbot directly from other clients if needed.

## Project Structure

- `app/` – App Router pages (dashboard, documents, exceptions, alerts, settings).
- `components/` – Reusable UI (navigation shell, charts, tables, settings forms).
- `lib/data/sample-data.ts` – Static data powering the mock API routes.
- `styles/globals.css` – Tailwind setup with dark theme tokens.

## Next Steps

1. Replace mock API routes with live backend endpoints (`app/api/*`).
2. Tie the upload handler to persistent storage and enrich the ingest queue.
3. Replace the mock chat API with your production LLM service and retrieval pipeline (update `NEXT_PUBLIC_LAMBDA_URL` or swap in a secured endpoint).
4. Swap the stub auth context for your identity provider (Auth0, Cognito, etc.).
5. Export alert rules to backend automation engine.
