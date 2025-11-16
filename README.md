# Clinic Management System

A modern clinic management system built with Next.js, Supabase, and Prisma.

## Tech Stack

- **Next.js 15** - React framework with App Router
- **Supabase** - Backend as a Service (Database & Auth)
- **Prisma** - ORM for database management
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Clinic-project
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory and add your Supabase credentials:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"
```

4. Set up Prisma:

Generate Prisma Client:
```bash
npm run db:generate
```

Push the schema to your database:
```bash
npm run db:push
```

Or create a migration:
```bash
npm run db:migrate
```

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/                # API routes
│   │   │   └── patients/       # Patient API endpoints
│   │   ├── dashboard/          # Dashboard page
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   └── globals.css         # Global styles
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── dashboard-main/     # Dashboard components
│   │   ├── landing-page/       # Landing page components
│   │   └── other/              # Other components
│   ├── lib/                    # Utility functions
│   │   ├── prisma.ts           # Prisma client
│   │   └── supabase/           # Supabase clients
│   └── hooks/                  # Custom React hooks
├── prisma/
│   └── schema.prisma           # Prisma schema
└── public/                      # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:studio` - Open Prisma Studio

## Database Schema

The project uses Prisma with PostgreSQL (via Supabase). The main model is:

- **Patient** - Stores patient information including name, contact, status, condition, visit dates, etc.

## Features

- Patient management
- Dashboard with statistics
- Responsive design
- Modern UI with shadcn/ui components
- Type-safe API routes
- Database integration with Prisma

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)

