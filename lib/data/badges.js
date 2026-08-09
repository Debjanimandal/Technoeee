export const BADGES = [
  // ── COURSE BADGES (8) ──
  {
    id: 'course-1',
    title: 'Automata Master',
    description: 'Successfully complete the Automata Theory & Compiler Design course.',
    category: 'Course Completion',
    rarity: 'Rare',
    icon: 'BrainCircuit',
    color: '#3b82f6', // blue
    check: (data) => data.enrollments.some(e => e.course_id === 'TIU-UCS-T351' && e.progress >= 100)
  },
  {
    id: 'course-2',
    title: 'C++ Specialist',
    description: 'Successfully complete the Object Oriented Programming using C++ course.',
    category: 'Course Completion',
    rarity: 'Rare',
    icon: 'Code2',
    color: '#3b82f6',
    check: (data) => data.enrollments.some(e => e.course_id === 'TIU-UCS-T214' && e.progress >= 100)
  },
  {
    id: 'course-3',
    title: 'Network Ninja',
    description: 'Successfully complete the Computer Network course.',
    category: 'Course Completion',
    rarity: 'Rare',
    icon: 'Network',
    color: '#3b82f6',
    check: (data) => data.enrollments.some(e => e.course_id === 'TIU-UCS-T304' && e.progress >= 100)
  },
  {
    id: 'course-4',
    title: 'Architecture Pro',
    description: 'Successfully complete the Computer Organization and Architecture course.',
    category: 'Course Completion',
    rarity: 'Rare',
    icon: 'Cpu',
    color: '#3b82f6',
    check: (data) => data.enrollments.some(e => e.course_id === 'TIU-PC-UCS-T22101' && e.progress >= 100)
  },
  {
    id: 'course-5',
    title: 'ML Pioneer',
    description: 'Successfully complete the Machine Learning course.',
    category: 'Course Completion',
    rarity: 'Rare',
    icon: 'Bot',
    color: '#3b82f6',
    check: (data) => data.enrollments.some(e => e.course_id === 'TIU-UCS-T451' && e.progress >= 100)
  },
  {
    id: 'course-6',
    title: 'Algorithm Ace',
    description: 'Successfully complete the Design and Analysis of Algorithm course.',
    category: 'Course Completion',
    rarity: 'Rare',
    icon: 'GitMerge',
    color: '#3b82f6',
    check: (data) => data.enrollments.some(e => e.course_id === 'TIU-UCS-T321' && e.progress >= 100)
  },
  {
    id: 'course-7',
    title: 'Database Guru',
    description: 'Successfully complete the Database Management Systems course.',
    category: 'Course Completion',
    rarity: 'Rare',
    icon: 'Database',
    color: '#3b82f6',
    check: (data) => data.enrollments.some(e => e.course_id === 'TIU-UCS-T301' && e.progress >= 100)
  },
  {
    id: 'course-8',
    title: 'Web Dev Wizard',
    description: 'Successfully complete the Web Technologies course.',
    category: 'Course Completion',
    rarity: 'Rare',
    icon: 'Globe',
    color: '#3b82f6',
    check: (data) => data.enrollments.some(e => e.course_id === 'TIU-UCS-T402' && e.progress >= 100)
  },
  {
    id: 'course-9',
    title: 'AI Pioneer',
    description: 'Successfully complete the Artificial Intelligence course.',
    category: 'Course Completion',
    rarity: 'Rare',
    icon: 'BrainCog',
    color: '#3b82f6',
    check: (data) => data.enrollments.some(e => e.course_id === 'TIU-UCS-T350' && e.progress >= 100)
  },

  // ── HABIT & STREAK BADGES (15) ──
  {
    id: 'habit-1',
    title: 'Fast Starter',
    description: 'Enroll in at least 5 different courses to kickstart your learning journey.',
    category: 'Engagement',
    rarity: 'Common',
    icon: 'Rocket',
    color: '#10b981', // green
    check: (data) => data.uniqueEnrollments >= 5
  },
  {
    id: 'habit-2',
    title: 'First Steps',
    description: 'Complete your first hour of studying on the platform.',
    category: 'Engagement',
    rarity: 'Common',
    icon: 'Footprints',
    color: '#10b981',
    check: (data) => data.totalHours >= 1
  },
  {
    id: 'habit-3',
    title: 'Consistent Learner',
    description: 'Maintain a 7-day study streak (or 7 total active days).',
    category: 'Consistency',
    rarity: 'Moderate',
    icon: 'Flame',
    color: '#f59e0b', // orange
    check: (data) => data.activeDays >= 7
  },
  {
    id: 'habit-4',
    title: 'Focused Mind',
    description: 'Complete a single deep-focus study session lasting over 2 hours.',
    category: 'Focus',
    rarity: 'Moderate',
    icon: 'Target',
    color: '#f59e0b',
    check: (data) => data.longestSession >= 120
  },
  {
    id: 'habit-5',
    title: 'Halfway There',
    description: 'Reach 50% progress in any enrolled course.',
    category: 'Milestone',
    rarity: 'Moderate',
    icon: 'Battery',
    color: '#f59e0b',
    check: (data) => data.enrollments.some(e => e.progress >= 50)
  },
  {
    id: 'habit-6',
    title: 'Early Bird',
    description: 'Your peak productivity time is in the morning.',
    category: 'Habit',
    rarity: 'Moderate',
    icon: 'Sunrise',
    color: '#f59e0b',
    check: (data) => data.peakTime === 'Morning'
  },
  {
    id: 'habit-7',
    title: 'Night Owl',
    description: 'Your peak productivity time is during the night.',
    category: 'Habit',
    rarity: 'Moderate',
    icon: 'Moon',
    color: '#f59e0b',
    check: (data) => data.peakTime === 'Night'
  },
  {
    id: 'habit-8',
    title: 'Weekend Warrior',
    description: 'More than 50% of your study time occurs on the weekends.',
    category: 'Habit',
    rarity: 'Moderate',
    icon: 'Tent',
    color: '#f59e0b',
    check: (data) => data.weekendRatio > 50
  },
  {
    id: 'habit-9',
    title: 'Speed Reader',
    description: 'Make at least 20% progress across 5 different subjects.',
    category: 'Engagement',
    rarity: 'Moderate',
    icon: 'Zap',
    color: '#f59e0b',
    check: (data) => data.enrollments.filter(e => e.progress >= 20).length >= 5
  },
  {
    id: 'habit-10',
    title: 'Multitasker',
    description: 'Log at least 5 hours of study time across 3 different subjects.',
    category: 'Dedication',
    rarity: 'Rare',
    icon: 'Layers',
    color: '#8b5cf6', // purple
    check: (data) => Object.values(data.courseTime).filter(h => h >= 5).length >= 3
  },
  {
    id: 'habit-11',
    title: 'Consistency King',
    description: 'Log 30 total active study days on the platform.',
    category: 'Consistency',
    rarity: 'Rare',
    icon: 'Crown',
    color: '#8b5cf6',
    check: (data) => data.activeDays >= 30
  },
  {
    id: 'habit-12',
    title: 'Dedicated Student',
    description: 'Accumulate a massive 50 hours of total study time.',
    category: 'Dedication',
    rarity: 'Rare',
    icon: 'BookOpenCheck',
    color: '#8b5cf6',
    check: (data) => data.totalHours >= 50
  },
  {
    id: 'habit-13',
    title: 'Perfectionist',
    description: 'Fully complete a course with 100% progress and high affinity.',
    category: 'Milestone',
    rarity: 'Rare',
    icon: 'Medal',
    color: '#8b5cf6',
    check: (data) => data.enrollments.some(e => e.progress >= 100)
  },
  {
    id: 'habit-14',
    title: 'Century Club',
    description: 'Reach 100 hours of total study time all-time.',
    category: 'Dedication',
    rarity: 'Epic',
    icon: 'Trophy',
    color: '#e11d48', // red
    check: (data) => data.totalHours >= 100
  },
  {
    id: 'habit-15',
    title: 'Marathon Scholar',
    description: 'Study for more than 10 hours in a single session/day.',
    category: 'Focus',
    rarity: 'Epic',
    icon: 'Hourglass',
    color: '#e11d48',
    check: (data) => data.longestSession >= 600
  }
];

export const RARITY_COLORS = {
  'Common': { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
  'Moderate': { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
  'Rare': { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
  'Epic': { bg: '#fff1f2', text: '#e11d48', border: '#fecdd3' }
};
