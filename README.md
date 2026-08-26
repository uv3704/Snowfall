# Snowfall

A cold outreach application built with Next.js 16, PostgreSQL (Drizzle ORM), Inngest background workers, and direct SMTP sending.

---

## Features

- **Direct SMTP Dispatch**: Dispatches outreach directly through your configured Gmail SMTP account using App Passwords.
- **Global Suppression**: Automatically records and suppresses recipients after hard-bounce (550) responses across future campaigns.
- **Durable Background Execution**: Uses Inngest event fan-out with per-user concurrency limits and configurable sending intervals (45–90s).
- **Split-Pane Review**: Split-pane interface for reviewing contacts, status indicators, and personalized message previews with keyboard shortcuts (`J`/`K`/`Space`).
- **Preflight Verification**: Pre-send checklist enforcing sender connection, recipient validity, and 24-hour quota constraints.
- **Campaigns Ledger**: Historical campaign tracking with CSV export and retry functionality for non-blacklisted failed contacts.

---

## Architecture

- **Frontend & API**: Next.js 16 App Router (Server Components & TypeScript Route Handlers)
- **Database**: PostgreSQL (Neon Serverless) with Drizzle ORM
- **Queue & Async Jobs**: Inngest Fan-Out Workers
- **Authentication**: Clerk
- **Storage**: AWS S3 / Cloudflare R2 presigned attachments
- **Styling**: Tailwind CSS v4

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or Neon account)
- Clerk account
- Inngest account / local Inngest dev server

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/uv3704/Snowfall.git
cd Snowfall
npm install
```

### 2. Configure Environment

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Set the required environment variables:

```env
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
ENCRYPTION_KEY=your_32_byte_hex_encryption_key
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
AWS_S3_BUCKET=...
```

### 3. Database Schema Push

```bash
npx drizzle-kit push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## License

MIT © [Yuvraj Singh Rathore](https://github.com/uv3704)
