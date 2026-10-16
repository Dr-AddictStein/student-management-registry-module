# SMS Registry

A registry module for a student management system. Staff enrol students, track fees, open assessments, and publish results. Students submit work and see only the grades that have been released.

Students register themselves and sign in to a student dashboard. Registry staff sign in with a fixed account and create programmes, modules, students, assessments, payments, and grades in the app. File upload is not wired up yet.

## Stack

- Next.js 16 (App Router) and React 19
- PostgreSQL and Prisma 7
- Tailwind CSS 4 and shadcn/ui

## Run it locally

You need Node.js 20 or newer, and PostgreSQL 16. Docker is the quickest way to get the database.

```bash
docker compose up -d
cp .env.example .env
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

`npm install` generates the Prisma client. If you change `prisma/schema.prisma`, run `npm run db:generate` again.

Open [http://localhost:3000](http://localhost:3000). You are sent to the sign-in page.

### Accounts

Staff cannot register. Their email and password come from `STAFF_EMAIL` and `STAFF_PASSWORD` in `.env`.

Students register at `/register` with their name, email, password, date of birth, programme, and academic year. The account is created as Enrolled. The registry issues the student ID and copies the programme fee, due 30 days later. A student must be at least 16.

The seed creates six students who can all sign in with the password `Password123!`. One of them is `amira.hassan@example.edu`.

Sessions last 7 days. Use **Log out** in the sidebar to end one.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Next.js app |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Create and apply a migration |
| `npm run db:seed` | Load demo data (replaces existing rows) |
| `npm run db:studio` | Open Prisma Studio |

## Environment variables

Copy `.env.example` to `.env`. Do not commit `.env`.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma |
| `STAFF_EMAIL` | Fixed email for the registry desk |
| `STAFF_PASSWORD` | Fixed password for the registry desk |
| `SESSION_SECRET` | Signs the login cookie. At least 32 characters |

The example matches the Docker Compose database:

```
postgresql://postgres:postgres@localhost:5432/sms_registry?schema=public
```

Prisma reads this from `prisma7.config.ts`. Next.js reads the same `.env` file.

## Demo data

`prisma/seed.ts` loads:

- 2 programmes, each with a fee and two modules
- 6 students (`SMS-2025-0001` through `SMS-2025-0006`) covering enrolled, deferred, withdrawn, and completed
- Payments, including students who have paid in full, paid in part, or paid nothing
- 3 assessments, on-time and late submission records, and grades that are either published or withheld

Submission rows point at file names only. The upload folder is not created by the seed.

## Project layout

```
prisma/schema.prisma    Data model
prisma/seed.ts          Demo data
prisma7.config.ts       Database URL and seed command
src/app                 App Router pages
src/components          Registry shell and shadcn/ui
src/lib/domain.ts       Student IDs and grade bands
src/lib/prisma.ts       Shared Prisma client
```

Uploaded files will live in `storage/`, which is gitignored.

## Data model

- A **programme** owns the fee and its modules. A student's `assignedFee` copies that fee at enrolment, so a later change to the programme fee does not rewrite what they owe.
- The **student number** is `SMS-{year}-{sequence}`, for example `SMS-2025-0001`.
- Enrolment status is Enrolled, Deferred, Withdrawn, or Completed.
- **Outstanding balance** is the assigned fee minus recorded payments. It is overdue when that balance is still above zero after `feeDueDate`.
- An **assessment** belongs to a module and has one deadline. A student has at most one submission per assessment. Sending another file updates that row. `isLate` is stored from the submission time.
- A **result** stores a grade from 0 to 100 and a classification: Fail below 40, Pass from 40, Merit from 60, Distinction from 70. `published` controls whether the student can see it.

## AI usage

The project skeleton and the sign-in flow were set up in Cursor with Grok. Student registration, the fixed staff account, and the separate dashboards were implemented with that assistance. Later features should be added to this note so it stays an accurate account of what was produced with AI and what was decided by hand.
