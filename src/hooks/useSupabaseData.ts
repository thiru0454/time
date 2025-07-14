import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Department {
  id: string;
  code: string;
  name: string;
}

export interface Year {
  id: string;
  year_name: string;
  year_number: number;
}

export interface Section {
  id: string;
  section_name: string;
  department_id: string;
  year_id: string;
  max_students: number;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  abbreviation?: string;
  subject_type: string;
  department_id: string;
  year_id: string;
  hours_per_week: number;
  credits: number;
}

export interface Faculty {
  id: string;
  name: string;
  email: string;
  department_id: string;
  specialization: string[];
  max_hours_per_week: number;
}

// Helper function to generate abbreviation from subject name
const generateAbbreviation = (name: string): string => {
  const words = name.trim().split(' ');
  
  // Handle common subject patterns
  if (name.toLowerCase().includes('programming')) return 'PROG';
  if (name.toLowerCase().includes('data structure')) return 'DS';
  if (name.toLowerCase().includes('algorithm')) return 'ALGO';
  if (name.toLowerCase().includes('database')) return 'DB';
  if (name.toLowerCase().includes('network')) return 'NET';
  if (name.toLowerCase().includes('operating system')) return 'OS';
  if (name.toLowerCase().includes('computer architecture')) return 'CA';
  if (name.toLowerCase().includes('software engineering')) return 'SE';
  if (name.toLowerCase().includes('web development')) return 'WEB';
  if (name.toLowerCase().includes('mobile')) return 'MOB';
  if (name.toLowerCase().includes('artificial intelligence')) return 'AI';
  if (name.toLowerCase().includes('machine learning')) return 'ML';
  if (name.toLowerCase().includes('cyber security')) return 'CS';
  if (name.toLowerCase().includes('cloud computing')) return 'CC';
  if (name.toLowerCase().includes('library')) return 'LIB';
  if (name.toLowerCase().includes('counseling')) return 'COUN';
  if (name.toLowerCase().includes('seminar')) return 'SEM';
  if (name.toLowerCase().includes('sports')) return 'SPORT';
  
  // Generate from first letters of words
  if (words.length >= 2) {
    return words.map(word => word.charAt(0)).join('').toUpperCase().substring(0, 4);
  }
  
  // Fallback to first 3-4 characters
  return name.substring(0, Math.min(4, name.length)).toUpperCase();
};

export const useSupabaseData = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch departments
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      
      if (deptError) throw deptError;
      setDepartments(deptData || []);

      // Fetch years
      const { data: yearData, error: yearError } = await supabase
        .from('years')
        .select('*')
        .order('year_number');
      
      if (yearError) throw yearError;
      setYears(yearData || []);

      // Fetch sections
      const { data: sectionData, error: sectionError } = await supabase
        .from('sections')
        .select('*')
        .order('section_name');
      
      if (sectionError) throw sectionError;
      setSections(sectionData || []);

      // Fetch subjects
      const { data: subjectData, error: subjectError } = await supabase
        .from('subjects')
        .select('*')
        .order('code');
      
      if (subjectError) throw subjectError;
      setSubjects(subjectData || []);

      // Fetch faculty
      const { data: facultyData, error: facultyError } = await supabase
        .from('faculty')
        .select('*')
        .order('name');
      
      if (facultyError) throw facultyError;
      setFaculty(facultyData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data from database",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addSubject = async (subject: Omit<Subject, 'id'>) => {
    try {
      // Validate required fields
      if (!subject.code || !subject.name || !subject.subject_type) {
        throw new Error("Code, name, and subject type are required");
      }

      if (!subject.department_id || !subject.year_id) {
        throw new Error("Department and year must be selected");
      }

      // Generate abbreviation if not provided
      const abbreviation = subject.abbreviation || generateAbbreviation(subject.name);

      const { data, error } = await supabase
        .from('subjects')
        .insert([{
          code: subject.code.trim(),
          name: subject.name.trim(),
          abbreviation: abbreviation.toUpperCase(),
          subject_type: subject.subject_type,
          department_id: subject.department_id,
          year_id: subject.year_id,
          hours_per_week: subject.hours_per_week || 3,
          credits: subject.credits || 3
        }])
        .select()
        .single();

      if (error) throw error;
      
      setSubjects(prev => [...prev, data]);
      toast({
        title: "Success",
        description: "Subject added successfully"
      });
      
      return data;
    } catch (error: any) {
      console.error('Error adding subject:', error);
      const errorMessage = error.message || "Failed to add subject";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateSubject = async (id: string, updates: Partial<Omit<Subject, 'id' | 'department_id' | 'year_id'>>) => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setSubjects(prev => prev.map(s => s.id === id ? data : s));
      toast({
        title: "Success",
        description: "Subject updated successfully"
      });
      
      return data;
    } catch (error: any) {
      console.error('Error updating subject:', error);
      toast({
        title: "Error",
        description: "Failed to update subject",
        variant: "destructive"
      });
      throw error;
    }
  };

  const addFaculty = async (facultyMember: Omit<Faculty, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('faculty')
        .insert([facultyMember])
        .select()
        .single();

      if (error) throw error;
      
      setFaculty(prev => [...prev, data]);
      toast({
        title: "Success",
        description: "Faculty member added successfully"
      });
      
      return data;
    } catch (error) {
      console.error('Error adding faculty:', error);
      toast({
        title: "Error",
        description: "Failed to add faculty member",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateFaculty = async (id: string, updates: Partial<Omit<Faculty, 'id' | 'department_id'>>) => {
    try {
      const { data, error } = await supabase
        .from('faculty')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setFaculty(prev => prev.map(f => f.id === id ? data : f));
      toast({
        title: "Success",
        description: "Faculty member updated successfully"
      });
      
      return data;
    } catch (error) {
      console.error('Error updating faculty:', error);
      toast({
        title: "Error",
        description: "Failed to update faculty member",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteSubject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSubjects(prev => prev.filter(s => s.id !== id));
      toast({
        title: "Success",
        description: "Subject deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast({
        title: "Error",
        description: "Failed to delete subject",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteFaculty = async (id: string) => {
    try {
      const { error } = await supabase
        .from('faculty')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setFaculty(prev => prev.filter(f => f.id !== id));
      toast({
        title: "Success",
        description: "Faculty member deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting faculty:', error);
      toast({
        title: "Error",
        description: "Failed to delete faculty member",
        variant: "destructive"
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    departments,
    years,
    sections,
    subjects,
    faculty,
    loading,
    setSubjects,
    setFaculty,
    addSubject,
    updateSubject,
    addFaculty,
    updateFaculty,
    deleteSubject,
    deleteFaculty,
    refetch: fetchData
  };
};
