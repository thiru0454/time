
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Database, BookOpen, Users, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
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
      <Card className="p-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm text-center animate-bounce-in">
        <div className="rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4 animate-spin"></div>
        <p className="text-gray-600 loading-dots">Loading academic data</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm card-hover animate-slide-up">
        <div className="flex items-center gap-3 mb-6">
          <Database className="h-8 w-8 text-green-600 animate-float" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800 text-glow">Academic Data Dashboard</h2>
            <p className="text-gray-600">Manage academic information and settings</p>
          </div>
        </div>

        {/* Selection Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 stagger-animation">
          <div className="animate-slide-up">
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="h-12 hover-scale">
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="animate-slide-up">
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="h-12 hover-scale">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.year_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="animate-slide-up">
            <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="h-12 hover-scale">
                <SelectValue placeholder="Select Section" />
              </SelectTrigger>
              <SelectContent>
                {availableSections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    Section {section.section_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-animation">
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 card-hover animate-float">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Subjects Available</p>
                <p className="text-2xl font-bold text-blue-800">{availableSubjects.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600 animate-float" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 card-hover animate-float">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Faculty Members</p>
                <p className="text-2xl font-bold text-green-800">{availableFaculty.length}</p>
              </div>
              <Users className="h-8 w-8 text-green-600 animate-float" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 card-hover animate-float">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Setup Status</p>
                <div className="flex items-center gap-2 mt-1">
                  {selectedDepartment && selectedYear && selectedSection ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600 animate-pulse-slow" />
                      <span className="text-sm font-medium text-green-600">Ready</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-yellow-600 animate-pulse-slow" />
                      <span className="text-sm font-medium text-yellow-600">Pending</span>
                    </>
                  )}
                </div>
              </div>
              <Calendar className="h-8 w-8 text-purple-600 animate-float" />
            </div>
          </Card>
        </div>

        {/* Database Stats */}
        <Card className="p-4 mt-6 bg-gray-50 border border-gray-200">
          <h4 className="font-medium mb-3 text-gray-800">Database Overview</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-gray-700">{departments.length}</div>
              <div className="text-xs text-gray-600">Departments</div>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-700">{years.length}</div>
              <div className="text-xs text-gray-600">Years</div>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-700">{sections.length}</div>
              <div className="text-xs text-gray-600">Sections</div>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-700">{subjects.length}</div>
              <div className="text-xs text-gray-600">Total Subjects</div>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-700">{faculty.length}</div>
              <div className="text-xs text-gray-600">Total Faculty</div>
            </div>
          </div>
        </Card>
      </Card>
    </div>
  );
};

export default DataDashboard;
