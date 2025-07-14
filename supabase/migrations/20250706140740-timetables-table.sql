-- Create timetables table for storing generated timetables
CREATE TABLE IF NOT EXISTS timetables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name VARCHAR(255) NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  year_id UUID REFERENCES years(id) ON DELETE CASCADE,
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  timetable_data JSONB NOT NULL,
  generation_settings JSONB,
  conflicts TEXT[],
  stats JSONB,
  is_active BOOLEAN DEFAULT true,
  created_by VARCHAR(255),
  notes TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_timetables_department_id ON timetables(department_id);
CREATE INDEX IF NOT EXISTS idx_timetables_year_id ON timetables(year_id);
CREATE INDEX IF NOT EXISTS idx_timetables_section_id ON timetables(section_id);
CREATE INDEX IF NOT EXISTS idx_timetables_is_active ON timetables(is_active);
CREATE INDEX IF NOT EXISTS idx_timetables_created_at ON timetables(created_at);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_timetables_updated_at 
  BEFORE UPDATE ON timetables 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations for now (can be restricted later)
CREATE POLICY "Allow all operations on timetables" ON timetables
  FOR ALL USING (true); 