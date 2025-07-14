import { Subject, Faculty } from '@/hooks/useSupabaseData';
import { GenerationSettings, TimetableGenerationResult } from '@/types/timetable';
import { isMandatorySubject } from './mandatorySubjects';

// Utility to shuffle an array
function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function generateIntelligentTimetable(
  subjects: Subject[], 
  faculty: Faculty[], 
  settings: GenerationSettings,
  selectedDepartment: string
): TimetableGenerationResult {
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const timeSlots = [
    '9:00 to 9:55',
    '9:55 to 10:50', 
    '11:05 to 12:00',
    '12:00 to 12:55',
    '1:55 to 2:50',
    '2:50 to 3:45',
    '3:55 to 4:50'
  ];

  const timetable: any = {};
  const facultyWorkload: { [key: string]: number } = {};
  const subjectScheduled: { [key: string]: number } = {};
  const dailyHours: { [key: string]: number } = {};
  const conflicts: string[] = [];
  
  // Enhanced faculty schedule tracking for global conflict detection
  const facultySchedule: { [facultyId: string]: { [day: string]: Set<string> } } = {};
  
  // Initialize structures safely
  days.forEach(day => {
    timetable[day] = {};
    dailyHours[day] = 0;
  });

  // Initialize faculty workload and schedule tracking
  if (faculty && Array.isArray(faculty)) {
    faculty.forEach(f => {
      if (f && f.id) {
        facultyWorkload[f.id] = 0;
        facultySchedule[f.id] = {};
        days.forEach(day => {
          facultySchedule[f.id][day] = new Set();
        });
      }
    });
  }

  // Initialize subject scheduling safely
  if (subjects && Array.isArray(subjects)) {
    subjects.forEach(s => {
      if (s && s.id) {
        subjectScheduled[s.id] = 0;
      }
    });
  }

  // Return early if no subjects or faculty
  if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
    return {
      timetable,
      conflicts: ['No subjects available for scheduling'],
      stats: {
        totalSlots: days.length * timeSlots.length,
        filledSlots: 0,
        efficiency: 0,
        facultyUtilization: {},
        subjectCoverage: {}
      }
    };
  }

  if (!faculty || !Array.isArray(faculty) || faculty.length === 0) {
    return {
      timetable,
      conflicts: ['No faculty available for scheduling'],
      stats: {
        totalSlots: days.length * timeSlots.length,
        filledSlots: 0,
        efficiency: 0,
        facultyUtilization: {},
        subjectCoverage: {}
      }
    };
  }

  // Enhanced faculty availability checking
  const isFacultyAvailable = (facultyId: string, day: string, slot: string): boolean => {
    return !facultySchedule[facultyId][day].has(slot);
  };

  const markFacultyBusy = (facultyId: string, day: string, slot: string) => {
    facultySchedule[facultyId][day].add(slot);
  };

  // Separate mandatory and regular subjects
  const mandatorySubjects = subjects.filter(s => isMandatorySubject(s));
  const regularSubjects = subjects.filter(s => !isMandatorySubject(s));

  console.log('Mandatory subjects found:', mandatorySubjects.map(s => ({ name: s.name, type: s.subject_type })));
  console.log('Regular subjects found:', regularSubjects.map(s => ({ name: s.name, type: s.subject_type })));

  // Priority-based subject sorting - MANDATORY SUBJECTS FIRST
  let prioritizedSubjects = [
    ...mandatorySubjects.sort((a, b) => {
      const mandatoryOrder = ['library', 'counseling', 'seminar', 'sports'];
      const aOrder = mandatoryOrder.findIndex(keyword => 
        a.name?.toLowerCase().includes(keyword) || a.subject_type?.toLowerCase().includes(keyword)
      );
      const bOrder = mandatoryOrder.findIndex(keyword => 
        b.name?.toLowerCase().includes(keyword) || b.subject_type?.toLowerCase().includes(keyword)
      );
      if (aOrder !== -1 && bOrder !== -1 && aOrder !== bOrder) return aOrder - bOrder;
      return 0;
    }),
    ...regularSubjects.sort((a, b) => {
      const priorityOrder = {
        'Lab': 1, 'lab': 1, 'Practical': 2, 'practical': 2,
        'Tutorial': 3, 'tutorial': 3, 'Theory': 4, 'theory': 4
      };
      const aPriority = priorityOrder[a.subject_type as keyof typeof priorityOrder] || 5;
      const bPriority = priorityOrder[b.subject_type as keyof typeof priorityOrder] || 5;
      if (aPriority !== bPriority) return aPriority - bPriority;
      const aHours = Number(a.hours_per_week) || 0;
      const bHours = Number(b.hours_per_week) || 0;
      return bHours - aHours;
    })
  ];
  // Shuffle the prioritized subjects for randomization
  prioritizedSubjects = shuffleArray(prioritizedSubjects);

  // Enhanced intelligent scheduling with strict mandatory subject handling
  let maxAttempts = 3000; // Increased for more complex mandatory scheduling
  let attempts = 0;

  console.log('Starting timetable generation with prioritized subjects:', prioritizedSubjects.map(s => ({
    name: s.name,
    type: s.subject_type,
    hours: s.hours_per_week,
    mandatory: isMandatorySubject(s)
  })));

  while (attempts < maxAttempts) {
    let scheduled = false;
    
    for (const subject of prioritizedSubjects) {
      if (!subject || !subject.id) continue;
      
      const subjectHours = Number(subject.hours_per_week) || 0;
      const currentScheduled = subjectScheduled[subject.id] || 0;
      if (currentScheduled >= subjectHours) continue;

      const isMandatory = isMandatorySubject(subject);

      // Find suitable faculty
      const suitableFaculty = faculty.filter(f => 
        f && f.id && f.department_id === selectedDepartment &&
        (facultyWorkload[f.id] || 0) < (Number(f.max_hours_per_week) || 20) &&
        (f.specialization?.some(spec => 
          subject.name?.toLowerCase().includes(spec.toLowerCase()) ||
          subject.code?.toLowerCase().includes(spec.toLowerCase()) ||
          spec.toLowerCase().includes(subject.subject_type?.toLowerCase()) ||
          (isMandatory && (spec.toLowerCase().includes('general') || spec.toLowerCase().includes('all')))
        ) || !f.specialization || f.specialization.length === 0)
      );

      if (suitableFaculty.length === 0) {
        const fallbackFaculty = faculty.filter(f => 
          f && f.id && f.department_id === selectedDepartment &&
          (facultyWorkload[f.id] || 0) < (Number(f.max_hours_per_week) || 20)
        );
        
        if (fallbackFaculty.length > 0) {
          suitableFaculty.push(fallbackFaculty[0]);
        } else {
          conflicts.push(`No available faculty for ${subject.name || subject.code} (${isMandatory ? 'MANDATORY' : 'Regular'})`);
          continue;
        }
      }

      // Select faculty with least workload
      const selectedFaculty = suitableFaculty.reduce((prev, curr) => 
        (facultyWorkload[prev.id] || 0) < (facultyWorkload[curr.id] || 0) ? prev : curr
      );

      // STRICT scheduling rules - Schedule multiple periods for subjects with hours > 1
      const periodsToSchedule = subjectHours - currentScheduled;
      let periodsScheduledThisRound = 0;

      // LAB/Practical: schedule as a block, only one lab per day
      const isLab = subject.subject_type?.toLowerCase().includes('lab') || subject.subject_type?.toLowerCase().includes('practical');
      if (isLab && periodsToSchedule > 0) {
        let labScheduled = false;
        for (const day of days) {
          // Only one lab per day
          const dayHasLab = Object.values(timetable[day]).some(slot => (slot && (slot as any).type?.toLowerCase().includes('lab') || (slot && (slot as any).type?.toLowerCase().includes('practical'))));
          if (dayHasLab) continue;
          const maxDaily = Number(settings.maxDailyHours) || 7;
          const currentDayHours = dailyHours[day] || 0;
          if (currentDayHours + periodsToSchedule > maxDaily) continue;
          // Find a block of consecutive free slots
          for (let startIdx = 0; startIdx <= timeSlots.length - periodsToSchedule; startIdx++) {
            let blockFree = true;
            for (let offset = 0; offset < periodsToSchedule; offset++) {
              const slot = timeSlots[startIdx + offset];
              if (timetable[day][slot]) {
                blockFree = false;
                break;
              }
            }
            if (!blockFree) continue;
            // Check faculty availability for all slots
            let facultyAvailable = true;
            for (let offset = 0; offset < periodsToSchedule; offset++) {
              const slot = timeSlots[startIdx + offset];
              if (!isFacultyAvailable(selectedFaculty.id, day, slot)) {
                facultyAvailable = false;
                break;
              }
            }
            if (!facultyAvailable) continue;
            // Schedule the lab block
            for (let offset = 0; offset < periodsToSchedule; offset++) {
              const slot = timeSlots[startIdx + offset];
              timetable[day][slot] = {
                subject: subject.name,
                subjectCode: subject.code,
                faculty: selectedFaculty.name,
                type: subject.subject_type,
                isMandatory: isMandatory
              };
              markFacultyBusy(selectedFaculty.id, day, slot);
              subjectScheduled[subject.id] = (subjectScheduled[subject.id] || 0) + 1;
              facultyWorkload[selectedFaculty.id] = (facultyWorkload[selectedFaculty.id] || 0) + 1;
              dailyHours[day] = (dailyHours[day] || 0) + 1;
              periodsScheduledThisRound++;
              scheduled = true;
            }
            labScheduled = true;
            break;
          }
          if (labScheduled) break;
        }
        continue; // Skip the rest of the loop for labs
      }
      
      for (let periodAttempt = 0; periodAttempt < periodsToSchedule && periodAttempt < 3; periodAttempt++) {
        const candidateSlots = [];
        
        for (const day of days) {
          // MANDATORY SUBJECTS: ONLY Saturday for Counseling, Library, Seminar
          const isCounseling = subject.name?.toLowerCase().includes('counseling');
          const isLibrary = subject.name?.toLowerCase().includes('library');
          const isSeminar = subject.name?.toLowerCase().includes('seminar');
          const isSports = subject.name?.toLowerCase().includes('sports');
          const isFirstYear = String(subject.year_id) === '1';

          // Counseling, Library, Seminar: Only Saturday
          if ((isCounseling || isLibrary || isSeminar) && day !== 'SAT') {
            continue;
          }
          // Sports (1st year): Only Mon-Fri
          if (isSports && isFirstYear && day === 'SAT') {
            continue;
          }
          // Regular subjects: Not Saturday (preserve for mandatory),
          // BUT allow regular subjects in first two periods on Saturday
          if (!isMandatory && day === 'SAT') {
            continue;
          }

          const maxDaily = Number(settings.maxDailyHours) || 7;
          const currentDayHours = dailyHours[day] || 0;
          if (currentDayHours >= maxDaily) continue;

          for (let slotIndex = 0; slotIndex < timeSlots.length; slotIndex++) {
            const slot = timeSlots[slotIndex];
            // Strict Saturday slot enforcement
            if (day === 'SAT') {
              // Only regular subjects in periods 1 and 2
              if (slotIndex < 2 && isMandatory) {
                continue;
              }
              if (slotIndex < 2 && !isMandatory && (isCounseling || isLibrary || isSeminar)) {
                continue;
              }
              // Only mandatory subjects in periods 4–7
              if (slotIndex >= 3 && !isMandatory) {
                continue;
              }
              if (slotIndex >= 3 && isMandatory === false) {
                continue;
              }
              // Prevent labs from occupying Saturday periods 4–7
              if (slotIndex >= 3 && isLab && !isMandatory) {
                continue;
              }
            }
            // Counseling, Library, Seminar: Only after 3rd period on Saturday
            if ((isCounseling || isLibrary || isSeminar) && day === 'SAT' && slotIndex < 3) {
              continue;
            }
            // Regular subjects: Only allow in first two periods on Saturday
            if (!isMandatory && day === 'SAT' && slotIndex >= 2) {
              continue;
            }
            
            // Check slot availability
            if (timetable[day][slot]) continue;
            
            // Check faculty availability
            if (!isFacultyAvailable(selectedFaculty.id, day, slot)) {
              continue;
            }
            
            // Scoring system with EXTREME priority for mandatory subjects
            let score = 50;
            
            // ABSOLUTE MAXIMUM priority for mandatory subjects on Saturday
            if (isMandatory && day === 'SAT') {
              score += 10000; // Extremely high priority
              console.log(`HIGH PRIORITY: Mandatory subject ${subject.name} gets score ${score} on ${day} at ${slot}`);
            }
            
            // Apply regular constraints for non-mandatory subjects
            if (!isMandatory) {
              // Morning preference for labs/practicals
              if (settings.prioritizeMorningLabs && 
                  (subject.subject_type === 'Lab' || subject.subject_type === 'lab' || 
                   subject.subject_type === 'Practical' || subject.subject_type === 'practical') && 
                  slotIndex >= 4) {
                score -= 30;
              }
              
              // Avoid consecutive theory classes
              if (settings.avoidConsecutiveTheory && 
                  (subject.subject_type === 'Theory' || subject.subject_type === 'theory')) {
                const prevSlot = slotIndex > 0 ? timeSlots[slotIndex - 1] : null;
                const nextSlot = slotIndex < timeSlots.length - 1 ? timeSlots[slotIndex + 1] : null;
                
                if (prevSlot && timetable[day][prevSlot]?.type === 'Theory') score -= 40;
                if (nextSlot && timetable[day][nextSlot]?.type === 'Theory') score -= 40;
              }
              
              // Balance across days
              score -= currentDayHours * 5;
            }
            
            // Prefer earlier slots for important subjects
            if (subjectHours >= 4 || isMandatory) {
              score += (7 - slotIndex) * 3;
            }
            
            candidateSlots.push({ day, slot, slotIndex, score });
          }
        }
        
        if (candidateSlots.length === 0) {
          if (isMandatory) {
            conflicts.push(`CRITICAL: No Saturday slots available for mandatory subject: ${subject.name || subject.code} (Period ${periodAttempt + 1})`);
            console.error(`CRITICAL: Cannot schedule mandatory subject ${subject.name} period ${periodAttempt + 1} - no Saturday slots available`);
          }
          break; // No more slots available for this subject
        }
        
        // Select best slot based on score (highest first)
        candidateSlots.sort((a, b) => b.score - a.score);
        const selectedSlot = candidateSlots[0];
        
        console.log(`SCHEDULING: ${subject.name} Period ${periodAttempt + 1} (${isMandatory ? 'MANDATORY' : 'regular'}) on ${selectedSlot.day} at ${selectedSlot.slot} with score ${selectedSlot.score}`);
        
        // Schedule single period
        timetable[selectedSlot.day][selectedSlot.slot] = {
          subject: subject.name,
          subjectCode: subject.code,
          faculty: selectedFaculty.name,
          type: subject.subject_type,
          isMandatory: isMandatory
        };
        
        markFacultyBusy(selectedFaculty.id, selectedSlot.day, selectedSlot.slot);
        
        subjectScheduled[subject.id] = (subjectScheduled[subject.id] || 0) + 1;
        facultyWorkload[selectedFaculty.id] = (facultyWorkload[selectedFaculty.id] || 0) + 1;
        dailyHours[selectedSlot.day] = (dailyHours[selectedSlot.day] || 0) + 1;
        periodsScheduledThisRound++;
        scheduled = true;
        
        console.log(`SCHEDULED: ${subject.name} Period ${periodAttempt + 1} on ${selectedSlot.day} at ${selectedSlot.slot} (Total: ${subjectScheduled[subject.id]}/${subjectHours})`);
      }
      
      if (periodsScheduledThisRound > 0) {
        console.log(`Scheduled ${periodsScheduledThisRound} periods for ${subject.name} this round`);
      }
    }
    
    if (!scheduled) {
      console.log('No more subjects could be scheduled, breaking loop');
      break;
    }
    attempts++;
  }

  // Enhanced statistics generation
  const totalSlots = days.length * timeSlots.length;
  let filledSlots = 0;
  let mandatorySlots = 0;
  
  for (const dayKey of Object.keys(timetable)) {
    const dayData = timetable[dayKey];
    if (dayData && typeof dayData === 'object') {
      const daySlots = Object.keys(dayData).length;
      filledSlots += daySlots;
      
      if (dayKey === 'SAT') {
        mandatorySlots = daySlots;
      }
    }
  }
  
  const stats = {
    totalSlots,
    filledSlots,
    mandatorySlots,
    efficiency: filledSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0,
    facultyUtilization: {} as { [key: string]: number },
    subjectCoverage: {} as { [key: string]: number }
  };
  
  // Calculate faculty utilization safely
  if (faculty && Array.isArray(faculty)) {
    faculty.forEach(f => {
      if (f && f.id && f.name) {
        const maxHours = Number(f.max_hours_per_week) || 20;
        const currentWorkload = facultyWorkload[f.id] || 0;
        stats.facultyUtilization[f.name] = maxHours > 0 ? Math.round((currentWorkload / maxHours) * 100) : 0;
      }
    });
  }
  
  // Enhanced subject coverage calculation
  if (subjects && Array.isArray(subjects)) {
    subjects.forEach(s => {
      if (s && s.id && s.name) {
        const subjectHours = Number(s.hours_per_week) || 1;
        const scheduledHours = subjectScheduled[s.id] || 0;
        const coverage = subjectHours > 0 ? Math.round((scheduledHours / subjectHours) * 100) : 0;
        stats.subjectCoverage[s.name] = coverage;
        
        // Add specific conflict for unscheduled mandatory subjects
        if (isMandatorySubject(s) && coverage < 100) {
          conflicts.push(`CRITICAL: Mandatory subject "${s.name}" only ${coverage}% scheduled (${scheduledHours}/${subjectHours} hours)`);
        }
      }
    });
  }

  console.log('FINAL TIMETABLE GENERATION RESULTS:', {
    totalSlots: stats.totalSlots,
    filledSlots: stats.filledSlots,
    mandatorySlots: stats.mandatorySlots,
    efficiency: stats.efficiency,
    conflicts: conflicts.length,
    mandatorySubjectsCount: mandatorySubjects.length,
    saturdaySchedule: timetable['SAT']
  });

  return { timetable, conflicts, stats };
}
