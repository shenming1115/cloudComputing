-- 初始化测试用户（密码：demo123，已使用 BCrypt 加密）
INSERT IGNORE INTO users (username, email, password, created_at) 
VALUES 
('demo', 'demo@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye7I74A1g3F7Y5b5j7T5j7T5j7T5j7T5O', NOW()),
('alice', 'alice@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye7I74A1g3F7Y5b5j7T5j7T5j7T5j7T5O', NOW()),
('bob', 'bob@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye7I74A1g3F7Y5b5j7T5j7T5j7T5j7T5O', NOW());

-- 初始化测试帖子
INSERT IGNORE INTO posts (user_id, content, image_url, created_at) 
VALUES 
(1, 'Welcome to Social Forum! This is a demo post to test the application.', NULL, NOW()),
(1, 'Cloud computing is amazing! Deploying on AWS with ALB + ASG + RDS.', NULL, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(2, 'Just finished implementing XSS protection on the frontend. Security matters!', NULL, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(3, 'Looking forward to the demo presentation. Everything is ready! 🚀', NULL, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(2, 'Auto Scaling is working perfectly. The architecture scales beautifully.', NULL, DATE_SUB(NOW(), INTERVAL 4 HOUR));

-- 初始化测试评论
INSERT IGNORE INTO comments (post_id, user_id, content, created_at)
VALUES
(1, 2, 'Great to see this working!', DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
(1, 3, 'Impressive architecture design!', DATE_SUB(NOW(), INTERVAL 20 MINUTE)),
(2, 3, 'AWS is definitely the way to go for scalability.', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(3, 1, 'Thanks! We worked hard on security best practices.', DATE_SUB(NOW(), INTERVAL 90 MINUTE)),
(4, 1, 'Good luck with your presentation! 💪', DATE_SUB(NOW(), INTERVAL 2 HOUR));
