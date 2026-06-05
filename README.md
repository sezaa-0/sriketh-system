# SriKeth ERP

Private ERP — first module: **Paddy/Maize Trading & Trip Logistics**.

## Stack

- Next.js 14 (App Router)
- Tailwind CSS
- Framer Motion

## Getting started

```bash
npm install
npm run dev
```

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Run `supabase/schema.sql` in the Supabase SQL editor to create `loads` and `trips` tables.

Open [http://localhost:3000/trading](http://localhost:3000/trading).

## Module structure

```
app/(dashboard)/trading/page.js     # Trading route
components/trading/                 # Feature UI
lib/trading/                        # Types, calculations, dummy data
```

## Financial formulas (per load)

- **Total Cost** = buying price × total kg
- **Total Revenue** = selling price × total kg
- **Trip expenses** = fuel + driver wage + helper wage + road expenses (split by Inward/Outward)
- **Net Profit** = revenue − cost − total trip expenses
