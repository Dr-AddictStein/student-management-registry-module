# SMS Registry

Registry module for a student management system. It covers the four jobs a registry desk does every day: enrol students, track what they owe, take assessment files, and release grades.

Staff and students sign in to different screens. Nothing on those screens is held in component state as fake data. PostgreSQL is the record.

## Stack

- Next.js 16.4 (App Router) and React 19
- PostgreSQL 16 and Prisma 7, through the `pg` driver adapter
- Tailwind CSS 4 and shadcn/ui
- Session cookie signed with `jose`, student passwords hashed with `bcryptjs`

There is no second backend. Pages and server actions talk to Prisma directly.

## Run it locally

Node.js 20 or newer, and a PostgreSQL database.

Docker is the local database:

```bash
docker compose up -d
```

On Windows PowerShell, copy the example environment file:

```powershell
Copy-Item .env.example .env
```

On macOS or Linux:

```bash
cp .env.example .env
```

Then:

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You are sent to the sign-in page.

`npm install` generates the Prisma client into `src/generated`, which is not committed. After a schema change, run `npm run db:generate`.

A hosted Postgres URL works as well, including a Neon connection string. `prisma7.config.ts` reads `DATABASE_URL`. If the host name contains `-pooler`, migrations use the direct host. The running app keeps the pooled URL.

`npm run db:seed` deletes the current rows and loads the demo set again. Do not run it against a database you need to keep.

### Accounts

Staff cannot register. Set `STAFF_EMAIL` and `STAFF_PASSWORD` in `.env`. The example file uses `registry@sms.local` and `change-me`. Change the password before anyone else can reach the machine.

Students register at `/register`. The account is created as Enrolled. The registry issues the student ID and copies the programme fee, due 30 days later. A student must be at least 16 and no older than 100. The academic year is written `2025/26`.

The seed creates six students. Each can sign in with `Password123!`.

| Student ID | Name | Email | Status | Programme |
| --- | --- | --- | --- | --- |
| SMS-2025-0001 | Amira Hassan | amira.hassan@example.edu | Enrolled | BSc Computer Science |
| SMS-2025-0002 | Jonah Adeyemi | jonah.adeyemi@example.edu | Enrolled | BSc Computer Science |
| SMS-2025-0003 | Priya Shah | priya.shah@example.edu | Deferred | BA Business Management |
| SMS-2025-0004 | Luca Moretti | luca.moretti@example.edu | Withdrawn | BA Business Management |
| SMS-2025-0005 | Elena Kowalska | elena.kowalska@example.edu | Completed | BSc Computer Science |
| SMS-2025-0006 | Noah Bennett | noah.bennett@example.edu | Enrolled | BA Business Management |

