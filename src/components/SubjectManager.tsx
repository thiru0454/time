import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, BookOpen, Clock, Users, Calendar, UserCheck, Star, AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Subject, Faculty, useSupabaseData } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';

interface SubjectManagerProps {
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  selectedDepartment: string;
  selectedYear: string;
  selectedSection: string;
}

interface SubjectAssignment {
  id: string;
  subject_id: string;
  faculty_id: string;
  section_id: string;
  faculty?: Faculty;
}

// Valid subject types that match the database constraint
const VALID_SUBJECT_TYPES = [
  'theory',
  'practical', 
  'lab',
  'tutorial'
];

const SubjectManager: React.FC<SubjectManagerProps> = ({
  subjects,
  setSubjects,
  selectedDepartment,
  selectedYear,
  selectedSection
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAssignFacultyDialogOpen, setIsAssignFacultyDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [assigningSubject, setAssigningSubject] = useState<Subject | null>(null);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [subjectAssignments, setSubjectAssignments] = useState<SubjectAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddingMandatory, setIsAddingMandatory] = useState(false);
  const { toast } = useToast();
  const { 
    departments, 
    years, 
    sections, 
    faculty, 
    addSubject, 
    updateSubject, 
    deleteSubject
  } = useSupabaseData();

  const [newSubject, setNewSubject] = useState({
    code: '',
    name: '',
    abbreviation: '',
    subject_type: '',
    hours_per_week: 3,
    credits: 1,
    department_id: selectedDepartment,
    year_id: selectedYear
  });

  // Fetch subject assignments
  const fetchSubjectAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('subject_assignments')
        .select(`
          *,
          faculty:faculty_id (*)
        `)
        .eq('section_id', selectedSection);

      if (error) throw error;
      setSubjectAssignments(data || []);
    } catch (error) {
      console.error('Error fetching subject assignments:', error);
    }
  };

  useEffect(() => {
    if (selectedSection) {
      fetchSubjectAssignments();
    }
  }, [selectedSection]);

  const getAssignedFaculty = (subjectId: string) => {
    const assignment = subjectAssignments.find(a => a.subject_id === subjectId);
    return assignment?.faculty;
  };

  const handleAssignFaculty = async () => {
    if (!assigningSubject || !selectedFacultyId) return;

    setIsLoading(true);
    try {
      // Check if already assigned
      const existingAssignment = subjectAssignments.find(
        a => a.subject_id === assigningSubject.id
      );

      if (existingAssignment) {
        // Update existing assignment
        const { error } = await supabase
          .from('subject_assignments')
          .update({ faculty_id: selectedFacultyId })
          .eq('id', existingAssignment.id);

        if (error) throw error;
      } else {
        // Create new assignment
        const { error } = await supabase
          .from('subject_assignments')
          .insert({
            subject_id: assigningSubject.id,
            faculty_id: selectedFacultyId,
            section_id: selectedSection
          });

        if (error) throw error;
      }

      await fetchSubjectAssignments();
      setIsAssignFacultyDialogOpen(false);
      setAssigningSubject(null);
      setSelectedFacultyId('');
      
      toast({
        title: "Success",
        description: "Faculty assigned successfully"
      });
    } catch (error: any) {
      console.error('Error assigning faculty:', error);
      toast({
        title: "Error",
        description: "Failed to assign faculty",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnassignFaculty = async (subjectId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('subject_assignments')
        .delete()
        .eq('subject_id', subjectId)
        .eq('section_id', selectedSection);

      if (error) throw error;

      await fetchSubjectAssignments();
      toast({
        title: "Success",
        description: "Faculty unassigned successfully"
      });
    } catch (error: any) {
      console.error('Error unassigning faculty:', error);
      toast({
        title: "Error",
        description: "Failed to unassign faculty",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openAssignFacultyDialog = (subject: Subject) => {
    setAssigningSubject(subject);
    const currentAssignment = getAssignedFaculty(subject.id);
    setSelectedFacultyId(currentAssignment?.id || '');
    setIsAssignFacultyDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    setNewSubject({ ...newSubject, [field]: e.target.value });
  };

  const handleSelectChange = (value: string, field: string) => {
    setNewSubject({ ...newSubject, [field]: value });
  };

  const handleAddSubject = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!selectedDepartment || !selectedYear) {
        setError("Department and Year must be selected.");
        return;
      }

      // Validate subject type
      if (!VALID_SUBJECT_TYPES.includes(newSubject.subject_type.toLowerCase())) {
        setError("Please select a valid subject type.");
        return;
      }

      const subjectToAdd = {
        ...newSubject,
        subject_type: newSubject.subject_type.toLowerCase(), // Ensure lowercase
        department_id: selectedDepartment,
        year_id: selectedYear
      };
      
      const newSubjectData = await addSubject(subjectToAdd);
      setNewSubject({
        code: '',
        name: '',
        abbreviation: '',
        subject_type: '',
        hours_per_week: 3,
        credits: 1,
        department_id: selectedDepartment,
        year_id: selectedYear
      });
      setIsAddDialogOpen(false);
      
      // Update local state immediately
      setSubjects(prev => [...prev, newSubjectData]);
    } catch (err: any) {
      setError(err.message || "Failed to add subject");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubject = async () => {
    if (!editingSubject) return;

    setIsLoading(true);
    setError(null);

    try {
      // Validate subject type for editing
      if (!VALID_SUBJECT_TYPES.includes(editingSubject.subject_type.toLowerCase())) {
        setError("Please select a valid subject type.");
        return;
      }

      const { id } = editingSubject;
      const updates = {
        code: editingSubject.code,
        name: editingSubject.name,
        abbreviation: editingSubject.abbreviation?.toUpperCase(),
        subject_type: editingSubject.subject_type.toLowerCase(), // Ensure lowercase
        hours_per_week: editingSubject.hours_per_week,
        credits: editingSubject.credits
      };
      
      const updatedSubjectData = await updateSubject(id, updates);
      setEditingSubject(null);
      setIsEditDialogOpen(false);
      
      // Update local state immediately
      setSubjects(prev => prev.map(s => s.id === id ? updatedSubjectData : s));
      
      toast({
        title: "Success",
        description: "Subject updated successfully"
      });
    } catch (err: any) {
      setError(err.message || "Failed to update subject");
      toast({
        title: "Error",
        description: "Failed to update subject",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await deleteSubject(id);
      
      // Update local state immediately
      setSubjects(prev => prev.filter(s => s.id !== id));
      
      toast({
        title: "Success",
        description: "Subject deleted successfully"
      });
    } catch (err: any) {
      setError(err.message || "Failed to delete subject");
      toast({
        title: "Error",
        description: "Failed to delete subject",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (subject: Subject) => {
    setEditingSubject({ ...subject });
    setIsEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditingSubject(null);
    setIsEditDialogOpen(false);
  };

  const addMandatorySubjects = async () => {
    if (!selectedDepartment || !selectedYear) {
      toast({
        title: "Selection Required",
        description: "Please select department and year first.",
        variant: "destructive"
      });
      return;
    }

    setIsAddingMandatory(true);
    const yearData = years.find(y => y.id === selectedYear);
    
    const mandatorySubjects = [
      {
        code: `LIB${yearData?.year_number || ''}01`,
        name: 'Library Hour',
        subject_type: 'theory', // Use lowercase
        hours_per_week: 1,
        credits: 1,
        department_id: selectedDepartment,
        year_id: selectedYear,
        is_mandatory: true,
        preferred_day: 'SAT'
      },
      {
        code: `SC${yearData?.year_number || ''}01`,
        name: 'Student Counseling',
        subject_type: 'theory', // Use lowercase
        hours_per_week: 2,
        credits: 1,
        department_id: selectedDepartment,
        year_id: selectedYear,
        is_mandatory: true,
        preferred_day: 'SAT'
      },
      {
        code: `SEM${yearData?.year_number || ''}01`,
        name: 'Seminar',
        subject_type: 'theory', // Use lowercase
        hours_per_week: 2,
        credits: 1,
        department_id: selectedDepartment,
        year_id: selectedYear,
        is_mandatory: true,
        preferred_day: 'SAT'
      }
    ];

    // Add Sports only for 1st year
    if (yearData?.year_number === 1) {
      mandatorySubjects.push({
        code: `SPORTS${yearData.year_number}01`,
        name: 'Sports & Physical Education',
        subject_type: 'practical', // Use lowercase
        hours_per_week: 2,
        credits: 1,
        department_id: selectedDepartment,
        year_id: selectedYear,
        is_mandatory: true,
        preferred_day: 'SAT'
      });
    }

    try {
      let addedCount = 0;
      let skippedCount = 0;

      for (const subject of mandatorySubjects) {
        const exists = subjects.some(s => 
          s.code === subject.code && 
          s.year_id === selectedYear && 
          s.department_id === selectedDepartment
        );
        
        if (!exists) {
          await addSubject(subject);
          addedCount++;
        } else {
          skippedCount++;
        }
      }

      toast({
        title: "Mandatory Subjects Processing Complete",
        description: `${addedCount} subjects added, ${skippedCount} already existed.`,
        duration: 4000
      });
    } catch (error) {
      console.error('Error adding mandatory subjects:', error);
      toast({
        title: "Error",
        description: "Failed to add some mandatory subjects",
        variant: "destructive"
      });
    } finally {
      setIsAddingMandatory(false);
    }
  };

  const getMandatorySubjects = () => {
    return subjects.filter(s => 
      s.name?.toLowerCase().includes('library') ||
      s.name?.toLowerCase().includes('counseling') ||
      s.name?.toLowerCase().includes('seminar') ||
      s.name?.toLowerCase().includes('sports')
    );
  };

  const getRegularSubjects = () => {
    return subjects.filter(s => 
      !s.name?.toLowerCase().includes('library') &&
      !s.name?.toLowerCase().includes('counseling') &&
      !s.name?.toLowerCase().includes('seminar') &&
      !s.name?.toLowerCase().includes('sports')
    );
  };

  const mandatorySubjects = getMandatorySubjects();
  const regularSubjects = getRegularSubjects();

  return (
          <div className="space-y-6 pb-20">
      <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm interactive-card dark:bg-zinc-900 dark:border-zinc-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
                          <BookOpen className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800 text-glow dark:text-zinc-100">Subject Management</h2>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={addMandatorySubjects}
              disabled={isAddingMandatory}
              variant="outline"
              className="flex items-center gap-2 interactive-button hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 border-green-300 text-green-700 hover:border-green-400 dark:hover:from-green-900 dark:hover:to-blue-900"
            >
              {isAddingMandatory ? (
                <>
                  <div className="loading-spinner rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Star className="h-4 w-4" />
                  Add Mandatory Subjects
                </>
              )}
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 interactive-button bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-900 dark:to-purple-900">
                  <Plus size={16} />
                  Add Subject
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto dialog-animate dark:bg-zinc-900 dark:border-zinc-700">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-glow dark:text-zinc-100">Add New Subject</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="space-y-2 form-card-animate dark:bg-zinc-800 dark:border-zinc-700">
                    <Label htmlFor="code" className="text-sm font-medium dark:text-zinc-200">Subject Code</Label>
                    <Input
                      id="code"
                      value={newSubject.code}
                      onChange={(e) => setNewSubject({...newSubject, code: e.target.value})}
                      placeholder="e.g., CSE101"
                      className="form-input-animate dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
                    />
                  </div>
                  <div className="space-y-2 form-card-animate dark:bg-zinc-800 dark:border-zinc-700">
                    <Label htmlFor="name" className="text-sm font-medium dark:text-zinc-200">Subject Name</Label>
                    <Input
                      id="name"
                      value={newSubject.name}
                      onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                      placeholder="e.g., Programming Fundamentals"
                      className="form-input-animate dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
                    />
                  </div>
                  <div className="space-y-2 form-card-animate dark:bg-zinc-800 dark:border-zinc-700">
                    <Label htmlFor="abbreviation" className="text-sm font-medium dark:text-zinc-200">Subject Abbreviation</Label>
                    <Input
                      id="abbreviation"
                      value={newSubject.abbreviation}
                      onChange={(e) => setNewSubject({...newSubject, abbreviation: e.target.value.toUpperCase()})}
                      placeholder="e.g., PROG (auto-generated)"
                      className="form-input-animate dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
                      maxLength={10}
                    />
                    <p className="text-xs text-gray-500 dark:text-zinc-400">Leave empty for auto-generation</p>
                  </div>
                  <div className="space-y-2 form-card-animate dark:bg-zinc-800 dark:border-zinc-700">
                    <Label htmlFor="type" className="text-sm font-medium dark:text-zinc-200">Subject Type</Label>
                    <Select value={newSubject.subject_type} onValueChange={(value) => setNewSubject({...newSubject, subject_type: value})}>
                      <SelectTrigger className="form-input-animate dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200">
                        <SelectItem value="theory">Theory</SelectItem>
                        <SelectItem value="practical">Practical</SelectItem>
                        <SelectItem value="lab">Lab</SelectItem>
                        <SelectItem value="tutorial">Tutorial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 form-card-animate dark:bg-zinc-800 dark:border-zinc-700">
                    <Label htmlFor="hours" className="text-sm font-medium dark:text-zinc-200">Hours per Week</Label>
                    <Input
                      id="hours"
                      type="number"
                      min="1"
                      max="10"
                      value={newSubject.hours_per_week}
                      onChange={(e) => setNewSubject({...newSubject, hours_per_week: parseInt(e.target.value) || 1})}
                      className="form-input-animate dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
                    />
                  </div>
                  <div className="space-y-2 form-card-animate dark:bg-zinc-800 dark:border-zinc-700">
                    <Label htmlFor="credits" className="text-sm font-medium dark:text-zinc-200">Credits</Label>
                    <Input
                      id="credits"
                      type="number"
                      min="1"
                      max="6"
                      value={newSubject.credits}
                      onChange={(e) => setNewSubject({...newSubject, credits: parseInt(e.target.value) || 1})}
                      className="form-input-animate dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
                    />
                  </div>
                </div>
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md dark:bg-red-900 dark:border-red-800 dark:text-red-200">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <p className="text-sm">{error}</p>
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-2 mt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                    className="dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddSubject} 
                    disabled={isLoading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-900 dark:to-purple-900"
                  >
                    {isLoading ? 'Adding...' : 'Add Subject'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Mandatory Subjects Alert */}
        {mandatorySubjects.length > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg dark:from-green-900 dark:to-blue-900 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-800 dark:text-green-200">Mandatory Subjects (Saturday Only)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              {mandatorySubjects.map(subject => (
                <Badge key={subject.id} variant="outline" className="bg-green-100 text-green-800 border-green-300 justify-center py-1 dark:bg-green-900 dark:text-green-200 dark:border-green-800">
                  {subject.name} ({subject.hours_per_week}h)
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 dark:from-zinc-900 dark:to-zinc-800 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Subjects</p>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{subjects.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-r from-green-50 to-green-100 border-green-200 dark:from-green-900 dark:to-green-800 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Mandatory</p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-200">{mandatorySubjects.length}</p>
              </div>
              <Star className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 dark:from-purple-900 dark:to-purple-800 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Regular</p>
                <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">{regularSubjects.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 dark:from-orange-900 dark:to-orange-800 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Total Hours</p>
                <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                  {subjects.reduce((sum, s) => sum + (s.hours_per_week || 0), 0)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </Card>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Abbreviation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Credits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Assigned Faculty</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-zinc-800 dark:divide-zinc-700">
              {subjects.map((subject, index) => {
                const assignedFaculty = getAssignedFaculty(subject.id);
                const isMandatory = mandatorySubjects.some(m => m.id === subject.id);
                
                return (
                  <tr key={subject.id} className={`hover:bg-gradient-to-r ${
                    isMandatory ? 'hover:from-green-50 hover:to-blue-50 bg-green-25 dark:hover:from-green-900 dark:hover:to-blue-900' : 'hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900 dark:hover:to-purple-900'
                  }`}>
                    <td className="px-6 py-4 whitespace-nowrap dark:text-zinc-200">
                      <div className="flex items-center gap-2">
                        {isMandatory && <Star className="h-4 w-4 text-green-600" />}
                        <span className="font-medium">{subject.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap dark:text-zinc-200">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800">
                          {subject.abbreviation || 'N/A'}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap dark:text-zinc-200">
                      <div className="flex items-center gap-2">
                        {subject.name}
                        {isMandatory && (
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-xs dark:bg-green-900 dark:text-green-200 dark:border-green-800">
                            SAT
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap dark:text-zinc-200">
                      <Badge variant="secondary" className="capitalize dark:bg-zinc-700 dark:text-zinc-200">{subject.subject_type}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap dark:text-zinc-200">{subject.hours_per_week}</td>
                    <td className="px-6 py-4 whitespace-nowrap dark:text-zinc-200">{subject.credits}</td>
                    <td className="px-6 py-4 whitespace-nowrap dark:text-zinc-200">
                      {assignedFaculty ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800">
                            {assignedFaculty.name}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnassignFaculty(subject.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900"
                            title="Unassign Faculty"
                          >
                            ×
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-600 dark:bg-zinc-700 dark:text-zinc-400">
                          Not Assigned
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right dark:text-zinc-200">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openAssignFacultyDialog(subject)}
                          className="hover:bg-green-50 dark:hover:bg-green-900"
                          title="Assign Faculty"
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEditDialog(subject)}
                          className="hover:bg-blue-50 dark:hover:bg-blue-900"
                          title="Edit Subject"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDeleteSubject(subject.id)}
                          disabled={isLoading}
                          className="dark:hover:bg-red-900"
                          title="Delete Subject"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={closeEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto dark:bg-zinc-900 dark:border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold dark:text-zinc-100">Edit Subject</DialogTitle>
          </DialogHeader>
          {editingSubject && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-2 dark:bg-zinc-800 dark:border-zinc-700">
                <Label htmlFor="edit-code" className="text-sm font-medium dark:text-zinc-200">Subject Code</Label>
                <Input
                  id="edit-code"
                  value={editingSubject.code}
                  onChange={(e) => setEditingSubject({ ...editingSubject, code: e.target.value })}
                  placeholder="e.g., CSE101"
                  className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
                />
              </div>
              <div className="space-y-2 dark:bg-zinc-800 dark:border-zinc-700">
                <Label htmlFor="edit-name" className="text-sm font-medium dark:text-zinc-200">Subject Name</Label>
                <Input
                  id="edit-name"
                  value={editingSubject.name}
                  onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                  placeholder="e.g., Programming Fundamentals"
                  className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
                />
              </div>
              <div className="space-y-2 dark:bg-zinc-800 dark:border-zinc-700">
                <Label htmlFor="edit-abbreviation" className="text-sm font-medium dark:text-zinc-200">Subject Abbreviation</Label>
                <Input
                  id="edit-abbreviation"
                  value={editingSubject.abbreviation || ''}
                  onChange={(e) => setEditingSubject({ ...editingSubject, abbreviation: e.target.value.toUpperCase() })}
                  placeholder="e.g., PROG"
                  className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
                  maxLength={10}
                />
              </div>
              <div className="space-y-2 dark:bg-zinc-800 dark:border-zinc-700">
                <Label htmlFor="edit-type" className="text-sm font-medium dark:text-zinc-200">Subject Type</Label>
                <Select 
                  value={editingSubject.subject_type} 
                  onValueChange={(value) => setEditingSubject({ ...editingSubject, subject_type: value })}
                >
                  <SelectTrigger className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200">
                    <SelectItem value="theory">Theory</SelectItem>
                    <SelectItem value="practical">Practical</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                    <SelectItem value="tutorial">Tutorial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 dark:bg-zinc-800 dark:border-zinc-700">
                <Label htmlFor="edit-hours" className="text-sm font-medium dark:text-zinc-200">Hours per Week</Label>
                <Input
                  id="edit-hours"
                  type="number"
                  min="1"
                  max="10"
                  value={editingSubject.hours_per_week}
                  onChange={(e) => setEditingSubject({ ...editingSubject, hours_per_week: parseInt(e.target.value) || 1 })}
                  className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
                />
              </div>
              <div className="space-y-2 dark:bg-zinc-800 dark:border-zinc-700">
                <Label htmlFor="edit-credits" className="text-sm font-medium dark:text-zinc-200">Credits</Label>
                <Input
                  id="edit-credits"
                  type="number"
                  min="1"
                  max="6"
                  value={editingSubject.credits}
                  onChange={(e) => setEditingSubject({ ...editingSubject, credits: parseInt(e.target.value) || 1 })}
                  className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
                />
              </div>
            </div>
          )}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md dark:bg-red-900 dark:border-red-800 dark:text-red-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={closeEditDialog}
              className="dark:hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditSubject} 
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-900 dark:to-purple-900"
            >
              {isLoading ? 'Updating...' : 'Update Subject'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Faculty Dialog */}
      <Dialog open={isAssignFacultyDialogOpen} onOpenChange={setIsAssignFacultyDialogOpen}>
        <DialogContent className="max-w-2xl dark:bg-zinc-900 dark:border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2 dark:text-zinc-100">
              <UserCheck className="h-5 w-5 text-blue-600" />
              Assign Faculty to {assigningSubject?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-blue-50 rounded-lg dark:bg-blue-900">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Subject:</strong> {assigningSubject?.code} - {assigningSubject?.name}
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Type:</strong> {assigningSubject?.subject_type}
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Hours per Week:</strong> {assigningSubject?.hours_per_week}
              </p>
            </div>
            
            <div className="space-y-2 dark:bg-zinc-800 dark:border-zinc-700">
              <Label htmlFor="faculty-select" className="text-sm font-medium dark:text-zinc-200">Select Faculty</Label>
              <Select value={selectedFacultyId} onValueChange={setSelectedFacultyId}>
                <SelectTrigger className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200">
                  <SelectValue placeholder="Choose a faculty member" />
                </SelectTrigger>
                <SelectContent className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200">
                  {faculty
                    .filter(f => f.department_id === selectedDepartment)
                    .map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{f.name}</span>
                          <span className="text-xs text-gray-600 dark:text-zinc-400">{f.email}</span>
                          {f.specialization && f.specialization.length > 0 && (
                            <span className="text-xs text-blue-600 dark:text-blue-400">
                              Specialization: {f.specialization.join(', ')}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAssignFacultyDialogOpen(false);
                setAssigningSubject(null);
                setSelectedFacultyId('');
              }}
              className="dark:hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAssignFaculty} 
              disabled={isLoading || !selectedFacultyId}
              className="bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-900 dark:to-blue-900"
            >
              {isLoading ? 'Assigning...' : 'Assign Faculty'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubjectManager;
