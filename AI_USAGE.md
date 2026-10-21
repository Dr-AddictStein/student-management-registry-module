# How I used AI on the SMS Registry

The brief asked for the four jobs a registry desk actually does, and it asked me to say how I used AI. This note is that account. The short version is also in the [README](README.md).

I used Cursor's agent, running Grok, as the implementation partner. I did not use it as a vending machine for a finished app. I set the product rules, rejected approaches that would fail the brief, and checked the running system before I trusted a change.

## What I wanted the model to do

The useful split was this: I decide what the registry must refuse, and the model drafts the Next.js and Prisma that enforce it.

I started from the brief, not from a framework tutorial. The required shape was Next.js App Router, PostgreSQL, Prisma, and a real database. Auth could have been a role toggle. I rejected that. A registry desk and a student looking at their own marks cannot share one screen with a switch. Staff sign in from environment credentials and cannot self-register. Students register once, with the enrolment fields, and then sign in. Both paths end in a signed cookie, and every mutation checks that cookie on the server.

I also refused a second backend. The brief says not to add one. Server actions and two route handlers are the API. The OpenAPI file documents the HTTP routes that exist, and the docs page lists the actions, instead of inventing REST paths the app does not serve.

## Rules I fixed before the code

I wrote these down before asking for screens, because they are the part an interviewer can grade as judgment:

- The student ID is `SMS-{year}-{sequence}`. The student does not choose it, and it does not change.
- The fee on the student is a copy of the programme fee at enrolment. Changing the programme fee later must not rewrite what people already owe.
- Overdue is calculated, not stored. A balance is overdue only after the due date, and withdrawing a student does not forgive it.
- A payment cannot exceed what is still outstanding, and the reference cannot be reused.
- One submission per student per assessment. Replace is allowed only before the deadline. The first file after the deadline is kept and flagged. A later file is refused.
- A grade is 0–100. Pass starts at 40, Merit at 60, Distinction at 70. The student sees the row only when staff publish that row.
- Delete stops when it would throw away history that still has children. Payments, files, and grades can be removed first.

The model then implemented those rules in `src/lib/domain.ts`, the server actions, and the forms. Where a first draft only hid a button, I sent it back: a student session must be rejected by the action, not only by the navigation.

## How I ran the work

I kept the requests small and in order.

1. Scaffold only the stack the brief names. No features yet.
2. Replace the role toggle with real sign-in, registration, and logout.
3. Put every registry record behind create, read, update, and delete in the app, so I am not inserting rows in the database console to demo a feature.
4. Add the file upload last, with the deadline rules above.
5. Write the README, the OpenAPI document, and this note from the code, not from memory of the plan.

Each step ended with me reading the diff. I looked for secrets, for data kept in `useState`, and for checks that lived only in the browser. `.env` stays uncommitted. The Prisma client is generated on install and is not committed. Uploaded files stay in `storage/`, which is gitignored.

## Where I corrected the output

A few drafts were plausible and wrong. Those are the moments that matter.

- The first fee model stored a single balance. I changed it so the balance is the assigned fee minus payments, read at request time. The overdue list on the desk home uses that calculation.
- An early note said a late flag should survive a deadline edit. That hides a mistake if staff move the deadline. The save action now recomputes `isLate` from the original submission time.
- File upload writes the bytes first and inserts the submission row second. If the insert fails, the new file is removed. A failed upload does not leave a row pointing at nothing.
- Next.js was running with cache components turned on. The pages then reloaded forever, because a Suspense boundary never finished and the browser asked for the same URL again. I turned that mode off. The registry is session and database data. Caching the shell was not worth a reload loop.
- Staff tried to create records by typing into Neon. I stopped that path. Programmes, modules, students, assessments, payments, and grades are created in the screens. The seed script remains, because the brief asks for demo data, and it is explicit that it replaces the current rows.
- A submission list that only named the file was not enough for the registry desk. Staff need to read what the student handed in. The first viewer put the PDF inside a dialog, and the browser left that frame blank. **Open** now uses a new tab. `?view=1` returns the PDF inline, and a Word file as HTML built from the document text. The seed writes those sample files into `storage/seed/`, so the demo rows open without a separate upload.

I also checked the unhappy paths in code, not only the happy form. A closed submission cannot be replaced. A deferred student cannot upload. A student cannot submit to another programme. An empty file, a renamed text file, and a file over 10 MB are refused. Those checks passed against the seeded database, and the temporary file was removed afterward.

## What I verified myself

I did not treat a green diff as a finished feature.

- `npx tsc --noEmit` and `npm run lint`
- The app in the browser: staff sign-in, a programme created from the screen and visible in the database, student sign-in, the upload control on an open assessment, and no replace control on a closed one
- From the staff assessments page, **Open** on a seeded PDF and on Noah Bennett's Word file, each in a new tab
- The seed accounts in the README match `prisma/seed.ts`, including which grade is published and which submission is late

The browser check mattered. The reload loop looked like a slow page until the server log showed the same `GET` repeating. That is the kind of failure a model will not notice unless you watch the running app.

## What I would still do by hand

I use the agent to draft components, queries, and validation. I do not hand it the product calls, the secret values, or the decision to skip an edge case because it was not in the brief. The brief's own marking scheme weights those edge cases. Overdue fees, late files, and withheld results are implemented because a registry would be wrong without them, not because a prompt listed them.

The result is a small system I can explain. Staff and students are different sessions. Money, files, and grades have one rule each. The API document matches the routes that exist. The parts the model wrote are in the repository, and the parts I had to send back are in this note.
