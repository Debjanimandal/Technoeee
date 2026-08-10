import { supabase } from '../supabase/client';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format total minutes into "Xh Ym" display string */
export function formatStudyTime(totalMinutes) {
  const mins = Math.round(totalMinutes || 0);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0 && m === 0) return '0m';
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Get ISO week number for a Date */
function isoWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

/** Calculate current study streak from array of 'YYYY-MM-DD' date strings */
export function calcStreak(dates) {
  if (!dates || dates.length === 0) return 0;
  const unique = [...new Set(dates)].sort().reverse();
  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (const dateStr of unique) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    const diffDays = Math.round((cursor - d) / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) {
      streak++;
      cursor = d;
    } else {
      break;
    }
  }
  return streak;
}

/** Aggregate raw session rows into { label, totalHours, totalMinutes, courses } */
function aggregateByKey(rows, keyFn, labelFn, slots) {
  // slots = [{ key, label }] in ascending order
  const map = {};
  slots.forEach(s => {
    map[s.key] = { label: s.label, key: s.key, totalHours: 0, totalMinutes: 0, courses: {} };
  });

  rows.forEach(row => {
    const key = keyFn(row);
    if (!map[key]) return;
    map[key].totalHours += Number(row.total_hours) || 0;
    map[key].totalMinutes += Number(row.total_minutes) || 0;
    if (!map[key].courses[row.course_title]) map[key].courses[row.course_title] = 0;
    map[key].courses[row.course_title] += Number(row.total_minutes) || 0;
  });

  return slots.map(s => map[s.key]);
}

// ─── Data Fetchers ─────────────────────────────────────────────────────────────

/**
 * Last N days of study data, one entry per day.
 * @returns {Array<{ label, totalHours, totalMinutes, courses }>}
 */
export async function getDailyStudyData(userId, days = 7) {
  const from = new Date();
  from.setDate(from.getDate() - days + 1);
  from.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('study_sessions')
    .select('study_date, total_hours, total_minutes, course_title')
    .eq('user_id', userId)
    .gte('study_date', from.toISOString().split('T')[0])
    .order('study_date', { ascending: true });

  if (error) { console.error('[studyService] getDailyStudyData:', error.message); return []; }

  // Build slots for last N days
  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const slots = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - days + 1 + i);
    const key = d.toISOString().split('T')[0];
    const label = days <= 7 ? WEEKDAYS[d.getDay()] : `${d.getDate()}/${d.getMonth() + 1}`;
    return { key, label };
  });

  return aggregateByKey(
    data || [],
    row => row.study_date,
    null,
    slots
  );
}

/**
 * Last N weeks of study data, one entry per week.
 * @returns {Array<{ label, totalHours, totalMinutes, courses }>}
 */
export async function getWeeklyStudyData(userId, weeks = 8) {
  const from = new Date();
  from.setDate(from.getDate() - weeks * 7);

  const { data, error } = await supabase
    .from('study_sessions')
    .select('week_number, year, total_hours, total_minutes, course_title, study_date')
    .eq('user_id', userId)
    .gte('study_date', from.toISOString().split('T')[0])
    .order('study_date', { ascending: true });

  if (error) { console.error('[studyService] getWeeklyStudyData:', error.message); return []; }

  const slots = Array.from({ length: weeks }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (weeks - 1 - i) * 7);
    const wk = isoWeekNumber(d);
    const yr = d.getFullYear();
    return { key: `${yr}-W${wk}`, label: `W${wk}` };
  });

  return aggregateByKey(
    data || [],
    row => `${row.year}-W${row.week_number}`,
    null,
    slots
  );
}

/**
 * Last N months of study data, one entry per month.
 * @returns {Array<{ label, totalHours, totalMinutes, courses }>}
 */
export async function getMonthlyStudyData(userId, months = 6) {
  const from = new Date();
  from.setMonth(from.getMonth() - months + 1);
  from.setDate(1);

  const { data, error } = await supabase
    .from('study_sessions')
    .select('month, year, total_hours, total_minutes, course_title, study_date')
    .eq('user_id', userId)
    .gte('study_date', from.toISOString().split('T')[0])
    .order('study_date', { ascending: true });

  if (error) { console.error('[studyService] getMonthlyStudyData:', error.message); return []; }

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const slots = Array.from({ length: months }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (months - 1 - i));
    const mo = d.getMonth() + 1;
    const yr = d.getFullYear();
    return { key: `${yr}-${mo}`, label: MONTHS[mo - 1] };
  });

  return aggregateByKey(
    data || [],
    row => `${row.year}-${row.month}`,
    null,
    slots
  );
}

/**
 * Full learning statistics for a user via the SQL RPC function.
 * @returns {{ total_hours, today_minutes, weekly_hours, monthly_hours, active_days, longest_session_min, last_study_date } | null}
 */
export async function getLearningStats(userId) {
  try {
    const { data, error } = await supabase.rpc('get_learning_stats', { p_user_id: userId });
    if (error) return null;
    return data;
  } catch {
    // Network unavailable — callers fall back to mock data
    return null;
  }
}

/**
 * All unique study dates for a user (used for streak calculation).
 * @returns {string[]} Array of 'YYYY-MM-DD' strings
 */
export async function getActiveDates(userId) {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('study_date')
    .eq('user_id', userId);
  if (error) return [];
  return [...new Set((data || []).map(s => s.study_date))];
}

// ─── Session Management ────────────────────────────────────────────────────────

/**
 * Save a completed study session to Supabase.
 * Both sessionStart and sessionEnd must be ISO strings.
 * Sessions shorter than 1 minute are silently ignored.
 */
