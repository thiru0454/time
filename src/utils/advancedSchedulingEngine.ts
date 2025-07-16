import { Subject, Faculty } from '@/hooks/useSupabaseData';

export interface AdvancedSchedulingSettings {
  // Conflict Resolution
  enableConflictDetection: boolean;
  autoResolveConflicts: boolean;
  maxConflictResolutionAttempts: number;
  
  // Room Assignment
  enableRoomAssignment: boolean;
  prioritizeRoomCapacity: boolean;
  requireEquipmentMatch: boolean;
  
  // Time Slot Optimization
  enableAIOptimization: boolean;
  optimizeForFacultyPreferences: boolean;
  optimizeForStudentLoad: boolean;
  
  // Recurring Events
  enableRecurringEvents: boolean;
  defaultRecurrencePattern: 'weekly' | 'monthly';
  
  // Break Time Management
  enableBreakManagement: boolean;
  minBreakDuration: number; // in minutes
  preferredBreakTimes: string[];
  
  // Faculty Workload
  maxFacultyHoursPerDay: number;
  maxFacultyHoursPerWeek: number;
  balanceFacultyWorkload: boolean;
  
  // General Settings
  maxDailyHours: number;
  avoidConsecutiveTheory: boolean;
  prioritizeMorningLabs: boolean;
}

export interface SchedulingConflict {
  type: 'faculty' | 'room' | 'time' | 'workload' | 'break';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedSubjects: string[];
  affectedFaculty: string[];
  suggestedResolution: string;
  timestamp: Date;
}

export interface RoomAssignment {
  roomId: string;
  roomName: string;
  capacity: number;
  equipment: string[];
  availability: { [day: string]: string[] };
}

export interface BreakTime {
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  type: 'lunch' | 'short' | 'long';
}

export interface OptimizedTimeSlot {
  day: string;
  timeSlot: string;
  score: number;
  reasons: string[];
  conflicts: SchedulingConflict[];
}

export class AdvancedSchedulingEngine {
  private facultySchedule: { [facultyId: string]: { [day: string]: Set<string> } } = {};
  private roomSchedule: { [roomId: string]: { [day: string]: Set<string> } } = {};
  private subjectSchedule: { [subjectId: string]: { [day: string]: Set<string> } } = {};
  private conflicts: SchedulingConflict[] = [];
  private settings: AdvancedSchedulingSettings;

  constructor(settings: AdvancedSchedulingSettings) {
    this.settings = settings;
  }

  /**
   * Initialize scheduling data structures
   */
  initializeScheduling(subjects: Subject[], faculty: Faculty[], rooms: RoomAssignment[]): void {
    // Initialize faculty schedules
    faculty.forEach(f => {
      this.facultySchedule[f.id] = {};
      ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].forEach(day => {
        this.facultySchedule[f.id][day] = new Set();
      });
    });

