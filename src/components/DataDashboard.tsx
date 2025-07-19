
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Database, BookOpen, Users, Calendar, CheckCircle, WarningCircle } from 'phosphor-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';

interface DataDashboardProps {
  selectedDepartment: string;
  setSelectedDepartment: (dept: string) => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  selectedSection: string;
  setSelectedSection: (section: string) => void;
  onDataReady: (data: any) => void;
}

const DataDashboard: React.FC<DataDashboardProps> = ({
  selectedDepartment,
  setSelectedDepartment,
  selectedYear,
  setSelectedYear,
  selectedSection,
  setSelectedSection,
  onDataReady
}) => {
  const { departments, years, sections, subjects, faculty, loading } = useSupabaseData();

  // Filter sections based on selected department and year
  const availableSections = sections.filter(section => {
    const deptMatch = selectedDepartment ? section.department_id === selectedDepartment : true;
    const yearMatch = selectedYear ? section.year_id === selectedYear : true;
    return deptMatch && yearMatch;
  });

  // Filter subjects based on selected department and year
  const availableSubjects = subjects.filter(subject => {
    const deptMatch = selectedDepartment ? subject.department_id === selectedDepartment : true;
    const yearMatch = selectedYear ? subject.year_id === selectedYear : true;
    return deptMatch && yearMatch;
  });

  // Filter faculty based on selected department
  const availableFaculty = faculty.filter(f => 
    selectedDepartment ? f.department_id === selectedDepartment : true
  );

  React.useEffect(() => {
    if (selectedDepartment && selectedYear && selectedSection) {
      onDataReady({
        subjects: availableSubjects,
        faculty: availableFaculty,
        sections: availableSections
      });
    }
  }, [selectedDepartment, selectedYear, selectedSection, availableSubjects, availableFaculty, availableSections]);

  if (loading) {
    return (
      <div className="p-8 bg-white dark:bg-zinc-900 rounded-lg text-center animate-bounce-in border border-gray-200 dark:border-gray-700">
        <div className="rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4 animate-spin"></div>
        <p className="text-gray-600 dark:text-gray-300 loading-dots">Loading academic data</p>
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <header className="mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Academic Data Dashboard</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage academic information and settings</p>
      </header>

      {/* Selection Controls */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Department</label>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="h-10 text-sm">
              <SelectValue placeholder="Select Department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id} className="text-sm">
                  {dept.name} ({dept.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Year</label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="h-10 text-sm">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year.id} value={year.id} className="text-sm">
                  {year.year_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Section</label>
          <Select value={selectedSection} onValueChange={setSelectedSection}>
            <SelectTrigger className="h-10 text-sm">
              <SelectValue placeholder="Select Section" />
            </SelectTrigger>
            <SelectContent>
              {availableSections.map((section) => (
                <SelectItem key={section.id} value={section.id} className="text-sm">
                  Section {section.section_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Status Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-700 rounded-md flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-blue-600 dark:text-blue-300 mb-1">Subjects</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-200">{availableSubjects.length}</p>
          </div>
          <BookOpen size={24} className="text-blue-600 dark:text-blue-300 ml-2" weight="duotone" />
        </div>
        <div className="p-3 bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-700 rounded-md flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-blue-600 dark:text-blue-300 mb-1">Faculty</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-200">{availableFaculty.length}</p>
          </div>
          <Users size={24} className="text-blue-600 dark:text-blue-300 ml-2" weight="duotone" />
        </div>
        <div className="p-3 bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-700 rounded-md flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-blue-600 dark:text-blue-300 mb-1">Setup Status</p>
            <div className="flex items-center gap-1 mt-0.5">
              {selectedDepartment && selectedYear && selectedSection ? (
                <>
                  <CheckCircle size={18} className="text-blue-600 dark:text-blue-300" weight="fill" />
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-200 ml-1">Setup Complete</span>
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 text-xs font-semibold border border-blue-200 dark:border-blue-700">Ready</span>
                </>
              ) : (
                <>
                  <WarningCircle size={18} className="text-blue-400 dark:text-blue-300" weight="fill" />
                  <span className="text-xs font-medium text-blue-400 dark:text-blue-300">Pending</span>
                </>
              )}
            </div>
          </div>
          <Calendar size={24} className="text-blue-600 dark:text-blue-300 ml-2" weight="duotone" />
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-gray-100 dark:border-gray-800 my-3" />

      {/* Database Stats */}
      <section className="p-3 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-gray-800 rounded-md">
        <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-100 text-base">Database Overview</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
          <div>
            <div className="text-base font-bold text-gray-700 dark:text-gray-200">{departments.length}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Departments</div>
          </div>
          <div>
            <div className="text-base font-bold text-gray-700 dark:text-gray-200">{years.length}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Years</div>
          </div>
          <div>
            <div className="text-base font-bold text-gray-700 dark:text-gray-200">{sections.length}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Sections</div>
          </div>
          <div>
            <div className="text-base font-bold text-gray-700 dark:text-gray-200">{subjects.length}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total Subjects</div>
          </div>
          <div>
            <div className="text-base font-bold text-gray-700 dark:text-gray-200">{faculty.length}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total Faculty</div>
          </div>
        </div>
      </section>
    </section>
  );
};

export default DataDashboard;
