-- Fix Abbreviation Column Error - Complete Integration
-- This script adds the abbreviation column to the subjects table and updates existing data

-- 1. Add abbreviation column to subjects table
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS abbreviation VARCHAR(10);

-- 2. Add unique constraint for abbreviation within department and year
ALTER TABLE subjects ADD CONSTRAINT IF NOT EXISTS subjects_abbreviation_unique 
UNIQUE (abbreviation, department_id, year_id);

-- 3. Add index for better performance
CREATE INDEX IF NOT EXISTS idx_subjects_abbreviation ON subjects(abbreviation);

-- 4. Update existing subjects with smart abbreviations
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
    WHEN name ILIKE '%physical education%' THEN 'PE'
    WHEN name ILIKE '%mathematics%' THEN 'MATH'
    WHEN name ILIKE '%physics%' THEN 'PHY'
    WHEN name ILIKE '%chemistry%' THEN 'CHEM'
    WHEN name ILIKE '%english%' THEN 'ENG'
    WHEN name ILIKE '%communication%' THEN 'COMM'
    WHEN name ILIKE '%economics%' THEN 'ECO'
    WHEN name ILIKE '%management%' THEN 'MGMT'
    WHEN name ILIKE '%marketing%' THEN 'MKT'
    WHEN name ILIKE '%finance%' THEN 'FIN'
    WHEN name ILIKE '%accounting%' THEN 'ACC'
    WHEN name ILIKE '%statistics%' THEN 'STAT'
    WHEN name ILIKE '%calculus%' THEN 'CALC'
    WHEN name ILIKE '%algebra%' THEN 'ALG'
    WHEN name ILIKE '%geometry%' THEN 'GEO'
    WHEN name ILIKE '%trigonometry%' THEN 'TRIG'
    WHEN name ILIKE '%differential%' THEN 'DIFF'
    WHEN name ILIKE '%integral%' THEN 'INT'
    WHEN name ILIKE '%linear%' THEN 'LIN'
    WHEN name ILIKE '%discrete%' THEN 'DISC'
    WHEN name ILIKE '%logic%' THEN 'LOGIC'
    WHEN name ILIKE '%design%' THEN 'DESIGN'
    WHEN name ILIKE '%analysis%' THEN 'ANAL'
    WHEN name ILIKE '%testing%' THEN 'TEST'
    WHEN name ILIKE '%deployment%' THEN 'DEPLOY'
    WHEN name ILIKE '%maintenance%' THEN 'MAINT'
    WHEN name ILIKE '%documentation%' THEN 'DOC'
    WHEN name ILIKE '%research%' THEN 'RES'
    WHEN name ILIKE '%project%' THEN 'PROJ'
    WHEN name ILIKE '%thesis%' THEN 'THESIS'
    WHEN name ILIKE '%internship%' THEN 'INTERN'
    WHEN name ILIKE '%workshop%' THEN 'WORK'
    WHEN name ILIKE '%laboratory%' THEN 'LAB'
    WHEN name ILIKE '%practical%' THEN 'PRAC'
    WHEN name ILIKE '%tutorial%' THEN 'TUT'
    WHEN name ILIKE '%theory%' THEN 'THEORY'
    ELSE UPPER(SUBSTRING(name FROM 1 FOR 4))
END
WHERE abbreviation IS NULL;

-- 5. For subjects with names less than 4 characters, use the full name
UPDATE subjects 
SET abbreviation = UPPER(name)
WHERE abbreviation IS NULL AND LENGTH(name) < 4;

-- 6. Add check constraint to ensure abbreviations are uppercase and alphanumeric
ALTER TABLE subjects ADD CONSTRAINT IF NOT EXISTS subjects_abbreviation_format 
CHECK (abbreviation ~ '^[A-Z0-9]{1,10}$');

-- 7. Verify the changes
SELECT 
    code,
    name,
    abbreviation,
    subject_type,
    department_id,
    year_id
FROM subjects 
ORDER BY department_id, year_id, code;

-- 8. Check for any duplicate abbreviations within the same department and year
SELECT 
    abbreviation, 
    department_id, 
    year_id, 
    COUNT(*) as count
FROM subjects 
WHERE abbreviation IS NOT NULL
GROUP BY abbreviation, department_id, year_id
HAVING COUNT(*) > 1;

-- 9. Check for any invalid abbreviations
SELECT 
    code,
    name,
    abbreviation
FROM subjects 
WHERE abbreviation IS NOT NULL 
AND abbreviation !~ '^[A-Z0-9]{1,10}$'; 