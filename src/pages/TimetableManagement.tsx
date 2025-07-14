
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Users, Calendar, Download, Settings } from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import SubjectManager from "@/components/SubjectManager";
import FacultyManager from "@/components/FacultyManager";
import TimetableGenerator from "@/components/TimetableGenerator";
import TimetableViewer from "@/components/TimetableViewer";
import ExportPanel from "@/components/ExportPanel";
import { getActiveTimetable } from "@/utils/timetableStorage";

const TimetableManagement = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('subjects');
  const [generatedTimetable, setGeneratedTimetable] = useState<any>(null);

  const selectedDepartment = searchParams.get('department') || '';
  const selectedYear = searchParams.get('year') || '';
  const selectedSection = searchParams.get('section') || '';

  // Load active timetable when component mounts
  useEffect(() => {
    const loadActiveTimetable = async () => {
      if (selectedDepartment && selectedYear && selectedSection) {
        try {
          const activeTimetable = await getActiveTimetable(selectedDepartment, selectedYear, selectedSection);
          if (activeTimetable) {
            setGeneratedTimetable(activeTimetable.timetable_data);
          }
        } catch (error) {
          console.error('Failed to load active timetable:', error);
        }
      }
    };

    loadActiveTimetable();
  }, [selectedDepartment, selectedYear, selectedSection]);

  const { 
    departments, 
    years, 
    sections, 
    subjects, 
    faculty, 
    loading,
    setSubjects,
    setFaculty
  } = useSupabaseData();

  // Get display names
  const departmentName = departments.find(d => d.id === selectedDepartment)?.name || '';
  const yearName = years.find(y => y.id === selectedYear)?.year_name || '';
  const sectionName = sections.find(s => s.id === selectedSection)?.section_name || '';

  // Filter data based on selections
  const filteredSubjects = subjects.filter(subject => {
    const deptMatch = subject.department_id === selectedDepartment;
    const yearMatch = subject.year_id === selectedYear;
    return deptMatch && yearMatch;
  });

  const filteredFaculty = faculty.filter(f => f.department_id === selectedDepartment);

  const navigationItems = [
    { id: 'subjects', label: 'Manage Subjects', icon: BookOpen },
    { id: 'faculty', label: 'Manage Faculty', icon: Users },
    { id: 'generate', label: 'Generate Timetable', icon: Calendar },
    { id: 'view', label: 'View Timetable', icon: Settings },
    { id: 'export', label: 'Export Timetable', icon: Download },
  ];

  const renderCurrentView = () => {
    switch (currentView) {
      case 'subjects':
        return (
          <SubjectManager
            subjects={filteredSubjects}
            setSubjects={setSubjects}
            selectedDepartment={selectedDepartment}
            selectedYear={selectedYear}
            selectedSection={selectedSection}
          />
        );
      case 'faculty':
        return (
          <FacultyManager
            faculty={filteredFaculty}
            setFaculty={setFaculty}
            subjects={filteredSubjects}
            selectedDepartment={selectedDepartment}
            selectedYear={selectedYear}
            selectedSection={selectedSection}
          />
        );
      case 'generate':
        return (
          <TimetableGenerator
            subjects={filteredSubjects}
            faculty={filteredFaculty}
            selectedDepartment={selectedDepartment}
            selectedYear={selectedYear}
            selectedSection={selectedSection}
            onTimetableGenerated={setGeneratedTimetable}
          />
        );
      case 'view':
        return (
          <TimetableViewer
            timetable={generatedTimetable}
            subjects={filteredSubjects}
            faculty={filteredFaculty}
            selectedDepartment={selectedDepartment}
            selectedYear={selectedYear}
            selectedSection={selectedSection}
          />
        );
      case 'export':
        return (
          <ExportPanel
            timetable={generatedTimetable}
            selectedDepartment={departmentName}
            selectedYear={yearName}
            selectedSection={sectionName}
            subjects={filteredSubjects}
            faculty={filteredFaculty}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 page-transition">
      <div className="container mx-auto px-4 py-8 pb-32">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 btn-animate"
            >
              <ArrowLeft size={16} className="icon-bounce" />
              Back to Selection
            </Button>
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 text-shimmer animate-bounce-in">
            Timetable Management
          </h1>
          <p className="text-xl font-semibold text-gray-700 mb-1 animate-slide-up">Sona College of Technology</p>
          
          <div className="mt-4 flex justify-center gap-2 stagger-animation">
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 px-4 py-2 hover-scale">
              {departmentName}
            </Badge>
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 px-4 py-2 hover-scale">
              {yearName}
            </Badge>
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 px-4 py-2 hover-scale">
              Section {sectionName}
            </Badge>
          </div>
        </div>

        {/* Navigation */}
        <Card className="mb-8 p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-slide-up card-hover">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 stagger-animation">
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentView === item.id ? "default" : "outline"}
                  onClick={() => setCurrentView(item.id)}
                  className={`h-auto py-4 px-4 flex flex-col items-center gap-2 btn-animate ${
                    currentView === item.id 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg animate-glow' 
                      : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50'
                  }`}
                >
                  <Icon size={24} className="icon-bounce" />
                  <span className="text-sm font-medium text-center">{item.label}</span>
                </Button>
              );
            })}
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Available Subjects</p>
                <p className="text-2xl font-bold text-blue-800">{filteredSubjects.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Available Faculty</p>
                <p className="text-2xl font-bold text-green-800">{filteredFaculty.length}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="mb-32">
          {renderCurrentView()}
        </div>
      </div>
    </div>
  );
};

export default TimetableManagement;
