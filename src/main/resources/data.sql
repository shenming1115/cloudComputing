-- Initialize test users (password: demo123, encrypted with BCrypt)
INSERT INTO app_users (username, email, password, created_at) 
VALUES 
('demo', 'demo@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye7I74A1g3F7Y5b5j7T5j7T5j7T5j7T5O', NOW()),
('alice', 'alice@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye7I74A1g3F7Y5b5j7T5j7T5j7T5j7T5O', NOW()),
('bob', 'bob@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye7I74A1g3F7Y5b5j7T5j7T5j7T5j7T5O', NOW());

-- Initialize test posts
INSERT INTO posts (user_id, content, image_url, created_at) 
VALUES 
(1, 'Welcome to Social Forum! This is a demo post to test the application.', NULL, NOW()),
(1, 'Cloud computing is amazing! Deploying on AWS with ALB + ASG + RDS.', NULL, DATEADD('HOUR', -1, NOW())),
(2, 'Just finished implementing XSS protection on the frontend. Security matters!', NULL, DATEADD('HOUR', -2, NOW())),
(3, 'Looking forward to the demo presentation. Everything is ready! 🚀', NULL, DATEADD('HOUR', -3, NOW())),
(2, 'Auto Scaling is working perfectly. The architecture scales beautifully.', NULL, DATEADD('HOUR', -4, NOW()));

-- Initialize test comments
INSERT INTO comments (post_id, user_id, content, created_at)
VALUES
(1, 2, 'Great to see this working!', DATEADD('MINUTE', -30, NOW())),
(1, 3, 'Impressive architecture design!', DATEADD('MINUTE', -20, NOW())),
(2, 3, 'AWS is definitely the way to go for scalability.', DATEADD('HOUR', -1, NOW())),
(3, 1, 'Thanks! We worked hard on security best practices.', DATEADD('MINUTE', -90, NOW())),
(4, 1, 'Good luck with your presentation! 💪', DATEADD('HOUR', -2, NOW()));