export async function saveStudySession({ userId, enrollmentId, courseTitle, lessonId, sessionStart, sessionEnd }) {
  const durationMs = new Date(sessionEnd) - new Date(sessionStart);
  if (durationMs < 60000) return; // ignore sessions < 1 minute

  const { error } = await supabase.from('study_sessions').insert({
    user_id: userId,
    enrollment_id: enrollmentId,
    course_title: courseTitle,
    lesson_id: lessonId || null,
    session_start: sessionStart,
    session_end: sessionEnd,
  });
  if (error) console.error('[studyService] saveStudySession:', error.message);
}

/**
 * Total study hours per course title for a user (all time).
 * Returns { [courseTitle]: totalHours }
 */
export async function getCourseStudyTime(userId) {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('course_title, total_hours')
    .eq('user_id', userId);

  if (error) { console.error('[studyService] getCourseStudyTime:', error.message); return {}; }

  const map = {};
  (data || []).forEach(s => {
    if (!map[s.course_title]) map[s.course_title] = 0;
    map[s.course_title] += Number(s.total_hours) || 0;
  });
  return map;
}

/**
 * Get advanced analytics for the user (Peak Time, Course Affinity, Weekend Ratio).
 */
export async function getAdvancedAnalytics(userId, days = 30) {
  const from = new Date();
  from.setDate(from.getDate() - days + 1);
  from.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('study_sessions')
    .select('course_title, total_hours, session_start, study_date')
    .eq('user_id', userId)
    .gte('study_date', from.toISOString().split('T')[0]);

  if (error) return { peakTime: 'N/A', weekendRatio: { weekday: 0, weekend: 0 }, affinity: [] };

  const sessions = data || [];

  // 1. Computations
  const timeBuckets = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
  let weekendHours = 0;
  let weekdayHours = 0;
  const courseMap = {};

  sessions.forEach(s => {
    if (!s.session_start) return;
    const d = new Date(s.session_start);
    const hour = d.getHours();
    const day = d.getDay();
    const hoursLog = Number(s.total_hours) || 0;

    // Time of day
    if (hour >= 5 && hour < 12) timeBuckets.Morning += hoursLog;
    else if (hour >= 12 && hour < 17) timeBuckets.Afternoon += hoursLog;
    else if (hour >= 17 && hour < 22) timeBuckets.Evening += hoursLog;
    else timeBuckets.Night += hoursLog;

    // Weekend vs Weekday
    if (day === 0 || day === 6) weekendHours += hoursLog;
    else weekdayHours += hoursLog;

    // Affinity
    if (!courseMap[s.course_title]) courseMap[s.course_title] = { count: 0, hours: 0 };
    courseMap[s.course_title].count += 1;
    courseMap[s.course_title].hours += hoursLog;
  });

  const totalHrs = weekendHours + weekdayHours;
  const weekendRatio = totalHrs > 0 
    ? { weekday: Math.round((weekdayHours / totalHrs) * 100), weekend: Math.round((weekendHours / totalHrs) * 100) }
    : { weekday: 0, weekend: 0 };

  const peakTimeEntry = Object.entries(timeBuckets).sort((a, b) => b[1] - a[1])[0];
  const peakTime = peakTimeEntry && peakTimeEntry[1] > 0 ? peakTimeEntry[0] : 'N/A';

  // Course Affinity (Ranked by count of sessions, then hours)
  const affinity = Object.entries(courseMap)
    .sort((a, b) => b[1].count - a[1].count || b[1].hours - a[1].hours)
    .map(([title, stats], idx) => {
      let label = 'Occasional';
      if (idx === 0 && stats.count >= 2) label = 'Loved ❤️';
      else if (stats.count >= 4) label = 'Consistent 🔥';
      return { title, ...stats, label };
    });

  return { peakTime, weekendRatio, affinity };
}
/**
 * Build Chart.js config from aggregated data rows.
 * Returns { labels, datasets, tooltipMap }
 * tooltipMap: { [label]: { totalMinutes, courses: [{course, minutes}] } }
 */
export function buildChartConfig(data) {
  const COLORS = ['#0000FF', '#800080', '#FFA500', '#10b981', '#ef4444'];

  const labels = data.map(d => d.label);

  // Collect all unique courses across all data points
  const allCourses = [];
  data.forEach(d => {
    Object.keys(d.courses).forEach(c => {
      if (!allCourses.includes(c)) allCourses.push(c);
    });
  });

  // Build tooltip map for each label
  const tooltipMap = {};
  data.forEach((d, i) => {
    tooltipMap[labels[i]] = {
      totalMinutes: d.totalMinutes,
      courses: Object.entries(d.courses)
        .map(([course, minutes]) => ({ course, minutes }))
        .sort((a, b) => b.minutes - a.minutes),
    };
  });

  // Build datasets — one per course (up to 5), or a single "Study Hours" if no sessions
  let datasets;
  if (allCourses.length === 0) {
    datasets = [{
      label: 'Study Hours',
      data: data.map(() => 0),
      borderColor: '#0000FF',
      backgroundColor: 'rgba(0,0,255,0.1)',
      fill: false,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
    }];
  } else {
    datasets = allCourses.slice(0, 5).map((course, i) => ({
      label: course,
      data: data.map(d => parseFloat(((d.courses[course] || 0) / 60).toFixed(2))),
      borderColor: COLORS[i % COLORS.length],
      backgroundColor: COLORS[i % COLORS.length] + '1A',
      fill: false,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 7,
    }));
  }

  return { labels, datasets, tooltipMap };
}
