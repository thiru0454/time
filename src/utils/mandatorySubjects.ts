import { Subject } from "@/hooks/useSupabaseData";

export interface MandatorySubject {
  name: string;
  code: string;
  subject_type: string;
  hours_per_week: number;
  credits: number;
  years: number[];
}

export const MANDATORY_SUBJECTS = [
  // 1st Year subjects
  {
    name: 'Library',
    code: 'LIB101',
    subject_type: 'Theory',
    hours_per_week: 1,
    credits: 1,
    years: [1]
  },
  {
    name: 'Counseling',
    code: 'CNS101',
    subject_type: 'Theory',
    hours_per_week: 1,
    credits: 1,
    years: [1]
  },
  {
    name: 'Seminar',
    code: 'SEM101',
    subject_type: 'Theory',
    hours_per_week: 2,
    credits: 2,
    years: [1]
  },
  {
    name: 'Sports',
    code: 'SPT101',
    subject_type: 'Practical',
    hours_per_week: 1,
    credits: 1,
    years: [1]
  },
  // 2nd Year subjects
  {
    name: 'Library',
    code: 'LIB201',
    subject_type: 'Theory',
    hours_per_week: 1,
    credits: 1,
    years: [2]
  },
  {
    name: 'Counseling',
    code: 'CNS201',
    subject_type: 'Theory',
    hours_per_week: 1,
    credits: 1,
    years: [2]
  },
  {
    name: 'Seminar',
    code: 'SEM201',
    subject_type: 'Theory',
    hours_per_week: 2,
    credits: 2,
    years: [2]
  },
  {
    name: 'Sports',
    code: 'SPT201',
    subject_type: 'Practical',
    hours_per_week: 1,
    credits: 1,
    years: [2]
  },
  // 3rd Year subjects
  {
    name: 'Library',
    code: 'LIB301',
    subject_type: 'Theory',
    hours_per_week: 1,
    credits: 1,
    years: [3]
  },
  {
    name: 'Counseling',
    code: 'CNS301',
    subject_type: 'Theory',
    hours_per_week: 1,
    credits: 1,
    years: [3]
  },
  {
    name: 'Seminar',
    code: 'SEM301',
    subject_type: 'Theory',
    hours_per_week: 2,
    credits: 2,
    years: [3]
  },
  {
    name: 'Sports',
    code: 'SPT301',
    subject_type: 'Practical',
    hours_per_week: 1,
    credits: 1,
    years: [3]
  },
  // 4th Year subjects
  {
    name: 'Library',
    code: 'LIB401',
    subject_type: 'Theory',
    hours_per_week: 1,
    credits: 1,
    years: [4]
  },
  {
    name: 'Counseling',
    code: 'CNS401',
    subject_type: 'Theory',
    hours_per_week: 1,
    credits: 1,
    years: [4]
  },
  {
    name: 'Seminar',
    code: 'SEM401',
    subject_type: 'Theory',
    hours_per_week: 2,
    credits: 2,
    years: [4]
  }
];

export const isMandatorySubject = (subject: Subject): boolean => {
  const lowerCaseName = subject.name?.toLowerCase();
  const lowerCaseCode = subject.code?.toLowerCase();

  return MANDATORY_SUBJECTS.some(mandatory => {
    const mandatoryName = mandatory.name.toLowerCase();
    const mandatoryCode = mandatory.code.toLowerCase();

    return (
      lowerCaseName === mandatoryName || lowerCaseCode === mandatoryCode
    );
  });
};

export const createMandatorySubjects = (departmentId: string, yearId: string, yearNumber: number): Omit<Subject, 'id'>[] => {
  return MANDATORY_SUBJECTS
    .filter(mandatory => mandatory.years.includes(yearNumber))
    .map(mandatory => ({
      name: mandatory.name,
      code: mandatory.code,
      subject_type: mandatory.subject_type,
      hours_per_week: mandatory.hours_per_week,
      credits: mandatory.credits,
      department_id: departmentId,
      year_id: yearId
    }));
};

export const getMandatorySubjectsByYear = (yearNumber: number): MandatorySubject[] => {
  return MANDATORY_SUBJECTS.filter(subject => subject.years.includes(yearNumber));
};
