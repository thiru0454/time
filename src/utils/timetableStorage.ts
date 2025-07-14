import { supabase } from '@/integrations/supabase/client';
import { TimetableGenerationResult } from '@/types/timetable';
import { GenerationSettings } from '@/types/timetable';

export interface StoredTimetable {
  id: string;
  name: string;
  department_id: string;
  year_id: string;
  section_id: string;
  timetable_data: any;
  generation_settings: any;
  conflicts: string[] | null;
  stats: any;
  is_active: boolean;
  created_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaveTimetableParams {
  name: string;
  department_id: string;
  year_id: string;
  section_id: string;
  timetable_data: any;
  generation_settings: any;
  conflicts: string[];
  stats: any;
  created_by?: string;
  notes?: string;
}

/**
 * Save a generated timetable to the database
 */
export async function saveTimetable(params: SaveTimetableParams): Promise<StoredTimetable | null> {
  try {
    const { data, error } = await supabase
      .from('timetables')
      .insert({
        name: params.name,
        department_id: params.department_id,
        year_id: params.year_id,
        section_id: params.section_id,
        timetable_data: params.timetable_data,
        generation_settings: params.generation_settings,
        conflicts: params.conflicts,
        stats: params.stats,
        created_by: params.created_by || 'System',
        notes: params.notes,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving timetable:', error);
      throw error;
    }

    return data as unknown as StoredTimetable;
  } catch (error) {
    console.error('Failed to save timetable:', error);
    throw error;
  }
}

/**
 * Get all timetables for a specific department, year, and section
 */
export async function getTimetables(
  department_id: string,
  year_id: string,
  section_id: string
): Promise<StoredTimetable[]> {
  try {
    const { data, error } = await supabase
      .from('timetables')
      .select('*')
      .eq('department_id', department_id)
      .eq('year_id', year_id)
      .eq('section_id', section_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching timetables:', error);
      throw error;
    }

    return data as unknown as StoredTimetable[];
  } catch (error) {
    console.error('Failed to fetch timetables:', error);
    throw error;
  }
}

/**
 * Get a specific timetable by ID
 */
export async function getTimetableById(id: string): Promise<StoredTimetable | null> {
  try {
    const { data, error } = await supabase
      .from('timetables')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching timetable:', error);
      throw error;
    }

    return data as unknown as StoredTimetable;
  } catch (error) {
    console.error('Failed to fetch timetable:', error);
    throw error;
  }
}

/**
 * Update a timetable
 */
export async function updateTimetable(
  id: string,
  updates: Partial<SaveTimetableParams>
): Promise<StoredTimetable | null> {
  try {
    const { data, error } = await supabase
      .from('timetables')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating timetable:', error);
      throw error;
    }

    return data as unknown as StoredTimetable;
  } catch (error) {
    console.error('Failed to update timetable:', error);
    throw error;
  }
}

/**
 * Delete a timetable (soft delete by setting is_active to false)
 */
export async function deleteTimetable(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('timetables')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting timetable:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Failed to delete timetable:', error);
    throw error;
  }
}

/**
 * Set a timetable as the active one for a department/year/section
 */
export async function setActiveTimetable(id: string): Promise<boolean> {
  try {
    // First, get the timetable to get its department, year, and section
    const timetable = await getTimetableById(id);
    if (!timetable) {
      throw new Error('Timetable not found');
    }

    // Set all other timetables for this department/year/section as inactive
    const { error: deactivateError } = await supabase
      .from('timetables')
      .update({ is_active: false })
      .eq('department_id', timetable.department_id)
      .eq('year_id', timetable.year_id)
      .eq('section_id', timetable.section_id);

    if (deactivateError) {
      console.error('Error deactivating other timetables:', deactivateError);
      throw deactivateError;
    }

    // Set the selected timetable as active
    const { error: activateError } = await supabase
      .from('timetables')
      .update({ is_active: true })
      .eq('id', id);

    if (activateError) {
      console.error('Error activating timetable:', activateError);
      throw activateError;
    }

    return true;
  } catch (error) {
    console.error('Failed to set active timetable:', error);
    throw error;
  }
}

/**
 * Get the active timetable for a department/year/section
 */
export async function getActiveTimetable(
  department_id: string,
  year_id: string,
  section_id: string
): Promise<StoredTimetable | null> {
  try {
    const { data, error } = await supabase
      .from('timetables')
      .select('*')
      .eq('department_id', department_id)
      .eq('year_id', year_id)
      .eq('section_id', section_id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No active timetable found
        return null;
      }
      console.error('Error fetching active timetable:', error);
      throw error;
    }

    return data as unknown as StoredTimetable;
  } catch (error) {
    console.error('Failed to fetch active timetable:', error);
    throw error;
  }
}

/**
 * Generate a default timetable name based on department, year, and section
 */
export function generateTimetableName(
  departmentName: string,
  yearName: string,
  sectionName: string
): string {
  const timestamp = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return `${departmentName} - ${yearName} ${sectionName} (${timestamp})`;
} 