The session cookie is `sms_session`. It lasts 7 days. **Log out** in the sidebar clears it. `GET /api/logout` does the same.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Next.js app |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run db:migrate` | Create and apply a migration |
| `npm run db:seed` | Replace all rows with the demo set |
| `npm run db:studio` | Open Prisma Studio |

## Environment variables

Copy `.env.example` to `.env`. `.env` is gitignored. Do not commit it.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma and the Next.js server |
| `STAFF_EMAIL` | Fixed email for the registry desk |
| `STAFF_PASSWORD` | Fixed password for the registry desk |
| `SESSION_SECRET` | Signs the login cookie. At least 32 characters |

The example matches the Docker Compose database:

```
postgresql://postgres:postgres@localhost:5432/sms_registry?schema=public
```

## Screens

| Path | Staff | Student |
| --- | --- | --- |
| `/` | Desk home, including overdue balances | Own enrolment summary |
| `/programmes` | Create, edit, and delete programmes | Hidden |
| `/modules` | Create, edit, and delete modules | Hidden |
| `/students` | Search, enrol, edit, and delete students | Own enrolment record |
| `/fees` | Balances and payment records | Own fee and payments |
| `/assessments` | Create assessments and see every submission | Own programme, with upload |
| `/results` | Enter, publish, withhold, and delete grades | Published grades only |
| `/login`, `/register` | Sign-in. Registration is for students | Same |
| `/docs` | API reference, public | Same |

Search on the student list matches name, email, or student ID, and can be narrowed by programme and status.

## Registry rules

These are the edge cases the screens enforce. The server checks them again even if the button is hidden.

- The student ID is `SMS-{start year}-{sequence}`, for example `SMS-2025-0001`. It is unique and is not edited later.
- Email is stored in lowercase and must be unique. The staff email cannot be used for a student.
- A new student's assigned fee is a copy of the programme fee at enrolment. A later change to the programme fee does not change what current students owe. Staff can edit an assigned fee on purpose.
- Outstanding balance is the assigned fee minus recorded payments. It is overdue only when the balance is still above zero and the due date is before today. The due date itself is not overdue. Withdrawing a student does not cancel the debt. A zero fee is never overdue.
- A payment must be greater than zero, dated today or earlier, and no larger than the remaining balance. The reference is unique.
- An assessment has one deadline, stored in UTC. If staff move the deadline, each submission is marked late or on time again from its original submission time.
- A student uploads one PDF or DOCX of up to 10 MB per assessment. The file signature is checked, not only the extension. They can replace it until the deadline. After the deadline, a first file is accepted and marked late, and an existing file cannot be replaced. Only an enrolled student can upload, and only for an assessment on their programme. If the file cannot be stored, no submission row is written.
- Uploaded files live in `storage/`, which is gitignored. The seed records file names only. Those names do not have bytes on disk.
- A grade is an integer from 0 to 100. Below 40 is Fail, 40 is Pass, 60 is Merit, and 70 is Distinction. One grade per student per assessment. The student must be on the assessment's programme. A student sees a grade only when that row is published.
- Delete is blocked when it would orphan history: a programme with modules or students, a module with assessments, an assessment with submissions or grades, or a student with payments, submissions, or grades. Remove the child records first. Payments, submissions, and grades can be deleted on their own.

## Demo data

`prisma/seed.ts` loads:

- 2 programmes: BSc Computer Science (`BSC-CS`, fee 8500.00) and BA Business Management (`BA-BM`, fee 7200.00)
- 4 modules: `PROG101`, `DATA201`, `MGMT101`, `ACCT110`
- 6 students, listed above, covering Enrolled, Deferred, Withdrawn, and Completed
- Payments for partial, full, and unpaid positions. Priya Shah has no payments
- 3 assessments. Database Design Report is still open. The other two deadlines have passed
- Submissions, including Jonah Adeyemi's late programming coursework
- Grades for Elena (78, Distinction, published), Amira (64, Merit, withheld), Jonah (42, Pass, withheld), and Noah (55, Pass, published)

## API documentation

Open [http://localhost:3000/docs](http://localhost:3000/docs) while the app is running. That page embeds Swagger UI for the HTTP routes and lists every server action.

The OpenAPI 3 file is [public/openapi.yaml](public/openapi.yaml), also served at `/openapi.yaml`. Import it into Swagger Editor or Postman.

The HTTP routes are:

- `GET /api/logout` clears the session
- `GET /api/submissions/{id}` downloads a submission. Staff can download any file. A student can download only their own

Enrolment, fees, assessments, and grades are server actions on the forms, not a separate REST service. `/docs` describes each action, who may call it, and what it refuses.

## Project layout

```
prisma/schema.prisma       Programmes, modules, students, payments, assessments, submissions, results
prisma/migrations          Applied SQL migrations
prisma/seed.ts             Demo data
prisma7.config.ts          Database URL and seed command
public/openapi.yaml        OpenAPI description of the HTTP routes
src/app                    App Router pages, /docs, and the two route handlers
src/components             Forms, shell, and Swagger panel
src/lib                    Domain rules, Prisma client, auth, and server actions
src/proxy.ts               Sends anonymous visitors to /login
storage/                   Uploaded files. Gitignored
```

## Data model

- A **programme** owns its fee and its modules. A student's `assignedFee` is the copy taken at enrolment.
- A **module** belongs to one programme. Assessments belong to a module, so a student only sees assessments for their programme.
- A **student** has one current programme, one status, and one student number.
- A **payment** belongs to one student. Balance and overdue are calculated when the page is read. They are not stored columns.
- A **submission** is unique per student and assessment. Replacing a file updates that row. `isLate` is saved from the submission time and recalculated if the deadline moves.
- A **result** is unique per student and assessment. `published` decides whether the student can see it.

## AI usage

Cursor, with Grok, was used to scaffold the app and implement the screens from the registry rules. The decisions and the review of that output are written up in [AI_USAGE.md](AI_USAGE.md).
