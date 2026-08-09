// ============================================================
// Global TypeScript Type Definitions for Technoeee
// ============================================================

// ── Auth ──────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  avatar_url?: string;
  created_at?: string;
}

// ── Courses ───────────────────────────────────────────────
export interface Course {
  id: string;
  title: string;
  description?: string;
  instructor?: string;
  duration?: string;
  thumbnail?: string;
  category?: string;
  tags?: string[];
}

export interface EnrolledCourse extends Course {
  progress: number;
  enrolled_at?: string;
  completed?: boolean;
}

// ── Study / Planner ───────────────────────────────────────
export interface StudySession {
  id?: string;
  user_id: string;
  course_id: string;
  duration_seconds: number;
  started_at: string;
  ended_at?: string;
}

export interface StudyStats {
  totalHours: number;
  completedTopics: number;
  currentStreak: number;
  coursesInProgress: number;
}

// ── Notifications ─────────────────────────────────────────
export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

// ── Navigation ────────────────────────────────────────────
export interface NavItem {
  label: string;
  href: string;
  icon?: string;
}
