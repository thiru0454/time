import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, X, Users, Save, AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData, Faculty, Subject } from '@/hooks/useSupabaseData';

interface FacultyManagerProps {
  faculty: Faculty[];
  setFaculty: (faculty: Faculty[]) => void;
  subjects: Subject[];
  selectedDepartment: string;
  selectedYear: string;
  selectedSection: string;
}

const FacultyManager: React.FC<FacultyManagerProps> = ({
  faculty,
  setFaculty,
  subjects,
  selectedDepartment,
  selectedYear,
  selectedSection
}) => {
  const [isAddingFaculty, setIsAddingFaculty] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<string | null>(null);
  const [newFaculty, setNewFaculty] = useState<Partial<Faculty>>({
    name: '',
    email: '',
    specialization: [],
    max_hours_per_week: 20
  });
  const [editFormData, setEditFormData] = useState<Partial<Faculty>>({});
  const [newSpecialization, setNewSpecialization] = useState('');
  const [editSpecialization, setEditSpecialization] = useState('');
  const [emailError, setEmailError] = useState('');
  const { toast } = useToast();
  const { addFaculty, updateFaculty, deleteFaculty } = useSupabaseData();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const checkEmailExists = (email: string, excludeId?: string) => {
    return faculty.some(f => f.email === email && f.id !== excludeId);
  };

  const handleAddFaculty = async () => {
    if (!selectedDepartment || !selectedYear || !selectedSection) {
      toast({
        title: "Selection Required",
        description: "Please select department, year, and section first.",
        variant: "destructive"
      });
      return;
    }

    if (!newFaculty.name || !newFaculty.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (!validateEmail(newFaculty.email!)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (checkEmailExists(newFaculty.email!)) {
      setEmailError('This email is already registered');
      return;
    }

    setEmailError('');

    try {
      const result = await addFaculty({
        name: newFaculty.name!,
        email: newFaculty.email!,
        department_id: selectedDepartment,
        specialization: newFaculty.specialization || [],
        max_hours_per_week: newFaculty.max_hours_per_week || 20
      });

      // Update local state immediately
      setFaculty([...faculty, result]);

      setNewFaculty({
        name: '',
        email: '',
        specialization: [],
        max_hours_per_week: 20
      });
      setIsAddingFaculty(false);
      
      toast({
        title: "Success",
        description: "Faculty member added successfully.",
      });
    } catch (error: any) {
      console.error('Error adding faculty:', error);
      
      if (error.code === '23505' && error.message.includes('faculty_email_key')) {
        setEmailError('This email is already registered');
        toast({
          title: "Duplicate Email",
          description: "A faculty member with this email already exists.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add faculty member. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleDeleteFaculty = async (id: string) => {
    if (!confirm('Are you sure you want to delete this faculty member?')) {
      return;
    }

    try {
      await deleteFaculty(id);
      
      // Update local state immediately
      setFaculty(faculty.filter(f => f.id !== id));
      
      toast({
        title: "Success",
        description: "Faculty member deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting faculty:', error);
      toast({
        title: "Error",
        description: "Failed to delete faculty member. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditFaculty = (facultyMember: Faculty) => {
    setEditingFaculty(facultyMember.id);
    setEditFormData({
      name: facultyMember.name,
      email: facultyMember.email,
      specialization: facultyMember.specialization || [],
      max_hours_per_week: facultyMember.max_hours_per_week
    });
    setEmailError('');
  };

  const handleSaveEdit = async () => {
    if (!editingFaculty || !editFormData.name || !editFormData.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (!validateEmail(editFormData.email!)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (checkEmailExists(editFormData.email!, editingFaculty)) {
      setEmailError('This email is already registered');
      return;
    }

    setEmailError('');

    try {
      const updates = {
        name: editFormData.name!,
        email: editFormData.email!,
        specialization: editFormData.specialization || [],
        max_hours_per_week: editFormData.max_hours_per_week || 20
      };

      const result = await updateFaculty(editingFaculty, updates);
      
      // Update local state immediately
      setFaculty(faculty.map(f => f.id === editingFaculty ? result : f));

      setEditingFaculty(null);
      setEditFormData({});
      setEditSpecialization('');
      
      toast({
        title: "Success",
        description: "Faculty member updated successfully.",
      });
    } catch (error: any) {
      console.error('Error updating faculty:', error);
      
      if (error.code === '23505' && error.message.includes('faculty_email_key')) {
        setEmailError('This email is already registered');
        toast({
          title: "Duplicate Email",
          description: "A faculty member with this email already exists.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update faculty member. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingFaculty(null);
    setEditFormData({});
    setEditSpecialization('');
    setEmailError('');
  };

  const addSpecialization = () => {
    if (newSpecialization.trim()) {
      setNewFaculty({
        ...newFaculty,
        specialization: [...(newFaculty.specialization || []), newSpecialization.trim()]
      });
      setNewSpecialization('');
    }
  };

  const removeSpecialization = (index: number) => {
    const updated = [...(newFaculty.specialization || [])];
    updated.splice(index, 1);
    setNewFaculty({...newFaculty, specialization: updated});
  };

  const addEditSpecialization = () => {
    if (editSpecialization.trim()) {
      setEditFormData({
        ...editFormData,
        specialization: [...(editFormData.specialization || []), editSpecialization.trim()]
      });
      setEditSpecialization('');
    }
  };

  const removeEditSpecialization = (index: number) => {
    const updated = [...(editFormData.specialization || [])];
    updated.splice(index, 1);
    setEditFormData({...editFormData, specialization: updated});
  };

  const handleEmailChange = (email: string, isEdit: boolean = false) => {
    setEmailError('');
    if (isEdit) {
      setEditFormData({...editFormData, email});
    } else {
      setNewFaculty({...newFaculty, email});
    }
  };

  if (!selectedDepartment || !selectedYear || !selectedSection) {
    return (
      <Card className="p-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Faculty Manager</h2>
        <p className="text-gray-600 mb-4">Please select department, year, and section from the dashboard first.</p>
        <Button variant="outline" onClick={() => window.history.back()}>
          Go Back to Dashboard
        </Button>
      </Card>
    );
  }

  return (
          <div className="space-y-6">
      <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm interactive-card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 text-glow">Faculty Management</h2>
          <Button 
            onClick={() => setIsAddingFaculty(true)}
            className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 interactive-button"
          >
            <Plus size={20} className="mr-2 floating-icon" />
            Add Faculty
          </Button>
        </div>

        {/* Add Faculty Form */}
        {isAddingFaculty && (
          <Card className="p-4 mb-6 bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 card-bounce">
            <h3 className="text-lg font-semibold mb-4 text-glow">Add New Faculty Member</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="form-card-animate">
                <label className="block text-sm font-medium mb-2">Name *</label>
                <Input
                  value={newFaculty.name || ''}
                  onChange={(e) => setNewFaculty({...newFaculty, name: e.target.value})}
                  placeholder="e.g., Dr. John Smith"
                  className="form-input-animate"
                />
              </div>
              <div className="form-card-animate">
                <label className="block text-sm font-medium mb-2">Email *</label>
                <Input
                  type="email"
                  value={newFaculty.email || ''}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="e.g., john.smith@college.edu"
                  className={`form-input-animate ${emailError ? 'border-red-500 error-shake' : ''}`}
                />
                {emailError && (
                  <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                    <AlertCircle size={14} className="floating-icon" />
                    {emailError}
                  </div>
                )}
              </div>
              <div className="form-card-animate">
                <label className="block text-sm font-medium mb-2">Max Hours per Week</label>
                <Input
                  type="number"
                  value={newFaculty.max_hours_per_week || 20}
                  onChange={(e) => setNewFaculty({...newFaculty, max_hours_per_week: parseInt(e.target.value)})}
                  min="1"
                  max="40"
                  className="form-input-animate"
                />
              </div>
              <div className="form-card-animate">
                <label className="block text-sm font-medium mb-2">Add Specialization</label>
                <div className="flex gap-2">
                  <Input
                    value={newSpecialization}
                    onChange={(e) => setNewSpecialization(e.target.value)}
                    placeholder="e.g., Data Structures"
                    onKeyPress={(e) => e.key === 'Enter' && addSpecialization()}
                    className="form-input-animate"
                  />
                  <Button type="button" onClick={addSpecialization} size="sm" className="interactive-button">
                    Add
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Specializations */}
            {newFaculty.specialization && newFaculty.specialization.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Specializations</label>
                <div className="flex flex-wrap gap-2">
                  {newFaculty.specialization.map((spec, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeSpecialization(index)}>
                      {spec} <X size={12} className="ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleAddFaculty} className="bg-green-600 hover:bg-green-700" disabled={!!emailError}>
                <Save size={16} className="mr-2" />
                Add Faculty
              </Button>
              <Button variant="outline" onClick={() => {
                setIsAddingFaculty(false);
                setEmailError('');
                setNewFaculty({
                  name: '',
                  email: '',
                  specialization: [],
                  max_hours_per_week: 20
                });
              }}>
                <X size={16} className="mr-2" />
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Faculty List */}
        <div className="space-y-4">
          {faculty.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>No faculty members added yet. Click "Add Faculty" to get started.</p>
            </div>
          ) : (
            faculty.map((facultyMember) => (
              <Card key={facultyMember.id} className="p-4 hover:bg-gray-50 transition-colors">
                {editingFaculty === facultyMember.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Edit Faculty Member</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Name *</label>
                        <Input
                          value={editFormData.name || ''}
                          onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                          placeholder="e.g., Dr. John Smith"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Email *</label>
                        <Input
                          type="email"
                          value={editFormData.email || ''}
                          onChange={(e) => handleEmailChange(e.target.value, true)}
                          placeholder="e.g., john.smith@college.edu"
                          className={emailError ? 'border-red-500' : ''}
                        />
                        {emailError && (
                          <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                            <AlertCircle size={14} />
                            {emailError}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Max Hours per Week</label>
                        <Input
                          type="number"
                          value={editFormData.max_hours_per_week || 20}
                          onChange={(e) => setEditFormData({...editFormData, max_hours_per_week: parseInt(e.target.value)})}
                          min="1"
                          max="40"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Add Specialization</label>
                        <div className="flex gap-2">
                          <Input
                            value={editSpecialization}
                            onChange={(e) => setEditSpecialization(e.target.value)}
                            placeholder="e.g., Data Structures"
                            onKeyPress={(e) => e.key === 'Enter' && addEditSpecialization()}
                          />
                          <Button type="button" onClick={addEditSpecialization} size="sm">
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Edit Specializations */}
                    {editFormData.specialization && editFormData.specialization.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Specializations</label>
                        <div className="flex flex-wrap gap-2">
                          {editFormData.specialization.map((spec, index) => (
                            <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeEditSpecialization(index)}>
                              {spec} <X size={12} className="ml-1" />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button onClick={handleSaveEdit} className="bg-green-600 hover:bg-green-700" disabled={!!emailError}>
                        <Save size={16} className="mr-2" />
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={handleCancelEdit}>
                        <X size={16} className="mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{facultyMember.name}</h3>
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          {facultyMember.email}
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                          {facultyMember.max_hours_per_week}h/week max
                        </Badge>
                      </div>
                      
                      {facultyMember.specialization && facultyMember.specialization.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className="text-sm text-gray-600 mr-2">Specializations:</span>
                          {facultyMember.specialization.map((spec, index) => (
                            <Badge key={index} variant="secondary">{spec}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditFaculty(facultyMember)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteFaculty(facultyMember.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default FacultyManager;
