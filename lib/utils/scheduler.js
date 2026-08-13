import coursesData from '../../public/data/real_courses_data.json';

// Fixed time slots for spacing
export const TIME_SLOTS = {
  Casual: ['10:00 AM - 11:30 AM', '03:00 PM - 04:30 PM'],
  Moderate: ['09:30 AM - 11:00 AM', '01:30 PM - 03:00 PM', '05:00 PM - 06:30 PM', '08:00 PM - 09:30 PM'],
  Intensive: ['09:00 AM - 10:00 AM', '11:00 AM - 12:00 PM', '02:00 PM - 03:00 PM', '04:00 PM - 05:00 PM', '07:00 PM - 08:00 PM', '09:00 PM - 10:00 PM']
};

export const TAG_COLORS = {
  Lecture: '#3a8aff',
  Quiz: '#f57c00',
  Revision: '#ab47bc',
  Assignment: '#43a047'
};

// Helper: Format date
export function toDateStr(dateObj) {
  const yr = dateObj.getFullYear();
  const mo = dateObj.getMonth() + 1;
  const day = dateObj.getDate();
  return `${yr}-${String(mo).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Helper: Hash string to color
export function getCourseColor(subjectCode) {
  if (!subjectCode) return '#3a8aff';
  const colors = ['#e53935', '#d81b60', '#8e24aa', '#5e35b1', '#3949ab', '#1e88e5', '#039be5', '#00acc1', '#00897b', '#43a047', '#f4511e'];
  let hash = 0;
  for (let i = 0; i < subjectCode.length; i++) hash = subjectCode.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function generateDynamicSchedule(enrollments, pace, startDateStr, completedTasksList) {
  const scheduleMap = {};
  const coursesQueues = [];

  // 1. Build Progressive Queues for each course
  enrollments.forEach(enrollment => {
    const course = coursesData.find(
      c => c.course_name === enrollment.course_title || c.subject_code === enrollment.category
    );
    if (!course || !course.modules) return;

    let activeModuleIdx = 0;
    
    // Find the first module that isn't fully completed
    for (let i = 0; i < course.modules.length; i++) {
      const mod = course.modules[i];
      const allTopicsCompleted = mod.topics?.every(t => completedTasksList.includes(`task-${course.subject_code}-${t}`));
      if (!allTopicsCompleted) {
        activeModuleIdx = i;
        break;
      }
    }

    // Only load topics from Active Module and Active + 1 (Progressive Unlocking)
    const allowedModules = course.modules.slice(activeModuleIdx, activeModuleIdx + 2);
    const courseQueue = [];

    allowedModules.forEach((mod, modOffset) => {
      if (mod.topics) {
        mod.topics.forEach(topic => {
          const taskId = `task-${course.subject_code}-${topic}`;
          if (!completedTasksList.includes(taskId)) {
            courseQueue.push({
              id: taskId,
              course_title: course.course_name,
              subject_code: course.subject_code,
              module_name: mod.title,
              topic: topic,
              type: 'Lecture',
              course_color: getCourseColor(course.subject_code)
            });
          }
        });
        
        // Inject a Module Quiz after the module topics
        const quizId = `quiz-${course.subject_code}-${mod.title}`;
        if (!completedTasksList.includes(quizId)) {
          courseQueue.push({
            id: quizId,
            course_title: course.course_name,
            subject_code: course.subject_code,
            module_name: mod.title,
            topic: `Module ${activeModuleIdx + modOffset + 1} Assessment`,
            type: 'Quiz',
            course_color: getCourseColor(course.subject_code)
          });
        }
      }
    });

    if (courseQueue.length > 0) coursesQueues.push(courseQueue);
  });

  const tasksPerDay = TIME_SLOTS[pace].length;
  let currentDate = new Date(startDateStr);
  currentDate.setHours(0,0,0,0);
  
  // 2. Interleaved Round-Robin Scheduling
  let safety = 0;
  while (coursesQueues.some(q => q.length > 0) && safety < 365) {
    safety++;
    const dateStr = toDateStr(currentDate);
    scheduleMap[dateStr] = [];
    
    const dayOfWeek = currentDate.getDay(); // 0 = Sun, 6 = Sat
    
    // Weekend Revision Logic
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      scheduleMap[dateStr].push({
        id: `rev-${dateStr}`,
        course_title: 'Weekly Consolidation',
        subject_code: 'REV',
        module_name: 'Spaced Repetition',
        topic: 'Review concepts learned this week',
        type: 'Revision',
        time_slot: '10:00 AM - 12:00 PM',
        is_completed: completedTasksList.includes(`rev-${dateStr}`),
        course_color: TAG_COLORS.Revision
      });
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    // Weekday Interleaved Logic
    let slotsUsed = 0;
    for (let i = 0; i < coursesQueues.length; i++) {
      if (slotsUsed >= tasksPerDay) break;
      
      const queue = coursesQueues[i];
      if (queue.length > 0) {
        const task = queue.shift(); // pop from front
        scheduleMap[dateStr].push({
          ...task,
          time_slot: TIME_SLOTS[pace][slotsUsed],
          is_completed: false
        });
        slotsUsed++;
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return scheduleMap;
}
