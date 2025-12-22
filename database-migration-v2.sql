-- ============================================
-- Social Forum - Security Upgrade Migration
-- Version: 2.0.0
-- Date: December 2024
-- ============================================

-- Add role column to users table
-- This enables Role-Based Access Control (RBAC)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'USER';

-- Add index on role for better query performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Update existing users to have USER role (if NULL)
UPDATE users SET role = 'USER' WHERE role IS NULL OR role = '';

-- Optional: Create an admin user (replace with your actual admin username)
-- UPDATE users SET role = 'ADMIN' WHERE username = 'admin';

-- Optional: Create test admin user
-- INSERT INTO users (username, email, password, role, created_at)
-- VALUES ('admin', 'admin@socialforum.com', '$2a$12$YOUR_BCRYPT_HASH_HERE', 'ADMIN', NOW())
-- ON CONFLICT (username) DO NOTHING;

-- Verify migration
SELECT 
    COUNT(*) as total_users,
    SUM(CASE WHEN role = 'USER' THEN 1 ELSE 0 END) as regular_users,
    SUM(CASE WHEN role = 'ADMIN' THEN 1 ELSE 0 END) as admin_users
FROM users;

-- ============================================
-- Expected Output:
-- total_users | regular_users | admin_users
-- ------------+---------------+-------------
--          10 |             9 |           1
-- ============================================

COMMIT;
