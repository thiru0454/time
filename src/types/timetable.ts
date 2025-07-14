
export interface GenerationSettings {
  avoidConsecutiveTheory: boolean;
  balanceWorkload: boolean;
  prioritizeMorningLabs: boolean;
  enforceBreaks: boolean;
  maxDailyHours: number;
}

export interface FacultyAssignment {
  id: string;
  subject_id: string;
  faculty_id: string;
  section_id: string;
}

export interface GenerationStats {
  totalSlots: number;
  filledSlots: number;
  mandatorySlots?: number;
  efficiency: number;
  facultyUtilization: { [key: string]: number };
  subjectCoverage: { [key: string]: number };
}

export interface TimetableGenerationResult {
  timetable: any;
  conflicts: string[];
  stats: GenerationStats;
}
