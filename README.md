# TechnoEEE — DevMode Learning Platform

A modern online learning platform built with **Next.js 16** and **Supabase**, featuring user authentication, student profiles, course enrollment tracking, and analytics dashboards.

---

## 🚀 Tech Stack

| Technology | Purpose |
|-----------|---------|
| [Next.js 16](https://nextjs.org) | React framework (App Router) |
| [Supabase](https://supabase.com) | Database, Auth & Row Level Security |
| [Chart.js](https://www.chartjs.org) | Analytics & performance charts |
| [Poppins](https://fonts.google.com/specimen/Poppins) | Typography via Google Fonts |

---

## ✨ Features

- 🔐 **Authentication** — Sign Up & Sign In via Supabase Auth
- 👤 **Student Profiles** — Usernames stored in Supabase `profiles` table
- 📚 **Course Enrollment** — Track enrolled courses with progress % and status
- 📊 **Analytics Dashboard** — Weekly performance, strengths & improvement charts
- 🧩 **Module Progress** — Per-module completion tracking
- 🌐 **Community Section** — Channel-based chat UI
- 💡 **Dev Mode** — Interactive hero toggle with animations

---

## 🛠️ Getting Started

### 1. Clone the repo

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
2. Go to **Settings → API** and copy your `Project URL` and `anon key`
3. Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

4. Go to **Supabase → SQL Editor** and run the following:

```sql
-- Tables
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  created_at timestamp with time zone default timezone('utc', now())
);

create table enrollments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  course_title text not null,
  category text,
  progress integer default 0,
  status text default 'Ongoing',
  created_at timestamp with time zone default timezone('utc', now())
);

create table modules_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  enrollment_id uuid references enrollments on delete cascade not null,
  module_name text not null,
  progress integer default 0
);

-- Row Level Security
alter table profiles enable row level security;
alter table enrollments enable row level security;
alter table modules_progress enable row level security;

create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can manage own enrollments" on enrollments for all using (auth.uid() = user_id);
create policy "Users can manage own modules" on modules_progress for all using (auth.uid() = user_id);

-- Auto-create profile on signup
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

5. Go to **Supabase → Authentication → Providers → Email** and turn **OFF** "Confirm email" (for development)

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
Technoeee/
├── app/
│   ├── page.js          # Landing page (Dev Mode hero)
│   ├── home/            # Home page after login
│   ├── dashboard/       # Student dashboard (courses)
│   ├── profile/         # Profile & analytics
│   ├── analysis/        # Analysis page
│   ├── chatbot/         # Chatbot page
│   └── community/       # Community page
├── components/
│   ├── AuthModal.js     # Sign Up / Sign In modal
│   ├── Navbar.js        # Top navigation bar
│   ├── Sidebar.js       # Dashboard sidebar
│   ├── DashboardHeader.js
│   └── Footer.js
├── lib/
│   ├── supabaseClient.js  # Supabase client
│   └── auth-context.js    # Auth context & provider
└── public/
    └── image/             # Static assets
```

---

## 🗄️ Database Schema

| Table | Description |
|-------|------------|
| `profiles` | Stores username linked to each auth user |
| `enrollments` | Student course enrollments with progress & status |
| `modules_progress` | Per-module completion for each enrollment |

---

## 🚀 Deploy

Deploy easily on [Vercel](https://vercel.com):

1. Push this repo to GitHub
2. Import to Vercel
3. Add your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables
4. Deploy!
