-- sql script to quickly discard the database (for testing along with schema.sql)
DROP TABLE IF EXISTS users  CASCADE;
DROP TABLE IF EXISTS locations  CASCADE;
DROP TABLE IF EXISTS issues  CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS issue_tags CASCADE;
DROP TABLE IF EXISTS reports CASCADE;