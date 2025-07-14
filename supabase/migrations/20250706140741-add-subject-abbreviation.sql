-- Add abbreviation column to subjects table
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS abbreviation VARCHAR(10);

-- Add a unique constraint to ensure abbreviations are unique within the same department and year
ALTER TABLE subjects ADD CONSTRAINT subjects_abbreviation_unique 
UNIQUE (abbreviation, department_id, year_id);

-- Add an index for better performance when querying by abbreviation
CREATE INDEX IF NOT EXISTS idx_subjects_abbreviation ON subjects(abbreviation);

-- Update existing subjects with default abbreviations based on their names
UPDATE subjects 
SET abbreviation = UPPER(SUBSTRING(name FROM 1 FOR 3))
WHERE abbreviation IS NULL;

-- For subjects with names less than 3 characters, use the full name
UPDATE subjects 
SET abbreviation = UPPER(name)
WHERE abbreviation IS NULL AND LENGTH(name) < 3;

-- For subjects with special characters or spaces, create better abbreviations
UPDATE subjects 
SET abbreviation = CASE 
    WHEN name ILIKE '%programming%' THEN 'PROG'
    WHEN name ILIKE '%data structure%' THEN 'DS'
    WHEN name ILIKE '%algorithm%' THEN 'ALGO'
    WHEN name ILIKE '%database%' THEN 'DB'
    WHEN name ILIKE '%network%' THEN 'NET'
    WHEN name ILIKE '%operating system%' THEN 'OS'
    WHEN name ILIKE '%computer architecture%' THEN 'CA'
    WHEN name ILIKE '%software engineering%' THEN 'SE'
    WHEN name ILIKE '%web development%' THEN 'WEB'
    WHEN name ILIKE '%mobile%' THEN 'MOB'
    WHEN name ILIKE '%artificial intelligence%' THEN 'AI'
    WHEN name ILIKE '%machine learning%' THEN 'ML'
    WHEN name ILIKE '%cyber security%' THEN 'CS'
    WHEN name ILIKE '%cloud computing%' THEN 'CC'
    WHEN name ILIKE '%library%' THEN 'LIB'
    WHEN name ILIKE '%counseling%' THEN 'COUN'
    WHEN name ILIKE '%seminar%' THEN 'SEM'
    WHEN name ILIKE '%sports%' THEN 'SPORT'
    ELSE abbreviation
END
WHERE abbreviation ~ '^[A-Z]{1,3}$';

-- Add a check constraint to ensure abbreviations are uppercase and alphanumeric
ALTER TABLE subjects ADD CONSTRAINT subjects_abbreviation_format 
CHECK (abbreviation ~ '^[A-Z0-9]{1,10}$'); 