-- NaviSafe Database Setup for MariaDB
-- Run this script in phpMyAdmin or MySQL command line
-- This creates views to connect your existing tables to the React frontend

-- ============================================
-- STEP 1: Verify Your Existing Tables
-- ============================================

-- Check if all required tables exist
SHOW TABLES;

-- Expected tables:
-- userInfo, userAuth, userRole, organisation, registrations

-- ============================================
-- STEP 2: Check Current Table Structure
-- ============================================

-- View userInfo structure
DESCRIBE userInfo;

-- View userAuth structure
DESCRIBE userAuth;

-- View userRole structure
DESCRIBE userRole;

-- View organisation structure
DESCRIBE organisation;

-- View registrations structure
DESCRIBE registrations;

-- ============================================
-- STEP 3: Add Missing Columns (if needed)
-- ============================================

-- Add geometry column to registrations if it doesn't exist
-- Check first if column exists:
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'registrations' 
AND COLUMN_NAME = 'geometry';

-- If geometry column doesn't exist, add it:
-- ALTER TABLE registrations 
-- ADD COLUMN geometry JSON,
-- ADD COLUMN geometryType VARCHAR(20) DEFAULT 'Point';

-- Add status column if it doesn't exist
-- ALTER TABLE registrations 
-- ADD COLUMN status VARCHAR(20) DEFAULT 'Draft';

-- Add timestamps if they don't exist
-- ALTER TABLE registrations 
-- ADD COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
-- ADD COLUMN updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- ============================================
-- STEP 4: Create Database Views
-- ============================================

-- Drop existing views if they exist
DROP VIEW IF EXISTS vw_Users;
DROP VIEW IF EXISTS vw_ObstacleReports;

-- Create Users view (maps your tables to frontend format)
CREATE VIEW vw_Users AS
SELECT 
    ui.userId as id,
    ua.username as username,
    ui.email as email,
    ur.roleName as role,
    o.organisationName as organization,
    ui.createdAt as created_at
FROM userInfo ui
INNER JOIN userAuth ua ON ui.userId = ua.userId
INNER JOIN userRole ur ON ui.roleId = ur.roleId
LEFT JOIN organisation o ON ui.organisationId = o.organisationId;

-- Create ObstacleReports view (maps registrations to frontend format)
CREATE VIEW vw_ObstacleReports AS
SELECT 
    r.registrationId as id,
    r.reporterId as reporter_id,
    CONCAT(ui.firstName, ' ', ui.lastName) as reporter_name,
    o.organisationName as organization,
    r.obstacleType as obstacle_type,
    r.geometryType as geometry_type,
    r.geometry as geometry,
    r.heightMeters as height_meters,
    r.description as description,
    r.comments as comments,
    r.photoUrl as photo_url,
    r.status as status,
    r.createdAt as created_at,
    r.updatedAt as updated_at,
    r.reporterPosition as reporter_position,
    r.reporterPositionAccuracy as reporter_position_accuracy
FROM registrations r
INNER JOIN userInfo ui ON r.reporterId = ui.userId
LEFT JOIN organisation o ON ui.organisationId = o.organisationId;

-- ============================================
-- STEP 5: Test the Views
-- ============================================

-- Test Users view
SELECT * FROM vw_Users LIMIT 5;

-- Test ObstacleReports view
SELECT * FROM vw_ObstacleReports LIMIT 5;

-- ============================================
-- STEP 6: Verify Data Types
-- ============================================

-- Check that role names match expected values
SELECT DISTINCT roleName FROM userRole;
-- Expected: 'pilot', 'admin' (case-sensitive!)

-- Check that organisation names are correct
SELECT DISTINCT organisationName FROM organisation;
-- Expected: 'NLA', 'Luftforsvaret', 'Politiet'

-- Check obstacle types
SELECT DISTINCT obstacleType FROM registrations;
-- Expected: 'Tower', 'Power Line', 'Wind Turbine', 'Building', 'Other'

-- Check status values
SELECT DISTINCT status FROM registrations;
-- Expected: 'Draft', 'Submitted', 'Approved'

-- ============================================
-- STEP 7: Fix Data if Necessary
-- ============================================

-- If role names don't match, update them:
-- UPDATE userRole SET roleName = 'pilot' WHERE roleName = 'Pilot';
-- UPDATE userRole SET roleName = 'admin' WHERE roleName = 'Admin';

-- If status values don't match, update them:
-- UPDATE registrations SET status = 'Draft' WHERE status = 'draft';
-- UPDATE registrations SET status = 'Submitted' WHERE status = 'submitted';
-- UPDATE registrations SET status = 'Approved' WHERE status = 'approved';

-- ============================================
-- STEP 8: Sample Data for Testing (Optional)
-- ============================================

-- Insert test user (if needed)
-- INSERT INTO userRole (roleId, roleName) VALUES (1, 'pilot'), (2, 'admin');
-- INSERT INTO organisation (organisationId, organisationName) VALUES (1, 'NLA');
-- INSERT INTO userInfo (userId, firstName, lastName, email, roleId, organisationId, createdAt)
-- VALUES ('test-user-1', 'Test', 'Pilot', 'test@example.com', 1, 1, NOW());
-- INSERT INTO userAuth (userId, username, password)
-- VALUES ('test-user-1', 'pilot1', 'hashed_password_here');

-- Insert test report with GeoJSON geometry
-- INSERT INTO registrations (
--     registrationId, reporterId, obstacleType, geometryType, geometry,
--     heightMeters, description, status, createdAt, updatedAt
-- ) VALUES (
--     'test-report-1',
--     'test-user-1',
--     'Tower',
--     'Point',
--     '{"type": "Point", "coordinates": [7.9956, 58.1467]}',
--     150.5,
--     'Test radio tower near Kristiansand',
--     'Submitted',
--     NOW(),
--     NOW()
-- );

-- ============================================
-- STEP 9: Test GeoJSON Format
-- ============================================

-- Check if geometry is valid JSON
SELECT 
    registrationId,
    geometry,
    JSON_VALID(geometry) as is_valid_json
FROM registrations
LIMIT 10;

-- Extract coordinates from GeoJSON
SELECT 
    registrationId,
    JSON_EXTRACT(geometry, '$.type') as geom_type,
    JSON_EXTRACT(geometry, '$.coordinates') as coordinates
FROM registrations
WHERE geometry IS NOT NULL
LIMIT 10;

-- ============================================
-- STEP 10: Performance Indexes (Recommended)
-- ============================================

-- Add indexes for faster queries
-- CREATE INDEX idx_registrations_reporter ON registrations(reporterId);
-- CREATE INDEX idx_registrations_status ON registrations(status);
-- CREATE INDEX idx_registrations_created ON registrations(createdAt);

-- ============================================
-- COMPLETE! Next Steps:
-- ============================================

-- 1. Run this script in phpMyAdmin
-- 2. Verify views are created: SHOW FULL TABLES WHERE Table_type = 'VIEW';
-- 3. Test views with SELECT queries above
-- 4. Move to C# backend implementation
-- 5. See /guidelines/MariaDB-Integration-Guide.md for backend code

SELECT 'Database setup complete! Check views with: SELECT * FROM vw_Users; SELECT * FROM vw_ObstacleReports;' as message;
