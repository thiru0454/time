import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, History, Download, Eye, Trash2 } from 'lucide-react';
import { Subject, Faculty } from '@/hooks/useSupabaseData';
import { getTimetables, getActiveTimetable, setActiveTimetable, deleteTimetable, StoredTimetable } from '@/utils/timetableStorage';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface TimetableViewerProps {
  timetable: any;
  subjects: Subject[];
  faculty: Faculty[];
  selectedDepartment: string;
  selectedYear: string;
  selectedSection: string;
}

const TimetableViewer: React.FC<TimetableViewerProps> = ({
  timetable,
  subjects,
  faculty,
  selectedDepartment,
  selectedYear,
  selectedSection
}) => {
  const [storedTimetables, setStoredTimetables] = useState<StoredTimetable[]>([]);
  const [selectedTimetable, setSelectedTimetable] = useState<StoredTimetable | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [currentTimetable, setCurrentTimetable] = useState<any>(timetable);
  const { toast } = useToast();

  // Load stored timetables when component mounts
  useEffect(() => {
    loadStoredTimetables();
  }, [selectedDepartment, selectedYear, selectedSection]);

  // Show the most recent/active timetable by default if no new timetable is passed
  useEffect(() => {
    if (!timetable && storedTimetables.length > 0) {
      // Prefer active timetable, else most recent
      const active = storedTimetables.find(t => t.is_active);
      const latest = storedTimetables[0];
      setCurrentTimetable((active || latest)?.timetable_data);
      setSelectedTimetable(active || latest || null);
    }
  }, [timetable, storedTimetables]);

  // Update current timetable when new timetable is generated
  useEffect(() => {
    if (timetable) {
      setCurrentTimetable(timetable);
      setSelectedTimetable(null);
    }
  }, [timetable]);

  const loadStoredTimetables = async () => {
    if (!selectedDepartment || !selectedYear || !selectedSection) return;
    
    setIsLoading(true);
    try {
      const timetables = await getTimetables(selectedDepartment, selectedYear, selectedSection);
      setStoredTimetables(timetables);
    } catch (error) {
      console.error('Failed to load timetables:', error);
      toast({
        title: "Error",
        description: "Failed to load stored timetables",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimetableSelect = async (timetable: StoredTimetable) => {
    setSelectedTimetable(timetable);
    setCurrentTimetable(timetable.timetable_data);
    setShowHistoryDialog(false);
    
    toast({
      title: "Timetable Loaded",
      description: `Viewing timetable: ${timetable.name}`,
    });
  };

  const handleSetActive = async (timetableId: string) => {
    try {
      await setActiveTimetable(timetableId);
      await loadStoredTimetables(); // Refresh the list
      toast({
        title: "Success",
        description: "Timetable set as active",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set timetable as active",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTimetable = async (timetableId: string) => {
    if (!confirm('Are you sure you want to delete this timetable?')) return;
    
    try {
      await deleteTimetable(timetableId);
      await loadStoredTimetables(); // Refresh the list
      toast({
        title: "Success",
        description: "Timetable deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete timetable",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!currentTimetable) {
    return (
      <Card className="p-8 shadow-lg border-0 bg-white/80 dark:bg-zinc-900 backdrop-blur-sm text-center fade-hover animate-fade-in">
        <Calendar size={48} className="mx-auto mb-4 text-gray-400 fade-hover" />
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-zinc-100 fade-hover">Timetable Viewer</h2>
        <p className="text-gray-600 dark:text-zinc-400 mb-4 fade-hover">No timetable available.</p>
        <div className="flex justify-center gap-4">
          <Button 
            onClick={() => setShowHistoryDialog(true)}
            variant="outline"
            className="flex items-center gap-2 btn-animate animate-bounce-in fade-hover"
          >
            <History className="h-4 w-4 fade-hover" />
            View History
          </Button>
        </div>
      </Card>
    );
  }

  // Define the proper time slots and days as per the college format
  const timeSlots = [
    '9:00 to 9:55',
    '9:55 to 10:50', 
    '11:05 to 12:00',
    '12:00 to 12:55',
    '12:55 to 1:55', // Lunch break
    '1:55 to 2:50',
    '2:50 to 3:45',
    '3:55 to 4:50'
  ];

  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const periodNumbers = ['1', '2', '3', '4', 'LUNCH BREAK', '5', '6', '7'];

  // Helper function to get subject abbreviation
  const getSubjectAbbreviation = (subjectCode: string) => {
    // Find the subject by code and return its abbreviation
    const subject = subjects.find(s => s.code === subjectCode);
    return subject?.abbreviation || subjectCode.substring(0, 3);
  };

  // Helper function to get faculty details by name
  const getFacultyByName = (facultyName: string) => {
    return faculty.find(f => f.name === facultyName);
  };

  // Helper function to get subject details by code
  const getSubjectByCode = (subjectCode: string) => {
    return subjects.find(s => s.code === subjectCode);
  };

  const getSubjectTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'theory':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-800';
      case 'practical':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-800';
      case 'lab':
        return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-800';
      case 'tutorial':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-800';
      default:
        return 'bg-gray-100 dark:bg-zinc-900 text-gray-800 dark:text-zinc-100 border-gray-300 dark:border-zinc-700';
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <Card className="p-6 shadow-lg border-0 bg-white/80 dark:bg-zinc-900 backdrop-blur-sm animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <div className="text-center flex-1 fade-hover">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-zinc-100 mb-2">Timetable</h2>
            <p className="text-gray-600 dark:text-zinc-400">Weekly schedule for the selected class</p>
            {selectedTimetable && (
              <div className="mt-2">
                <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  {selectedTimetable.name}
                </Badge>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                  Created: {formatDate(selectedTimetable.created_at)}
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowHistoryDialog(true)}
              variant="outline"
              className="flex items-center gap-2 fade-hover"
            >
              <History className="h-4 w-4" />
              History
            </Button>
            {selectedTimetable && (
              <Button 
                onClick={() => handleSetActive(selectedTimetable.id)}
                variant="outline"
                className="flex items-center gap-2 fade-hover"
                disabled={selectedTimetable.is_active}
              >
                <Eye className="h-4 w-4" />
                {selectedTimetable.is_active ? 'Active' : 'Set Active'}
              </Button>
            )}
          </div>
        </div>

        {/* Timetable Grid */}
        <div className="overflow-x-auto animate-fade-in">
          <Table className="w-full border-collapse border border-gray-300 dark:border-zinc-700 rounded-lg shadow-sm animate-fade-in">
            <TableHeader>
              <TableRow className="transition-all duration-300 hover:bg-blue-50">
                <TableHead rowSpan={2} className="text-center border border-gray-300 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 font-bold">
                  Day
                </TableHead>
                {periodNumbers.map((period, index) => (
                  <TableHead key={index} className="text-center border border-gray-300 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 font-bold min-w-[120px]">
                    {period}
                  </TableHead>
                ))}
              </TableRow>
              <TableRow>
                {timeSlots.map((slot, index) => (
                  <TableHead key={index} className="text-center border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 text-xs p-1">
                    {slot}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {days.map((day) => (
                <TableRow key={day}>
                  <TableCell className="text-center border border-gray-300 dark:border-zinc-700 font-medium bg-gray-50 dark:bg-zinc-900">
                    {day}
                  </TableCell>
                  {timeSlots.map((timeSlot, index) => {
                    const slot = currentTimetable[day]?.[timeSlot];
                    
                    return (
                      <TableCell key={`${day}-${timeSlot}`} className="border border-gray-300 dark:border-zinc-700 p-2 text-center">
                        {index === 4 ? ( // Lunch break
                          <div className="text-gray-500 dark:text-zinc-400 text-sm font-medium">
                            LUNCH BREAK
                          </div>
                        ) : slot ? (
                          <div className="space-y-1">
                            <div className="font-bold text-sm text-gray-800 dark:text-zinc-100">
                              {getSubjectAbbreviation(slot.subjectCode)}
                            </div>
                            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                              {slot.faculty}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-zinc-400">
                              {slot.subjectCode}
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-400 dark:text-zinc-400 text-xs">
                            Free
                          </div>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Enhanced Subject Details Table with Faculty Information */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-zinc-100">Subject Details with Faculty Assignment</h3>
          <Table className="w-full border-collapse border border-gray-300 dark:border-zinc-700 rounded-lg shadow-sm fade-hover animate-fade-in">
            <TableHeader>
              <TableRow>
                <TableHead className="border border-gray-300 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800">Sub. Code</TableHead>
                <TableHead className="border border-gray-300 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800">Abbreviation</TableHead>
                <TableHead className="border border-gray-300 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800">Course Title</TableHead>
                <TableHead className="border border-gray-300 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800">Type</TableHead>
                <TableHead className="border border-gray-300 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800">Hours/Week</TableHead>
                <TableHead className="border border-gray-300 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800">Credits</TableHead>
                <TableHead className="border border-gray-300 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800">Faculty Name</TableHead>
                <TableHead className="border border-gray-300 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800">Faculty Email</TableHead>
                <TableHead className="border border-gray-300 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800">Specialization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => {
                // Find faculty assigned to this subject from the timetable
                let assignedFaculty = null;
                
                // Search through timetable to find which faculty is teaching this subject
                Object.values(currentTimetable || {}).forEach((daySlots: any) => {
                  Object.values(daySlots || {}).forEach((slot: any) => {
                    if (slot && slot.subjectCode === subject.code) {
                      assignedFaculty = getFacultyByName(slot.faculty);
                    }
                  });
                });
                
                return (
                  <TableRow key={subject.id}>
                    <TableCell className="border border-gray-300 dark:border-zinc-700 font-medium text-gray-800 dark:text-zinc-100">{subject.code}</TableCell>
                    <TableCell className="border border-gray-300 dark:border-zinc-700">
                      <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-800 transition-all duration-300 hover:scale-105">
                        {subject.abbreviation || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="border border-gray-300 dark:border-zinc-700 text-gray-800 dark:text-zinc-100">{subject.name}</TableCell>
                    <TableCell className="border border-gray-300 dark:border-zinc-700">
                      <Badge variant="outline" className={getSubjectTypeColor(subject.subject_type)}>
                        {subject.subject_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="border border-gray-300 dark:border-zinc-700 text-center text-gray-800 dark:text-zinc-100">{subject.hours_per_week}</TableCell>
                    <TableCell className="border border-gray-300 dark:border-zinc-700 text-center text-gray-800 dark:text-zinc-100">{subject.credits}</TableCell>
                    <TableCell className="border border-gray-300 dark:border-zinc-700 text-gray-800 dark:text-zinc-100">
                      {assignedFaculty ? assignedFaculty.name : 'Not Assigned'}
                    </TableCell>
                    <TableCell className="border border-gray-300 dark:border-zinc-700 text-gray-800 dark:text-zinc-100">
                      {assignedFaculty ? assignedFaculty.email || 'N/A' : 'N/A'}
                    </TableCell>
                    <TableCell className="border border-gray-300 dark:border-zinc-700 text-gray-800 dark:text-zinc-100">
                      {assignedFaculty && assignedFaculty.specialization ? 
                        assignedFaculty.specialization.join(', ') : 'N/A'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-300 dark:border-zinc-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {subjects.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-zinc-400">Total Subjects</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {faculty.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-zinc-400">Faculty Members</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {subjects.reduce((sum, subject) => sum + subject.hours_per_week, 0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-zinc-400">Hours per Week</div>
          </div>
        </div>
      </Card>

      {/* Timetable History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto dark:bg-zinc-900 dark:border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2 text-gray-800 dark:text-zinc-100">
              <History className="h-5 w-5 text-blue-600" />
              Timetable History
            </DialogTitle>
            <DialogDescription>
              View and manage previously generated timetables for this section
            </DialogDescription>
          </DialogHeader>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-zinc-400">Loading timetables...</p>
            </div>
          ) : storedTimetables.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400" />
              <p className="text-gray-600 dark:text-zinc-400">No stored timetables found</p>
              <p className="text-sm text-gray-500 dark:text-zinc-400">Generate a timetable first to see it here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {storedTimetables.map((timetable) => (
                <Card key={timetable.id} className="p-4 border border-gray-300 dark:border-zinc-700">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-800 dark:text-zinc-100">{timetable.name}</h3>
                        {timetable.is_active && (
                          <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-zinc-400 space-y-1">
                        <p>Created: {formatDate(timetable.created_at)}</p>
                        <p>Updated: {formatDate(timetable.updated_at)}</p>
                        {timetable.notes && <p>Notes: {timetable.notes}</p>}
                        {timetable.conflicts && timetable.conflicts.length > 0 && (
                          <p className="text-orange-600">
                            Conflicts: {timetable.conflicts.length}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleTimetableSelect(timetable)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 fade-hover"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      {!timetable.is_active && (
                        <Button
                          onClick={() => handleSetActive(timetable.id)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 fade-hover"
                        >
                          <Calendar className="h-4 w-4" />
                          Set Active
                        </Button>
                      )}
                      <Button
                        onClick={() => handleDeleteTimetable(timetable.id)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimetableViewer;
