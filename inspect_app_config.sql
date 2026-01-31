
SELECT 
    column_name, 
    data_type 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'app_config';

SELECT 
    conname AS constraint_name, 
    pg_get_constraintdef(c.oid) 
FROM 
    pg_constraint c 
JOIN 
    pg_namespace n ON n.oid = c.connamespace 
WHERE 
    conrelid = 'app_config'::regclass;
