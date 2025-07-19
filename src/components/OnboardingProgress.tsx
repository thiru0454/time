import React from 'react';
import { CheckCircle, Buildings, CalendarBlank, Users, ArrowRight } from 'phosphor-react';
import { Badge } from '@/components/ui/badge';

interface OnboardingProgressProps {
  selectedDepartment: string;
  selectedYear: string;
  selectedSection: string;
  isSetupComplete: boolean;
}

const steps = [
  {
    label: 'Select Department',
    icon: <Buildings size={32} weight="duotone" />,
    key: 'department',
  },
  {
    label: 'Choose Year',
    icon: <CalendarBlank size={32} weight="duotone" />,
    key: 'year',
  },
  {
    label: 'Pick Section',
    icon: <Users size={32} weight="duotone" />,
    key: 'section',
  },
  {
    label: 'Proceed',
    icon: <ArrowRight size={32} weight="duotone" />,
    key: 'proceed',
  },
];

const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
  selectedDepartment,
  selectedYear,
  selectedSection,
  isSetupComplete,
}) => {
  const progress = [
    !!selectedDepartment,
    !!selectedYear,
    !!selectedSection,
    isSetupComplete,
  ];
  const currentStep = progress.findIndex(done => !done);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 rounded-2xl shadow-2xl bg-white/60 dark:bg-zinc-900/60 backdrop-blur-lg border border-indigo-200 dark:border-indigo-700 relative overflow-visible">
      {/* Animated Progress Bar */}
      <div className="hidden md:block absolute left-12 right-12 top-20 h-2 z-0">
        <div className="w-full h-full bg-gradient-to-r from-indigo-100 via-blue-100 to-purple-100 rounded-full" />
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full transition-all duration-700"
          style={{ width: `${((progress.filter(Boolean).length - 1) / (steps.length - 1)) * 100}%` }}
        />
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0 relative z-10">
        {steps.map((step, idx) => {
          const done = progress[idx];
          const isCurrent = currentStep === idx;
          return (
            <div key={step.label} className="flex flex-col items-center w-full md:w-1/4 group">
              <div
                className={`flex items-center justify-center w-16 h-16 rounded-2xl shadow-xl border-2 transition-all duration-300
                  ${done ? 'bg-green-500 border-green-400' : isCurrent ? 'bg-blue-600 border-blue-400' : 'bg-white/80 dark:bg-zinc-800/80 border-gray-200 dark:border-gray-700'}
                  group-hover:scale-105
                `}
                style={{ boxShadow: done || isCurrent ? '0 4px 32px 0 rgba(34,197,94,0.15)' : '0 2px 12px 0 rgba(99,102,241,0.08)' }}
              >
                {done ? <CheckCircle size={36} weight="fill" className="text-white drop-shadow-lg" /> : step.icon}
              </div>
              <span className={`mt-3 text-base font-semibold text-center ${done ? 'text-green-700 dark:text-green-300' : isCurrent ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>{step.label}</span>
              {done && <Badge className="mt-2 bg-green-100 text-green-700 border-green-200">Done</Badge>}
              {isCurrent && !done && <Badge className="mt-2 bg-blue-100 text-blue-700 border-blue-200 animate-pulse">Current</Badge>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OnboardingProgress; 