    // Initialize room schedules
    rooms.forEach(room => {
      this.roomSchedule[room.roomId] = {};
      ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].forEach(day => {
        this.roomSchedule[room.roomId][day] = new Set();
      });
    });

    // Initialize subject schedules
    subjects.forEach(subject => {
      this.subjectSchedule[subject.id] = {};
      ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].forEach(day => {
        this.subjectSchedule[subject.id][day] = new Set();
      });
    });
  }

  /**
   * Detect all types of conflicts
   */
  detectConflicts(
    subjects: Subject[], 
    faculty: Faculty[], 
    rooms: RoomAssignment[]
  ): SchedulingConflict[] {
    this.conflicts = [];
    
    // 1. Faculty Conflict Detection
    this.detectFacultyConflicts(subjects, faculty);
    
    // 2. Room Conflict Detection
    if (this.settings.enableRoomAssignment) {
      this.detectRoomConflicts(subjects, rooms);
    }
    
    // 3. Workload Conflict Detection
    this.detectWorkloadConflicts(faculty);
    
    // 4. Break Time Violations
    if (this.settings.enableBreakManagement) {
      this.detectBreakTimeViolations(subjects);
    }
    
    // 5. Time Slot Conflicts
    this.detectTimeSlotConflicts(subjects);
    
    return this.conflicts;
  }

  /**
   * Detect faculty scheduling conflicts
   */
  private detectFacultyConflicts(subjects: Subject[], faculty: Faculty[]): void {
    const facultyTimeSlots: { [facultyId: string]: { [day: string]: string[] } } = {};
    
    // Collect all faculty assignments
    faculty.forEach(f => {
      facultyTimeSlots[f.id] = {};
      ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].forEach(day => {
        facultyTimeSlots[f.id][day] = [];
      });
    });

    // Check for overlapping time slots
    Object.entries(this.facultySchedule).forEach(([facultyId, days]) => {
      Object.entries(days).forEach(([day, timeSlots]) => {
        const slots = Array.from(timeSlots);
        if (slots.length > 1) {
          // Check for consecutive slots (which is okay) vs overlapping slots
          const sortedSlots = slots.sort();
          for (let i = 0; i < sortedSlots.length - 1; i++) {
            const currentSlot = sortedSlots[i];
            const nextSlot = sortedSlots[i + 1];
            
            // Check if slots overlap (not consecutive)
            if (this.isOverlappingSlots(currentSlot, nextSlot)) {
              this.conflicts.push({
                type: 'faculty',
                severity: 'critical',
                description: `Faculty ${this.getFacultyName(facultyId, faculty)} has overlapping assignments on ${day}`,
                affectedSubjects: this.getSubjectsForFaculty(facultyId, day),
                affectedFaculty: [facultyId],
                suggestedResolution: 'Reschedule one of the conflicting assignments',
                timestamp: new Date()
              });
            }
          }
        }
      });
    });
  }

  /**
   * Detect room assignment conflicts
   */
  private detectRoomConflicts(subjects: Subject[], rooms: RoomAssignment[]): void {
    Object.entries(this.roomSchedule).forEach(([roomId, days]) => {
      Object.entries(days).forEach(([day, timeSlots]) => {
        const slots = Array.from(timeSlots);
        if (slots.length > 1) {
          // Check for room double-booking
          const sortedSlots = slots.sort();
          for (let i = 0; i < sortedSlots.length - 1; i++) {
            const currentSlot = sortedSlots[i];
            const nextSlot = sortedSlots[i + 1];
            
            if (this.isOverlappingSlots(currentSlot, nextSlot)) {
              const roomName = this.getRoomName(roomId, rooms);
              this.conflicts.push({
                type: 'room',
                severity: 'high',
                description: `Room ${roomName} is double-booked on ${day}`,
                affectedSubjects: this.getSubjectsForRoom(roomId, day),
                affectedFaculty: [],
                suggestedResolution: 'Assign different rooms or reschedule conflicting sessions',
                timestamp: new Date()
              });
            }
          }
        }
      });
    });
  }

  /**
   * Detect faculty workload violations
   */
  private detectWorkloadConflicts(faculty: Faculty[]): void {
    faculty.forEach(f => {
      const weeklyHours = this.calculateFacultyWeeklyHours(f.id);
      const maxWeeklyHours = f.max_hours_per_week || this.settings.maxFacultyHoursPerWeek;
      
      if (weeklyHours > maxWeeklyHours) {
        this.conflicts.push({
          type: 'workload',
          severity: 'high',
          description: `Faculty ${f.name} exceeds weekly workload limit (${weeklyHours}/${maxWeeklyHours} hours)`,
          affectedSubjects: this.getAllSubjectsForFaculty(f.id),
          affectedFaculty: [f.id],
          suggestedResolution: 'Reduce faculty workload or redistribute assignments',
          timestamp: new Date()
        });
      }

      // Check daily workload
      ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].forEach(day => {
        const dailyHours = this.calculateFacultyDailyHours(f.id, day);
        if (dailyHours > this.settings.maxFacultyHoursPerDay) {
          this.conflicts.push({
            type: 'workload',
            severity: 'medium',
            description: `Faculty ${f.name} exceeds daily workload limit on ${day} (${dailyHours}/${this.settings.maxFacultyHoursPerDay} hours)`,
            affectedSubjects: this.getSubjectsForFaculty(f.id, day),
            affectedFaculty: [f.id],
            suggestedResolution: 'Redistribute assignments across different days',
            timestamp: new Date()
          });
        }
      });
    });
  }

  /**
   * Detect break time violations
   */
  private detectBreakTimeViolations(subjects: Subject[]): void {
    const timeSlots = [
      '9:00 to 9:55', '9:55 to 10:50', '11:05 to 12:00', '12:00 to 12:55',
      '1:55 to 2:50', '2:50 to 3:45', '3:55 to 4:50'
    ];

    ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].forEach(day => {
      let consecutiveClasses = 0;
      
      for (let i = 0; i < timeSlots.length; i++) {
        const slot = timeSlots[i];
        const hasClass = this.hasClassInSlot(day, slot);
        
        if (hasClass) {
          consecutiveClasses++;
          
          // Check for break violations
          if (consecutiveClasses > 4) { // More than 4 consecutive classes
            this.conflicts.push({
              type: 'break',
              severity: 'medium',
              description: `No break time scheduled after ${consecutiveClasses} consecutive classes on ${day}`,
              affectedSubjects: this.getSubjectsForDay(day),
              affectedFaculty: this.getFacultyForDay(day),
              suggestedResolution: 'Schedule break time between classes',
              timestamp: new Date()
            });
          }
        } else {
          consecutiveClasses = 0;
        }
      }
    });
  }

  /**
   * Detect time slot conflicts
   */
  private detectTimeSlotConflicts(subjects: Subject[]): void {
    // Check for subjects that need consecutive slots but don't have them
    subjects.forEach(subject => {
      if (subject.hours_per_week > 1) {
        const scheduledHours = this.getScheduledHoursForSubject(subject.id);
        if (scheduledHours < subject.hours_per_week) {
          this.conflicts.push({
            type: 'time',
            severity: 'medium',
            description: `Subject ${subject.name} needs ${subject.hours_per_week} hours but only ${scheduledHours} scheduled`,
            affectedSubjects: [subject.id],
            affectedFaculty: [],
            suggestedResolution: 'Schedule remaining hours for this subject',
            timestamp: new Date()
          });
        }
      }
    });
  }

    /**
   * Enhanced auto-resolve conflicts with multiple strategies
   */
  autoResolveConflicts(
    subjects: Subject[], 
    faculty: Faculty[], 
    rooms: RoomAssignment[]
  ): { resolved: boolean; newConflicts: SchedulingConflict[] } {
    console.log('🔧 Starting auto-conflict resolution...');
    
    if (!this.settings.autoResolveConflicts) {
      return { resolved: false, newConflicts: this.conflicts };
    }

    let attempts = 0;
    const maxAttempts = this.settings.maxConflictResolutionAttempts;
    let resolvedCount = 0;
    let newConflicts: SchedulingConflict[] = [];

    while (attempts < maxAttempts && this.conflicts.length > 0) {
      attempts++;
      console.log(`🔄 Resolution attempt ${attempts}/${maxAttempts}, conflicts remaining: ${this.conflicts.length}`);

      // Sort conflicts by severity (critical first)
      const sortedConflicts = [...this.conflicts].sort((a, b) => {
        const severityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });

      let conflictsResolvedThisRound = 0;

      for (const conflict of sortedConflicts) {
        const resolutionResult = this.resolveConflict(conflict, subjects, faculty, rooms);
        
        if (resolutionResult.resolved) {
          conflictsResolvedThisRound++;
          resolvedCount++;
          
          // Remove resolved conflict
          this.conflicts = this.conflicts.filter(c => c !== conflict);
          
          // Add any new conflicts created during resolution
          if (resolutionResult.changes.length > 0) {
            newConflicts.push(...this.detectNewConflictsFromChanges(resolutionResult.changes, subjects, faculty, rooms));
          }
        }
      }

      // If no conflicts were resolved this round, try alternative strategies
      if (conflictsResolvedThisRound === 0) {
        console.log('⚠️ No conflicts resolved this round, trying alternative strategies...');
        
        // Try more aggressive resolution strategies
        const aggressiveResolutions = this.applyAggressiveResolutionStrategies(subjects, faculty, rooms);
        if (aggressiveResolutions > 0) {
          conflictsResolvedThisRound = aggressiveResolutions;
          resolvedCount += aggressiveResolutions;
        }
      }

      // If still no progress, break to avoid infinite loop
      if (conflictsResolvedThisRound === 0) {
        console.log('🛑 No more conflicts can be resolved automatically');
        break;
      }
    }

    console.log(`✅ Auto-resolution completed: ${resolvedCount} conflicts resolved, ${this.conflicts.length} remaining`);
    
    return { 
      resolved: this.conflicts.length === 0, 
      newConflicts: [...this.conflicts, ...newConflicts] 
    };
  }

  /**
   * Resolve a specific conflict
   */
  private resolveConflict(
    conflict: SchedulingConflict, 
    subjects: Subject[], 
    faculty: Faculty[], 
    rooms: RoomAssignment[]
  ): { resolved: boolean; changes: any[] } {
    const changes: any[] = [];

    switch (conflict.type) {
      case 'faculty':
        return this.resolveFacultyConflict(conflict, subjects, faculty);
      
      case 'room':
        return this.resolveRoomConflict(conflict, subjects, rooms);
      
      case 'workload':
        return this.resolveWorkloadConflict(conflict, subjects, faculty);
      
      case 'break':
        return this.resolveBreakConflict(conflict, subjects);
      
      case 'time':
        return this.resolveTimeConflict(conflict, subjects, faculty);
      
      default:
        return { resolved: false, changes: [] };
    }
  }

  /**
   * Resolve faculty conflicts by reassigning to different faculty
   */
  private resolveFacultyConflict(
    conflict: SchedulingConflict, 
    subjects: Subject[], 
    faculty: Faculty[]
  ): { resolved: boolean; changes: any[] } {
    const changes: any[] = [];
    
    // Find alternative faculty for the affected subjects
    conflict.affectedSubjects.forEach(subjectId => {
      const subject = subjects.find(s => s.id === subjectId);
      if (!subject) return;

      const alternativeFaculty = faculty.find(f => 
        f.id !== conflict.affectedFaculty[0] &&
        f.department_id === subject.department_id &&
        this.calculateFacultyWeeklyHours(f.id) < (f.max_hours_per_week || 20)
      );

      if (alternativeFaculty) {
        // Reassign subject to alternative faculty
        changes.push({
          type: 'faculty_reassignment',
          subjectId,
          oldFacultyId: conflict.affectedFaculty[0],
          newFacultyId: alternativeFaculty.id
        });
      }
    });

    return { resolved: changes.length > 0, changes };
  }

  /**
   * Resolve room conflicts by finding alternative rooms
   */
  private resolveRoomConflict(
    conflict: SchedulingConflict, 
    subjects: Subject[], 
    rooms: RoomAssignment[]
  ): { resolved: boolean; changes: any[] } {
    const changes: any[] = [];
    
    // Find alternative rooms with similar capacity
    const affectedRoom = conflict.description.match(/Room (.+?) is/)?.[1];
    if (!affectedRoom) return { resolved: false, changes: [] };

    const currentRoom = rooms.find(r => r.roomName === affectedRoom);
    if (!currentRoom) return { resolved: false, changes: [] };

    const alternativeRooms = rooms.filter(r => 
      r.roomId !== currentRoom.roomId &&
      r.capacity >= currentRoom.capacity * 0.8 // Similar capacity
    );

    if (alternativeRooms.length > 0) {
      const bestAlternative = alternativeRooms.reduce((best, current) => 
        Math.abs(current.capacity - currentRoom.capacity) < Math.abs(best.capacity - currentRoom.capacity) ? current : best
      );

      changes.push({
        type: 'room_reassignment',
        oldRoomId: currentRoom.roomId,
        newRoomId: bestAlternative.roomId,
        reason: 'Conflict resolution'
      });
    }

    return { resolved: changes.length > 0, changes };
  }

  /**
   * Resolve workload conflicts by redistributing assignments
   */
  private resolveWorkloadConflict(
    conflict: SchedulingConflict, 
    subjects: Subject[], 
    faculty: Faculty[]
  ): { resolved: boolean; changes: any[] } {
    const changes: any[] = [];
    const overloadedFacultyId = conflict.affectedFaculty[0];
    
    // Find faculty with lighter workload
    const availableFaculty = faculty.filter(f => 
      f.id !== overloadedFacultyId &&
      f.department_id === faculty.find(f => f.id === overloadedFacultyId)?.department_id &&
      this.calculateFacultyWeeklyHours(f.id) < (f.max_hours_per_week || 20) * 0.8
    );

    if (availableFaculty.length > 0) {
      // Redistribute some subjects to available faculty
      const subjectsToRedistribute = conflict.affectedSubjects.slice(0, Math.ceil(conflict.affectedSubjects.length / 2));
      
      subjectsToRedistribute.forEach((subjectId, index) => {
        const targetFaculty = availableFaculty[index % availableFaculty.length];
        changes.push({
          type: 'workload_redistribution',
          subjectId,
          oldFacultyId: overloadedFacultyId,
          newFacultyId: targetFaculty.id
        });
      });
    }

    return { resolved: changes.length > 0, changes };
  }

  /**
   * Resolve break time conflicts by scheduling breaks
   */
  private resolveBreakConflict(
    conflict: SchedulingConflict, 
    subjects: Subject[]
  ): { resolved: boolean; changes: any[] } {
    const changes: any[] = [];
    
    // Find the day with the conflict
    const dayMatch = conflict.description.match(/on (\w+)/);
    if (!dayMatch) return { resolved: false, changes: [] };

    const day = dayMatch[1];
    
    // Schedule a break in the middle of the day
    const breakTime = '12:00 to 12:55'; // Lunch break
    changes.push({
      type: 'break_scheduling',
      day,
      breakTime,
      reason: 'Conflict resolution - mandatory break'
    });

    return { resolved: true, changes };
  }

  /**
   * Resolve time slot conflicts by finding alternative slots
   */
  private resolveTimeConflict(
    conflict: SchedulingConflict, 
    subjects: Subject[], 
    faculty: Faculty[]
  ): { resolved: boolean; changes: any[] } {
    const changes: any[] = [];
    
    // Find alternative time slots for the affected subjects
    conflict.affectedSubjects.forEach(subjectId => {
      const alternativeSlots = this.findAlternativeTimeSlots(subjectId);
      if (alternativeSlots.length > 0) {
        changes.push({
          type: 'timeslot_reassignment',
          subjectId,
          newSlots: alternativeSlots.slice(0, 2) // Take first 2 alternatives
        });
      }
    });

    return { resolved: changes.length > 0, changes };
  }

  /**
   * Optimize time slots using AI algorithms
   */
  optimizeTimeSlots(
    subjects: Subject[], 
    faculty: Faculty[], 
    rooms: RoomAssignment[]
  ): OptimizedTimeSlot[] {
    if (!this.settings.enableAIOptimization) {
      return [];
    }

    const timeSlots = [
      '9:00 to 9:55', '9:55 to 10:50', '11:05 to 12:00', '12:00 to 12:55',
      '1:55 to 2:50', '2:50 to 3:45', '3:55 to 4:50'
    ];

    const optimizedSlots: OptimizedTimeSlot[] = [];

    ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].forEach(day => {
      timeSlots.forEach(timeSlot => {
        const score = this.calculateSlotScore(day, timeSlot, subjects, faculty, rooms);
        const conflicts = this.getConflictsForSlot(day, timeSlot);
        
        optimizedSlots.push({
          day,
          timeSlot,
          score,
          reasons: this.getOptimizationReasons(day, timeSlot, subjects, faculty, rooms),
          conflicts
        });
      });
    });

    // Sort by score (highest first)
    return optimizedSlots.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate optimization score for a time slot
   */
  private calculateSlotScore(
    day: string, 
    timeSlot: string, 
    subjects: Subject[], 
    faculty: Faculty[], 
    rooms: RoomAssignment[]
  ): number {
    let score = 50; // Base score

    // Faculty availability
    const availableFaculty = faculty.filter(f => 
      !this.facultySchedule[f.id][day].has(timeSlot)
    );
    score += availableFaculty.length * 10;

    // Room availability
    if (this.settings.enableRoomAssignment) {
      const availableRooms = rooms.filter(r => 
        !this.roomSchedule[r.roomId][day].has(timeSlot)
      );
      score += availableRooms.length * 5;
    }

    // Time slot preferences
    const slotIndex = this.getTimeSlotIndex(timeSlot);
    if (slotIndex < 3) score += 20; // Morning preference
    if (slotIndex === 3) score -= 10; // Lunch time
    if (slotIndex > 4) score += 15; // Afternoon preference

    // Day preferences
    if (day === 'SAT') score -= 30; // Saturday penalty
    if (day === 'MON') score += 10; // Monday preference
    if (day === 'FRI') score += 5; // Friday preference

    return Math.max(0, score);
  }

  /**
   * Get optimization reasons for a time slot
   */
  private getOptimizationReasons(
    day: string, 
    timeSlot: string, 
    subjects: Subject[], 
    faculty: Faculty[], 
    rooms: RoomAssignment[]
  ): string[] {
    const reasons: string[] = [];
    const slotIndex = this.getTimeSlotIndex(timeSlot);

    // Faculty availability
    const availableFaculty = faculty.filter(f => 
      !this.facultySchedule[f.id][day].has(timeSlot)
    );
    if (availableFaculty.length > 0) {
      reasons.push(`${availableFaculty.length} faculty available`);
    }

    // Room availability
    if (this.settings.enableRoomAssignment) {
      const availableRooms = rooms.filter(r => 
        !this.roomSchedule[r.roomId][day].has(timeSlot)
      );
      if (availableRooms.length > 0) {
        reasons.push(`${availableRooms.length} rooms available`);
      }
    }

    // Time slot characteristics
    if (slotIndex < 3) reasons.push('Morning slot (preferred)');
    if (slotIndex === 3) reasons.push('Lunch time (avoid if possible)');
    if (slotIndex > 4) reasons.push('Afternoon slot (good for labs)');

    // Day characteristics
    if (day === 'MON') reasons.push('Monday (good start)');
    if (day === 'FRI') reasons.push('Friday (end of week)');
    if (day === 'SAT') reasons.push('Saturday (limited availability)');

    return reasons;
  }

  /**
   * Schedule recurring events
   */
  scheduleRecurringEvents(
    events: Array<{
      name: string;
      type: 'weekly' | 'monthly';
      day: string;
      timeSlot: string;
      faculty: string[];
      subjects: string[];
    }>
  ): void {
    if (!this.settings.enableRecurringEvents) return;

    events.forEach(event => {
      // Mark faculty as busy for recurring events
      event.faculty.forEach(facultyId => {
        if (this.facultySchedule[facultyId] && this.facultySchedule[facultyId][event.day]) {
          this.facultySchedule[facultyId][event.day].add(event.timeSlot);
        }
      });

      // Mark subjects as scheduled
      event.subjects.forEach(subjectId => {
        if (this.subjectSchedule[subjectId] && this.subjectSchedule[subjectId][event.day]) {
          this.subjectSchedule[subjectId][event.day].add(event.timeSlot);
        }
      });
    });
  }

  /**
   * Manage break times
   */
  scheduleBreakTimes(breakTimes: BreakTime[]): void {
    if (!this.settings.enableBreakManagement) return;

    breakTimes.forEach(breakTime => {
      // Mark break time slots as unavailable
      ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].forEach(day => {
        if (this.facultySchedule[day]) {
          // Mark all faculty as unavailable during break
          Object.keys(this.facultySchedule).forEach(facultyId => {
            this.facultySchedule[facultyId][day].add(breakTime.startTime);
            this.facultySchedule[facultyId][day].add(breakTime.endTime);
          });
        }
      });
    });
  }

  /**
   * Get faculty assignments with conflict detection
   */
  getFacultyAssignmentsWithConflicts(
    subjects: Subject[], 
    faculty: Faculty[]
  ): Array<{
    subject: Subject;
    faculty: Faculty;
    conflicts: SchedulingConflict[];
    severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  }> {
    const assignments: Array<{
      subject: Subject;
      faculty: Faculty;
      conflicts: SchedulingConflict[];
      severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
    }> = [];

    subjects.forEach(subject => {
      // Find faculty for this subject
      const assignedFaculty = faculty.find(f => 
        f.specialization?.some(spec => 
          subject.name?.toLowerCase().includes(spec.toLowerCase()) ||
          subject.code?.toLowerCase().includes(spec.toLowerCase())
        )
      );

      if (assignedFaculty) {
        const conflicts = this.conflicts.filter(c => 
          c.affectedSubjects.includes(subject.id) ||
          c.affectedFaculty.includes(assignedFaculty.id)
        );

        const severity = this.getHighestSeverity(conflicts);

        assignments.push({
          subject,
          faculty: assignedFaculty,
          conflicts,
          severity
        });
      }
    });

    return assignments;
  }

  // Helper methods
  private isOverlappingSlots(slot1: string, slot2: string): boolean {
    // Simple overlap detection - can be enhanced with actual time parsing
    return slot1 === slot2;
  }

  private getFacultyName(facultyId: string, faculty: Faculty[]): string {
    return faculty.find(f => f.id === facultyId)?.name || 'Unknown Faculty';
  }

  private getRoomName(roomId: string, rooms: RoomAssignment[]): string {
    return rooms.find(r => r.roomId === roomId)?.roomName || 'Unknown Room';
  }

  private getSubjectsForFaculty(facultyId: string, day?: string): string[] {
    // Implementation depends on how subjects are tracked
    return [];
  }

  private getSubjectsForRoom(roomId: string, day?: string): string[] {
    // Implementation depends on how room assignments are tracked
    return [];
  }

  private getAllSubjectsForFaculty(facultyId: string): string[] {
    // Implementation depends on how faculty-subject assignments are tracked
    return [];
  }

  private calculateFacultyWeeklyHours(facultyId: string): number {
    let totalHours = 0;
    Object.values(this.facultySchedule[facultyId] || {}).forEach(daySlots => {
      totalHours += daySlots.size;
    });
    return totalHours;
  }

  private calculateFacultyDailyHours(facultyId: string, day: string): number {
    return this.facultySchedule[facultyId]?.[day]?.size || 0;
  }

  private hasClassInSlot(day: string, slot: string): boolean {
    // Check if any subject is scheduled in this slot
    return Object.values(this.subjectSchedule).some(daySchedule => 
      daySchedule[day]?.has(slot)
    );
  }

  private getSubjectsForDay(day: string): string[] {
    const subjects: string[] = [];
    Object.entries(this.subjectSchedule).forEach(([subjectId, daySchedule]) => {
      if (daySchedule[day]?.size > 0) {
        subjects.push(subjectId);
      }
    });
    return subjects;
  }

  private getFacultyForDay(day: string): string[] {
    const faculty: string[] = [];
    Object.entries(this.facultySchedule).forEach(([facultyId, daySchedule]) => {
      if (daySchedule[day]?.size > 0) {
        faculty.push(facultyId);
      }
    });
    return faculty;
  }

  private getScheduledHoursForSubject(subjectId: string): number {
    let totalHours = 0;
    Object.values(this.subjectSchedule[subjectId] || {}).forEach(daySlots => {
      totalHours += daySlots.size;
    });
    return totalHours;
  }

  private findAlternativeTimeSlots(subjectId: string): string[] {
    // Find alternative time slots for a subject
    const alternatives: string[] = [];
    const timeSlots = [
      '9:00 to 9:55', '9:55 to 10:50', '11:05 to 12:00', '12:00 to 12:55',
      '1:55 to 2:50', '2:50 to 3:45', '3:55 to 4:50'
    ];

    ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].forEach(day => {
      timeSlots.forEach(slot => {
        if (!this.subjectSchedule[subjectId]?.[day]?.has(slot)) {
          alternatives.push(`${day}-${slot}`);
        }
      });
    });

    return alternatives;
  }

  private getConflictsForSlot(day: string, timeSlot: string): SchedulingConflict[] {
    return this.conflicts.filter(conflict => 
      conflict.description.includes(day) || conflict.description.includes(timeSlot)
    );
  }

  private getTimeSlotIndex(timeSlot: string): number {
    const timeSlots = [
      '9:00 to 9:55', '9:55 to 10:50', '11:05 to 12:00', '12:00 to 12:55',
      '1:55 to 2:50', '2:50 to 3:45', '3:55 to 4:50'
    ];
    return timeSlots.indexOf(timeSlot);
  }

  private getHighestSeverity(conflicts: SchedulingConflict[]): 'none' | 'low' | 'medium' | 'high' | 'critical' {
    if (conflicts.length === 0) return 'none';
    
    const severityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    const maxSeverity = conflicts.reduce((max, conflict) => 
      severityOrder[conflict.severity] > severityOrder[max] ? conflict.severity : max
    , 'low' as keyof typeof severityOrder);
    
    return maxSeverity;
  }

  /**
   * Enhanced faculty workload balancing
   */
  balanceFacultyWorkload(faculty: Faculty[]): { balanced: boolean; changes: any[] } {
    console.log('⚖️ Balancing faculty workload...');
    
    const changes: any[] = [];
    const facultyWorkloads = faculty.map(f => ({
      faculty: f,
      currentHours: this.calculateFacultyWeeklyHours(f.id),
      maxHours: f.max_hours_per_week || 20,
      utilization: (this.calculateFacultyWeeklyHours(f.id) / (f.max_hours_per_week || 20)) * 100
    }));

    // Sort by utilization (highest first)
    facultyWorkloads.sort((a, b) => b.utilization - a.utilization);

    // Find overworked and underworked faculty
    const overworkedFaculty = facultyWorkloads.filter(f => f.utilization > 100);
    const underworkedFaculty = facultyWorkloads.filter(f => f.utilization < 60);

    console.log(`📊 Faculty workload analysis: ${overworkedFaculty.length} overworked, ${underworkedFaculty.length} underworked`);

    // Redistribute workload
    for (const overworked of overworkedFaculty) {
      let excessHours = overworked.currentHours - overworked.maxHours;
      
      for (const underworked of underworkedFaculty) {
        if (excessHours <= 0) break;
        
        const capacity = underworked.maxHours - underworked.currentHours;
        const transferHours = Math.min(excessHours, capacity);
        
        if (transferHours > 0) {
          // Find subjects to transfer
          const transferableSubjects = this.findTransferableSubjects(overworked.faculty.id, underworked.faculty.id);
          
          for (const subjectId of transferableSubjects) {
            if (excessHours <= 0) break;
            
            const subject = this.findSubjectById(subjectId);
            if (subject && this.canFacultyTeachSubject(underworked.faculty, subject)) {
              changes.push({
                type: 'workload_redistribution',
                subjectId,
                oldFacultyId: overworked.faculty.id,
                newFacultyId: underworked.faculty.id,
                reason: 'Workload balancing'
              });

              // Update schedules
              this.updateFacultySchedule(overworked.faculty.id, underworked.faculty.id, subjectId);
              
              excessHours -= subject.hours_per_week || 1;
            }
          }
        }
      }
    }

    console.log(`✅ Workload balancing completed: ${changes.length} redistributions`);
    return { balanced: overworkedFaculty.length === 0, changes };
  }

  /**
   * Real-time conflict detection with immediate feedback
   */
  detectConflictsRealTime(
    subject: Subject, 
    faculty: Faculty, 
    day: string, 
    timeSlot: string,
    room?: RoomAssignment
  ): SchedulingConflict[] {
    const conflicts: SchedulingConflict[] = [];

    // 1. Check faculty availability
    if (this.isFacultyBusy(faculty.id, day, timeSlot)) {
      conflicts.push({
        type: 'faculty',
        severity: 'critical',
        description: `Faculty ${faculty.name} is already assigned at ${day} ${timeSlot}`,
        affectedSubjects: [subject.id],
        affectedFaculty: [faculty.id],
        suggestedResolution: 'Choose a different time slot or faculty member',
        timestamp: new Date()
      });
    }

    // 2. Check faculty workload
    const currentWeeklyHours = this.calculateFacultyWeeklyHours(faculty.id);
    const subjectHours = subject.hours_per_week || 1;
    if (currentWeeklyHours + subjectHours > (faculty.max_hours_per_week || 20)) {
      conflicts.push({
        type: 'workload',
        severity: 'high',
        description: `Faculty ${faculty.name} would exceed weekly workload limit`,
        affectedSubjects: [subject.id],
        affectedFaculty: [faculty.id],
        suggestedResolution: 'Reduce faculty workload or choose alternative faculty',
        timestamp: new Date()
      });
    }

    // 3. Check room availability
    if (room && this.isRoomBusy(room.roomId, day, timeSlot)) {
      conflicts.push({
        type: 'room',
        severity: 'medium',
        description: `Room ${room.roomName} is already occupied at ${day} ${timeSlot}`,
        affectedSubjects: [subject.id],
        affectedFaculty: [],
        suggestedResolution: 'Choose a different room or time slot',
        timestamp: new Date()
      });
    }

    // 4. Check consecutive theory classes
    if (this.settings.avoidConsecutiveTheory && subject.subject_type === 'theory') {
      const hasConsecutiveTheory = this.checkConsecutiveTheory(day, timeSlot);
      if (hasConsecutiveTheory) {
        conflicts.push({
          type: 'time',
          severity: 'medium',
          description: `Consecutive theory classes detected at ${day} ${timeSlot}`,
          affectedSubjects: [subject.id],
          affectedFaculty: [faculty.id],
          suggestedResolution: 'Schedule theory classes with breaks in between',
          timestamp: new Date()
        });
      }
    }

    return conflicts;
  }

  /**
   * Apply aggressive resolution strategies when normal resolution fails
   */
  private applyAggressiveResolutionStrategies(
    subjects: Subject[], 
    faculty: Faculty[], 
    rooms: RoomAssignment[]
  ): number {
    let resolvedCount = 0;

    // Strategy 1: Force faculty reassignment
    const facultyConflicts = this.conflicts.filter(c => c.type === 'faculty');
    for (const conflict of facultyConflicts) {
      const resolution = this.forceFacultyReassignment(conflict, subjects, faculty);
      if (resolution.resolved) {
        resolvedCount++;
        this.conflicts = this.conflicts.filter(c => c !== conflict);
      }
    }

    // Strategy 2: Extend time slots
    const timeConflicts = this.conflicts.filter(c => c.type === 'time');
    for (const conflict of timeConflicts) {
      const resolution = this.extendTimeSlots(conflict, subjects);
      if (resolution.resolved) {
        resolvedCount++;
        this.conflicts = this.conflicts.filter(c => c !== conflict);
      }
    }

    // Strategy 3: Reduce workload temporarily
    const workloadConflicts = this.conflicts.filter(c => c.type === 'workload');
    for (const conflict of workloadConflicts) {
      const resolution = this.temporarilyReduceWorkload(conflict, faculty);
      if (resolution.resolved) {
        resolvedCount++;
        this.conflicts = this.conflicts.filter(c => c !== conflict);
      }
    }

    return resolvedCount;
  }

  /**
   * Force faculty reassignment for critical conflicts
   */
  private forceFacultyReassignment(
    conflict: SchedulingConflict, 
    subjects: Subject[], 
    faculty: Faculty[]
  ): { resolved: boolean; changes: any[] } {
    const changes: any[] = [];
    
    // Find alternative faculty for the affected subjects
    for (const subjectId of conflict.affectedSubjects) {
      const subject = subjects.find(s => s.id === subjectId);
      if (!subject) continue;

      // Find faculty with similar specialization and available time
      const alternativeFaculty = faculty.find(f => 
        f.id !== conflict.affectedFaculty[0] &&
        f.specialization?.some(spec => 
          subject.name?.toLowerCase().includes(spec.toLowerCase()) ||
          subject.code?.toLowerCase().includes(spec.toLowerCase())
        ) &&
        this.calculateFacultyWeeklyHours(f.id) < (f.max_hours_per_week || 20)
      );

      if (alternativeFaculty) {
        // Reassign the subject to alternative faculty
        changes.push({
          type: 'faculty_reassignment',
          subjectId,
          oldFacultyId: conflict.affectedFaculty[0],
          newFacultyId: alternativeFaculty.id,
          reason: 'Conflict resolution'
        });

        // Update faculty schedules
        this.updateFacultySchedule(conflict.affectedFaculty[0], alternativeFaculty.id, subjectId);
      }
    }

    return { resolved: changes.length > 0, changes };
  }

  /**
   * Extend time slots to resolve time conflicts
   */
  private extendTimeSlots(
    conflict: SchedulingConflict, 
    subjects: Subject[]
  ): { resolved: boolean; changes: any[] } {
    const changes: any[] = [];
    
    // Find available extended time slots
    const extendedSlots = this.findExtendedTimeSlots();
    
    for (const subjectId of conflict.affectedSubjects) {
      const subject = subjects.find(s => s.id === subjectId);
      if (!subject) continue;

      // Find a suitable extended slot
      const suitableSlot = extendedSlots.find(slot => 
        !this.isSlotOccupied(slot.day, slot.timeSlot)
      );

      if (suitableSlot) {
        changes.push({
          type: 'time_slot_extension',
          subjectId,
          oldSlot: conflict.description,
          newSlot: `${suitableSlot.day} ${suitableSlot.timeSlot}`,
          reason: 'Conflict resolution'
        });

        // Update schedule
        this.updateTimeSlot(suitableSlot.day, suitableSlot.timeSlot, subjectId);
      }
    }

    return { resolved: changes.length > 0, changes };
  }

  /**
   * Temporarily reduce faculty workload
   */
  private temporarilyReduceWorkload(
    conflict: SchedulingConflict, 
    faculty: Faculty[]
  ): { resolved: boolean; changes: any[] } {
    const changes: any[] = [];
    
    for (const facultyId of conflict.affectedFaculty) {
      const facultyMember = faculty.find(f => f.id === facultyId);
      if (!facultyMember) continue;

      // Find subjects that can be temporarily reassigned
      const reassignableSubjects = this.findReassignableSubjects(facultyId);
      
      for (const subjectId of reassignableSubjects) {
        const alternativeFaculty = this.findAlternativeFaculty(subjectId, faculty, facultyId);
        
        if (alternativeFaculty) {
          changes.push({
            type: 'temporary_reassignment',
            subjectId,
            oldFacultyId: facultyId,
            newFacultyId: alternativeFaculty.id,
            reason: 'Workload reduction',
            temporary: true
          });

          // Update schedules
          this.updateFacultySchedule(facultyId, alternativeFaculty.id, subjectId);
          
          // Check if workload is now acceptable
          const newWorkload = this.calculateFacultyWeeklyHours(facultyId);
          if (newWorkload <= (facultyMember.max_hours_per_week || 20)) {
            break; // Stop reassigning if workload is now acceptable
          }
        }
      }
    }

    return { resolved: changes.length > 0, changes };
  }

  /**
   * Helper methods for enhanced functionality
   */
  private detectNewConflictsFromChanges(
    changes: any[], 
    subjects: Subject[], 
    faculty: Faculty[], 
    rooms: RoomAssignment[]
  ): SchedulingConflict[] {
    const newConflicts: SchedulingConflict[] = [];
    
    for (const change of changes) {
      // Re-detect conflicts after each change
      const conflicts = this.detectConflicts(subjects, faculty, rooms);
      newConflicts.push(...conflicts);
    }
    
    return newConflicts;
  }

  private findExtendedTimeSlots(): Array<{ day: string; timeSlot: string }> {
    const extendedSlots = [];
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    
    // Add extended slots (evening slots)
    const extendedTimeSlots = [
      '5:00 to 5:55', '6:00 to 6:55', '7:00 to 7:55'
    ];
    
    days.forEach(day => {
      extendedTimeSlots.forEach(timeSlot => {
        extendedSlots.push({ day, timeSlot });
      });
    });
    
    return extendedSlots;
  }

  private isSlotOccupied(day: string, timeSlot: string): boolean {
    return this.facultySchedule[day]?.has(timeSlot) || 
           this.roomSchedule[day]?.has(timeSlot) ||
           this.subjectSchedule[day]?.has(timeSlot);
  }

  private updateTimeSlot(day: string, timeSlot: string, subjectId: string): void {
    if (!this.subjectSchedule[subjectId]) {
      this.subjectSchedule[subjectId] = {};
    }
    if (!this.subjectSchedule[subjectId][day]) {
      this.subjectSchedule[subjectId][day] = new Set();
    }
    this.subjectSchedule[subjectId][day].add(timeSlot);
  }

  private findReassignableSubjects(facultyId: string): string[] {
    // Find subjects that can be temporarily reassigned
    const reassignableSubjects: string[] = [];
    
    Object.entries(this.subjectSchedule).forEach(([subjectId, days]) => {
      Object.entries(days).forEach(([day, timeSlots]) => {
        Array.from(timeSlots).forEach(timeSlot => {
          // Check if this faculty is assigned to this slot
          if (this.facultySchedule[facultyId]?.[day]?.has(timeSlot)) {
            // Add to reassignable list (simplified logic)
            reassignableSubjects.push(`subject_${day}_${timeSlot}`);
          }
        });
      });
    });
    
    return reassignableSubjects;
  }

  private findAlternativeFaculty(subjectId: string, faculty: Faculty[], excludeFacultyId: string): Faculty | null {
    return faculty.find(f => 
      f.id !== excludeFacultyId &&
      f.specialization?.some(spec => spec.toLowerCase().includes('general')) &&
      this.calculateFacultyWeeklyHours(f.id) < (f.max_hours_per_week || 20)
    ) || null;
  }

  private findTransferableSubjects(fromFacultyId: string, toFacultyId: string): string[] {
    // Find subjects that can be transferred between faculty
    const transferableSubjects: string[] = [];
    
    Object.entries(this.subjectSchedule).forEach(([subjectId, days]) => {
      Object.entries(days).forEach(([day, timeSlots]) => {
        Array.from(timeSlots).forEach(timeSlot => {
          if (this.facultySchedule[fromFacultyId]?.[day]?.has(timeSlot)) {
            transferableSubjects.push(`subject_${day}_${timeSlot}`);
          }
        });
      });
    });
    
    return transferableSubjects;
  }

  private findSubjectById(subjectId: string): Subject | null {
    // This would need to be implemented with actual subject data
    return null;
  }

  private canFacultyTeachSubject(faculty: Faculty, subject: Subject): boolean {
    return faculty.specialization?.some(spec => 
      subject.name?.toLowerCase().includes(spec.toLowerCase()) ||
      subject.code?.toLowerCase().includes(spec.toLowerCase()) ||
      spec.toLowerCase().includes('general')
    ) || false;
  }

  private updateFacultySchedule(fromFacultyId: string, toFacultyId: string, subjectId: string): void {
    // Remove from old faculty schedule
    Object.entries(this.facultySchedule[fromFacultyId] || {}).forEach(([day, timeSlots]) => {
      Array.from(timeSlots).forEach(timeSlot => {
        if (this.subjectSchedule[subjectId]?.[day]?.has(timeSlot)) {
          this.facultySchedule[fromFacultyId][day].delete(timeSlot);
        }
      });
    });

    // Add to new faculty schedule
    Object.entries(this.subjectSchedule[subjectId] || {}).forEach(([day, timeSlots]) => {
      if (!this.facultySchedule[toFacultyId][day]) {
        this.facultySchedule[toFacultyId][day] = new Set();
      }
      Array.from(timeSlots).forEach(timeSlot => {
        this.facultySchedule[toFacultyId][day].add(timeSlot);
      });
    });
  }

  private isFacultyBusy(facultyId: string, day: string, timeSlot: string): boolean {
    return this.facultySchedule[facultyId]?.[day]?.has(timeSlot) || false;
  }

  private isRoomBusy(roomId: string, day: string, timeSlot: string): boolean {
    return this.roomSchedule[roomId]?.[day]?.has(timeSlot) || false;
  }

  private checkConsecutiveTheory(day: string, timeSlot: string): boolean {
    const timeSlotIndex = this.getTimeSlotIndex(timeSlot);
    const previousSlot = this.getTimeSlotByIndex(timeSlotIndex - 1);
    const nextSlot = this.getTimeSlotByIndex(timeSlotIndex + 1);
    
    return (previousSlot && this.hasTheoryClass(day, previousSlot)) ||
           (nextSlot && this.hasTheoryClass(day, nextSlot));
  }

  private hasTheoryClass(day: string, timeSlot: string): boolean {
    // Check if there's a theory class in this slot
    return false; // Placeholder implementation
  }

  private getTimeSlotByIndex(index: number): string | null {
    const timeSlots = [
      '9:00 to 9:55', '9:55 to 10:50', '11:05 to 12:00', '12:00 to 12:55',
      '1:55 to 2:50', '2:50 to 3:45', '3:55 to 4:50'
    ];
    return timeSlots[index] || null;
  }
} 