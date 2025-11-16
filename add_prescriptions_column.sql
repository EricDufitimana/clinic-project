-- Add prescriptions column as JSONB to medical_descriptions table
ALTER TABLE medical_descriptions 
ADD COLUMN IF NOT EXISTS prescriptions JSONB DEFAULT '[]'::jsonb;

-- Add comment
COMMENT ON COLUMN medical_descriptions.prescriptions IS 'Array of prescribed medications stored as JSONB';

