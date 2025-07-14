
export interface Subject {
  id: string;
  code: string;
  abbreviation: string;
  fullName: string;
  type: 'Theory' | 'Lab' | 'Seminar' | 'Library' | 'SC' | 'Sports' | 'Audit';
  weeklyHours: number;
}

export interface Faculty {
  id: string;
  name: string;
  assignedSubjects: string[];
}

export interface TimetableSlot {
  day: string;
  period: number | string;
  subjectId: string;
  facultyId?: string;
}

export interface GeneratedTimetable {
  schedule: Record<string, TimetableSlot>;
  metadata: {
    department: string;
    year: string;
    section: string;
    generatedAt: string;
  };
}

export function generateTimetable(
  subjects: Subject[],
  faculty: Faculty[],
  config: { department: string; year: string; section: string }
): GeneratedTimetable {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = [1, 2, 3, 4, 5, 6, 7]; // Excluding lunch
  const schedule: Record<string, TimetableSlot> = {};

  // Initialize tracking arrays
  const usedSlots = new Set<string>();
  const facultySchedule: Record<string, Set<string>> = {};
  const subjectInstances: Record<string, number> = {};

  // Initialize faculty schedules
  faculty.forEach(f => {
    facultySchedule[f.id] = new Set();
  });

  // Count required instances for each subject
  subjects.forEach(subject => {
    subjectInstances[subject.id] = subject.weeklyHours;
  });

  // Constraint: No more than 2 consecutive theory classes
  const isConsecutiveTheoryViolation = (day: string, period: number, subjectType: string): boolean => {
    if (subjectType !== 'Theory') return false;
    
    const prevSlot1 = schedule[`${day}-${period - 1}`];
    const prevSlot2 = schedule[`${day}-${period - 2}`];
    
    if (prevSlot1 && prevSlot2) {
      const prevSubject1 = subjects.find(s => s.id === prevSlot1.subjectId);
      const prevSubject2 = subjects.find(s => s.id === prevSlot2.subjectId);
      
      return prevSubject1?.type === 'Theory' && prevSubject2?.type === 'Theory';
    }
    
    return false;
  };

  // Helper function to find faculty for a subject
  const getFacultyForSubject = (subjectId: string): string | undefined => {
    const facultyMember = faculty.find(f => f.assignedSubjects.includes(subjectId));
    return facultyMember?.id;
  };

  // Helper function to check if faculty is available
  const isFacultyAvailable = (facultyId: string, slotKey: string): boolean => {
    return !facultySchedule[facultyId]?.has(slotKey);
  };

  // Sort subjects by priority (Labs first, then special sessions, then theory)
  const sortedSubjects = [...subjects].sort((a, b) => {
    const priority = { Lab: 0, Seminar: 1, Library: 2, SC: 3, Sports: 4, Audit: 5, Theory: 6 };
    return (priority[a.type] || 10) - (priority[b.type] || 10);
  });

  // Schedule subjects
  sortedSubjects.forEach(subject => {
    let remainingHours = subject.weeklyHours;
    const facultyId = getFacultyForSubject(subject.id);

    while (remainingHours > 0) {
      let scheduled = false;

      // Try to schedule in each day
      for (const day of days) {
        if (scheduled) break;

        // For labs, try to find consecutive slots
        if (subject.type === 'Lab' && remainingHours >= 2) {
          for (let period = 1; period <= 6; period++) {
            const slot1 = `${day}-${period}`;
            const slot2 = `${day}-${period + 1}`;

            if (!usedSlots.has(slot1) && !usedSlots.has(slot2) &&
                (!facultyId || (isFacultyAvailable(facultyId, slot1) && isFacultyAvailable(facultyId, slot2)))) {
              
              // Schedule consecutive lab periods
              schedule[slot1] = { day, period, subjectId: subject.id, facultyId };
              schedule[slot2] = { day, period: period + 1, subjectId: subject.id, facultyId };
              
              usedSlots.add(slot1);
              usedSlots.add(slot2);
              
              if (facultyId) {
                facultySchedule[facultyId].add(slot1);
                facultySchedule[facultyId].add(slot2);
              }
              
              remainingHours -= 2;
              scheduled = true;
              break;
            }
          }
        }

        // Schedule single periods
        if (!scheduled) {
          for (const period of periods) {
            const slotKey = `${day}-${period}`;

            if (usedSlots.has(slotKey)) continue;
            if (facultyId && !isFacultyAvailable(facultyId, slotKey)) continue;
            if (isConsecutiveTheoryViolation(day, period, subject.type)) continue;

            // Special constraints for certain subjects
            if (subject.type === 'Seminar' && (day === 'Monday' || day === 'Tuesday')) continue;
            if (subject.type === 'Sports' && period > 6) continue;
            if (subject.type === 'Library' && period <= 2) continue;

            // Schedule the subject
            schedule[slotKey] = { day, period, subjectId: subject.id, facultyId };
            usedSlots.add(slotKey);
            
            if (facultyId) {
              facultySchedule[facultyId].add(slotKey);
            }
            
            remainingHours--;
            scheduled = true;
            break;
          }
        }

        if (scheduled) break;
      }

      // If we couldn't schedule, break to avoid infinite loop
      if (!scheduled) {
        console.warn(`Could not schedule remaining ${remainingHours} hours for ${subject.fullName}`);
        break;
      }
    }
  });

  return {
    schedule,
    metadata: {
      department: config.department,
      year: config.year,
      section: config.section,
      generatedAt: new Date().toISOString()
    }
  };
}

// Utility function to validate timetable
export function validateTimetable(timetable: GeneratedTimetable): string[] {
  const errors: string[] = [];
  const facultyConflicts = new Map<string, string[]>();

  Object.entries(timetable.schedule).forEach(([slotKey, slot]) => {
    if (slot.facultyId) {
      if (!facultyConflicts.has(slot.facultyId)) {
        facultyConflicts.set(slot.facultyId, []);
      }
      facultyConflicts.get(slot.facultyId)!.push(slotKey);
    }
  });

  // Check for faculty conflicts (same faculty in multiple slots at same time)
  facultyConflicts.forEach((slots, facultyId) => {
    const timeSlots = new Set();
    slots.forEach(slot => {
      if (timeSlots.has(slot)) {
        errors.push(`Faculty conflict detected for faculty ${facultyId} at ${slot}`);
      }
      timeSlots.add(slot);
    });
  });

  return errors;
}
