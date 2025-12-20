-- 直接在 MySQL 数据库中插入测试数据
-- 使用 MySQL Workbench 或命令行客户端执行此脚本

USE social_forum;

-- 1. 插入测试用户
-- 密码都是 "Test123!@#" 的 BCrypt 加密
INSERT IGNORE INTO users (username, password, email, bio, avatar_url, created_at) VALUES
('testuser1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'test1@example.com', '测试用户1', NULL, DATE_SUB(NOW(), INTERVAL 30 DAY)),
('testuser2', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'test2@example.com', '测试用户2', NULL, DATE_SUB(NOW(), INTERVAL 20 DAY)),
('testuser3', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'test3@example.com', '测试用户3', NULL, DATE_SUB(NOW(), INTERVAL 10 DAY));

-- 查看插入的用户 ID
SELECT id, username, email FROM users;

-- 提示：记下第一个用户的 ID（通常是 1），用于测试 API
