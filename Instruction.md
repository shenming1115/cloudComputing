You are a senior backend engineer.

I need you to generate a complete Java Spring Boot backend project
for a cloud-native social media / forum application.

IMPORTANT CONSTRAINTS:
- This backend will be deployed on AWS EC2 (Linux)
- The application must be stateless and cloud-ready
- All configuration MUST use environment variables
- The final application MUST be runnable using `java -jar`

====================================
1. PROJECT STRUCTURE (MANDATORY)
====================================

The project must follow this exact structure:

src/main/java
 ├── controller        // REST API controllers
 ├── service           // Business logic
 ├── repository        // JPA repositories
 ├── model             // Entity models
 └── Application.java  // Spring Boot entry point

Use standard Spring Boot annotations and best practices.

====================================
2. CORE FEATURES (MANDATORY)
====================================

Implement the following features using REST APIs:

1. User registration and basic authentication
2. Create posts (text content + image URL)
3. Comment on posts
4. Retrieve a post feed (list posts with comments)

All APIs must return JSON.

====================================
3. DATABASE REQUIREMENTS
====================================

- Use Spring Data JPA
- Support MySQL or PostgreSQL
- Entities required:
  - User
  - Post
  - Comment

====================================
4. CONFIGURATION (VERY IMPORTANT)
====================================

All database configuration MUST come from environment variables.

Example (application.yml):

spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USER}
    password: ${DB_PASSWORD}

DO NOT hardcode credentials anywhere.

====================================
5. CLOUD & DEPLOYMENT REQUIREMENTS
====================================

- The backend must be stateless
- No local file storage
- Ready for horizontal scaling (Auto Scaling Group)
- Compatible with AWS ALB health checks
- Provide a simple `/health` endpoint

====================================
6. OUTPUT REQUIREMENTS
====================================

- Provide complete Java code for:
  - Controllers
  - Services
  - Repositories
  - Models
- Provide `application.yml`
- Provide `pom.xml`
- Ensure the project can be built using:
  mvn clean package
- The output must be production-ready, not pseudo-code

====================================
7. STYLE REQUIREMENTS
====================================

- Clean, readable, professional Java code
- Use proper annotations (@RestController, @Service, @Repository, etc.)
- Follow standard REST conventions
