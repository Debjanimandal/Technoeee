# TechnoEEE — Student Learning Platform

> A beautifully designed, university-grade online learning platform built for students to explore courses, track progress, plan their studies, and get AI-powered help — all in one place.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=flat-square&logo=supabase)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **Authentication** | Sign Up & Sign In via Supabase Auth with secure session management |
| 📚 **Course Explorer** | Browse and enroll in structured CS/AI university-grade courses |
| 🎓 **My Courses** | Track enrolled courses with progress % and completion status |
| 🧩 **Course Learner** | Structured per-topic learning with Video, Notes & Quiz modules |
| 📅 **Study Planner** | Build a personalized weekly study schedule |
| 📊 **Analytics & Reports** | Visualize study time, topic strengths, weekly performance & learning streaks |
| 🤖 **AI Chatbot** | Get instant answers to subject questions powered by AI |
| 🏅 **Badges & Achievements** | Earn and claim badges as you complete courses and milestones |
| 👤 **Student Profile** | Manage personal info, About Me, avatar, and profile completion |
| 🔔 **Notifications** | In-app notification system for badges, progress updates, and reminders |
| 🌟 **Dev Mode Hero** | Interactive animated landing page with a toggle-based experience |

---

## 🚀 Tech Stack

| Technology | Role |
|-----------|------|
| [Next.js 16](https://nextjs.org) | React framework using the App Router |
| [Supabase](https://supabase.com) | PostgreSQL database, authentication & Row Level Security |
| [Lucide React](https://lucide.dev) | Professional icon library |
| [Chart.js](https://www.chartjs.org) | Analytics & performance visualisation charts |
| [Poppins](https://fonts.google.com/specimen/Poppins) | Typography via Google Fonts |
| Vanilla CSS | Custom design system with glassmorphism & dark-blue theme |

---

## 📁 Project Structure

```
Technoeee/
├── app/
│   ├── page.js                  # Landing page (Dev Mode hero, course explorer)
│   ├── dashboard/               # Student dashboard — stat cards, enrolled courses
│   ├── courses/                 # All available courses browser
│   ├── my-courses/              # Enrolled courses with progress tracking
│   ├── learn/[courseId]/        # Per-course learner — topics, video, notes, quiz
│   ├── planner/                 # Weekly study planner
│   ├── profile/                 # Student profile page
│   ├── reports/                 # Analytics & performance reports
│   ├── chatbot/                 # AI Chatbot interface
│   ├── achievements/            # Badges & achievements page
│   └── globals.css              # Global design system & CSS
├── components/
│   ├── layout/
│   │   ├── Navbar.js            # Top navigation bar
│   │   ├── Sidebar.js           # Dashboard sidebar navigation
│   │   ├── DashboardHeader.js   # Inner-page header with profile pill
│   │   └── Footer.js            # Landing page footer
│   ├── auth/
│   │   └── AuthModal.js         # Sign Up / Sign In modal
│   ├── profile/
│   │   └── EditProfileModal.js  # Profile editing modal
│   ├── achievements/
│   │   └── BadgeClaimModal.js   # Badge claim modal
│   └── shared/
│       ├── NotificationDropdown.js
│       └── ProfileDropdown.js
├── lib/
│   ├── supabaseClient.js        # Supabase client initialisation
│   ├── context/
│   │   ├── auth-context.js      # Auth context & session provider
│   │   └── badge-context.js     # Badge eligibility & claim context
│   ├── services/
│   │   └── studyService.js      # Supabase RPC calls (analytics, stats)
│   └── data/
│       └── badges.js            # Badge definitions & eligibility rules
├── public/
│   ├── image/                   # Static assets (logo, profile icon, notifications)
│   └── course-banners/          # Course thumbnail images
└── types/                       # TypeScript type definitions
```

---

## 🛠️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Debjanimandal/Technoeee.git
cd Technoeee
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Navigate to **Settings → API** and copy your `Project URL` and `anon key`
3. Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

4. Open **Supabase → SQL Editor** and run the schema below:

```sql
-- ── Profiles ────────────────────────────────────────────────────────────────
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  created_at timestamp with time zone default timezone('utc', now())
);

-- ── Enrollments ─────────────────────────────────────────────────────────────
create table enrollments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  course_title text not null,
  category text,
  progress integer default 0,
  status text default 'Ongoing',
  created_at timestamp with time zone default timezone('utc', now())
);

-- ── Module Progress ──────────────────────────────────────────────────────────
create table modules_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  enrollment_id uuid references enrollments on delete cascade not null,
  module_name text not null,
  progress integer default 0
);

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table profiles enable row level security;
alter table enrollments enable row level security;
alter table modules_progress enable row level security;

create policy "Users can view own profile"   on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can manage own enrollments" on enrollments for all using (auth.uid() = user_id);
create policy "Users can manage own modules"     on modules_progress for all using (auth.uid() = user_id);

-- ── Auto-create profile on signup ───────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

5. In **Supabase → Authentication → Providers → Email**, disable **"Confirm email"** for local development.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database Schema

| Table | Description |
|-------|-------------|
| `profiles` | Stores username & metadata linked to each authenticated user |
| `enrollments` | Records course enrollments with progress percentage and status |
| `modules_progress` | Tracks per-module completion for each course enrollment |

---

## 🚀 Deployment

Deploy in minutes on [Vercel](https://vercel.com):

1. Push this repo to GitHub
2. Import the project into [Vercel](https://vercel.com/new)
3. Add the following environment variables in Vercel's dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy** — you're live!

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Built with ❤️ for students, by students — TechnoEEE</sub>
</div>
