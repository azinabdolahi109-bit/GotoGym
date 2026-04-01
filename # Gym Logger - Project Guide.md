# Gym Logger - Project Guide

## Overview

A minimal, mobile-first gym logging web app built with **Next.js** and **Firebase Firestore**. Users can quickly log exercises — movement name, reps, and weight — during workouts.

**Repo:** https://github.com/henrylahteenmaki/gym_program  
**Deployment:** Vercel  
**Database:** Firebase Firestore

---

## Tech Stack

| Layer       | Technology                        |
| ----------- | --------------------------------- |
| Framework   | Next.js 15 (App Router)          |
| Language    | TypeScript                        |
| Styling     | Tailwind CSS v4                   |
| Database    | Firebase Firestore                |
| Auth        | None (single-user, keep it simple)|
| Hosting     | Vercel                            |
| Package Mgr | npm                               |

---

## Data Model

### Firestore Collection: `workouts`

```
workouts/{workoutId}
  ├── date: Timestamp
  ├── entries: [
  │     {
  │       movement: string      // e.g. "Bench Press"
  │       reps: number          // e.g. 8
  │       weight: number        // e.g. 80 (in kg)
  │     }
  │   ]
  └── createdAt: Timestamp
```

> **Why a single collection with embedded entries?** For a simple logger, embedding sets within a workout document keeps reads cheap and avoids subcollection complexity. Each workout is one Firestore doc.

---

## Core Features (MVP)

1. **Add Workout Entry** — Form with movement name, reps, and weight fields
2. **Workout Log View** — List of today's entries grouped by workout session
3. **History View** — Browse past workouts by date

---

## Suggested Enhancements

These are optional but would improve the UX significantly:

### High Impact, Low Effort
- **Movement autocomplete** — Remember previously used movement names and suggest them (store unique movements in a `movements` collection or derive from history)
- **Quick-add last set** — Button to duplicate the previous set (same movement, same weight, same reps) for fast logging between sets
- **Unit toggle** — Switch between kg and lbs
- **PWA support** — Add a `manifest.json` and service worker so the app can be installed on phone home screen and works offline-ish

### Medium Effort
- **Workout templates** — Save common workout routines (e.g. "Push Day") and load them with one tap
- **Set counter** — Auto-increment set number per movement within a workout
- **Rest timer** — Simple countdown timer between sets (e.g. 90s) with notification
- **Notes field** — Optional notes per entry (e.g. "felt easy", "use narrower grip")

### Nice to Have
- **Simple auth** — Firebase Anonymous Auth or Google Sign-In if you want multi-device sync
- **Progress charts** — Track weight/reps over time per movement using a lightweight chart library (e.g. Recharts)
- **Export data** — Download workout history as CSV
- **Dark mode** — Auto-detect system preference

---

## Project Structure

```
gym_logger/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout, fonts, metadata
│   │   ├── page.tsx            # Home — today's workout log + add form
│   │   └── history/
│   │       └── page.tsx        # Past workouts browser
│   ├── components/
│   │   ├── WorkoutForm.tsx     # Add movement/reps/weight form
│   │   ├── WorkoutEntry.tsx    # Single entry display
│   │   └── WorkoutList.tsx     # List of entries for a session
│   ├── lib/
│   │   └── firebase.ts         # Firebase config & Firestore helpers
│   └── types/
│       └── index.ts            # TypeScript types
├── public/
├── .env.local                  # Firebase config (not committed)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable **Cloud Firestore** (start in test mode for development)
3. Register a **Web App** to get config keys
4. Create `.env.local` with:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

5. Add the same env vars to **Vercel** project settings for production

---

## Development Commands

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npx next build

# Lint
npm run lint
```

---

## Vercel Deployment

1. Push to GitHub: `https://github.com/henrylahteenmaki/gym_program`
2. Connect repo in Vercel dashboard
3. Set environment variables in Vercel (same as `.env.local`)
4. Vercel auto-detects Next.js — deploys on every push to `main`

---

## Design Principles

- **Mobile-first** — This will primarily be used at the gym on a phone
- **Minimal taps** — Logging a set should take < 5 seconds
- **Large touch targets** — Buttons and inputs sized for sweaty fingers
- **Fast** — No unnecessary loading states; optimistic UI updates
- **Simple** — Resist feature creep; ship the MVP first

---

## Key Dependencies

```json
{
  "next": "^15",
  "react": "^19",
  "firebase": "^11",
  "tailwindcss": "^4"
}
```

---

## Firestore Security Rules (Development)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /workouts/{document=**} {
      allow read, write: if true;
    }
  }
}
```

> ⚠️ **Lock these down before going public.** If you add auth later, switch to `allow read, write: if request.auth != null;`