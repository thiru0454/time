
-- First, let's see what subject types are currently allowed and update the constraint
-- Remove the existing constraint that's causing issues
ALTER TABLE subjects DROP CONSTRAINT IF EXISTS subjects_subject_type_check;

-- Add a new constraint that includes the mandatory subject types
ALTER TABLE subjects ADD CONSTRAINT subjects_subject_type_check 
CHECK (subject_type IN ('theory', 'lab', 'practical', 'tutorial', 'Theory', 'Lab', 'Practical', 'Tutorial', 'Library', 'Counseling', 'Seminar', 'Sports'));
