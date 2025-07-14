
import React from 'react';
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Calendar, AlertCircle } from 'lucide-react';

interface DashboardControlsProps {
  selectedDepartment: string;
  setSelectedDepartment: (dept: string) => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  selectedSection: string;
  setSelectedSection: (section: string) => void;
  subjects: any[];
  faculty: any[];
}

const DashboardControls: React.FC<DashboardControlsProps> = ({
  selectedDepartment,
  setSelectedDepartment,
  selectedYear,
  setSelectedYear,
  selectedSection,
  setSelectedSection,
  subjects,
  faculty
}) => {
  const departments = ['IT', 'ADS'];
  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const sections = ['A', 'B', 'C'];

  const timeSlots = [
    { period: 1, time: '09:00 – 09:55' },
    { period: 2, time: '09:55 – 10:50' },
    { period: 3, time: '11:05 – 12:00' },
    { period: 4, time: '12:00 – 12:55' },
    { period: 'LUNCH', time: '12:55 – 01:55' },
    { period: 5, time: '01:55 – 02:50' },
    { period: 6, time: '02:50 – 03:45' },
    { period: 7, time: '03:55 – 04:50' },
  ];

  const specialSessions = [
    { name: 'Seminar', hours: 2, applies: 'All years', color: 'bg-orange-100 text-orange-800' },
    { name: 'Library', hours: 1, applies: 'All years', color: 'bg-blue-100 text-blue-800' },
    { name: 'Student Counseling', hours: 1, applies: 'All years', color: 'bg-purple-100 text-purple-800' },
    { name: 'Sports', hours: 1, applies: '1st year only', color: 'bg-green-100 text-green-800' },
    { name: 'Audit Course', hours: '1-2', applies: '2nd year only', color: 'bg-gray-100 text-gray-800' },
  ];

  return (
    <div className="space-y-6">
      {/* Selection Controls */}
      <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Department & Class Selection</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section} value={section}>Section {section}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Subjects</p>
              <p className="text-3xl font-bold text-blue-600">{subjects.length}</p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        
        <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Faculty Members</p>
              <p className="text-3xl font-bold text-green-600">{faculty.length}</p>
            </div>
            <Users className="h-8 w-8 text-green-600" />
          </div>
        </Card>
        
        <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-lg font-medium text-purple-600">
                {selectedDepartment && selectedYear && selectedSection ? 'Ready' : 'Setup Required'}
              </p>
            </div>
            {selectedDepartment && selectedYear && selectedSection ? (
              <Calendar className="h-8 w-8 text-purple-600" />
            ) : (
              <AlertCircle className="h-8 w-8 text-orange-600" />
            )}
          </div>
        </Card>
      </div>

      {/* Time Structure */}
      <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Daily Time Structure</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {timeSlots.map((slot, index) => (
            <div key={index} className={`p-3 rounded-lg text-center ${
              slot.period === 'LUNCH' 
                ? 'bg-orange-100 text-orange-800 border-2 border-orange-300' 
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              <div className="font-bold">{slot.period}</div>
              <div className="text-xs mt-1">{slot.time}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Special Sessions */}
      <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Auto-Scheduled Special Sessions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {specialSessions.map((session, index) => (
            <div key={index} className="p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Badge className={session.color}>{session.name}</Badge>
                <span className="text-sm font-medium">{session.hours} hrs/week</span>
              </div>
              <p className="text-sm text-gray-600">{session.applies}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default DashboardControls;
