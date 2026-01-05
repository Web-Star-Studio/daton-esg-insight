-- Add company_name column to mailing_list_contacts
ALTER TABLE mailing_list_contacts 
ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Add comment for clarity
COMMENT ON COLUMN mailing_list_contacts.company_name IS 'Nome da empresa (NOME no CSV)';
COMMENT ON COLUMN mailing_list_contacts.name IS 'Nome do contato que vai receber o email (CONTATO no CSV)';