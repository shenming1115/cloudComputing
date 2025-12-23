# Social Forum Application (Meghan Cloud)

## 📖 Project Overview
**Social Forum** is a comprehensive full-stack social media platform designed to demonstrate modern cloud computing principles. It features a robust backend built with **Spring Boot**, a responsive frontend using **Vanilla JavaScript/HTML/CSS**, and leverages **AWS** services for scalable infrastructure. The application includes advanced features like AI chat integration, secure media handling, and an administrative dashboard.

---

## 🏗️ Architecture & Tech Stack

### **Backend**
*   **Framework**: Java Spring Boot 3.x
*   **Security**: Spring Security with JWT (Stateless Authentication)
*   **Build Tool**: Maven

### **Frontend**
*   **Core**: HTML5, CSS3, Vanilla JavaScript (ES6+)
*   **Styling**: Custom CSS (Responsive Design)
*   **Communication**: Fetch API for RESTful endpoints

### **Cloud Infrastructure (AWS)**
*   **Compute**: AWS EC2 (Application Hosting)
*   **Database**: AWS RDS (MySQL 8.0)
*   **Storage**: AWS S3 (Private Bucket for Images/Videos)
*   **CDN**: AWS CloudFront (Secure Content Delivery)
*   **Parameter Store**: AWS Systems Manager (SSM) for sensitive config

### **AI Integration**
*   **Service**: Cloudflare Workers
*   **Model**: Llama-3 (via Cloudflare AI Gateway)
*   **Function**: Intelligent Chatbot Assistant

---

## ✨ Key Features

### **1. User Management**
*   Secure Registration & Login (JWT-based).
*   Role-based Access Control (USER vs ADMIN).
*   Profile Management.

### **2. Content Management**
*   **Posts**: Create text, image, and video posts.
*   **Media**: Secure upload to S3 with CloudFront delivery.
*   **Interactions**: Like posts/comments, add comments.
*   **Sharing**: Generate unique shareable links for posts.

### **3. Admin Dashboard**
*   **User Control**: View, promote, or delete users.
*   **System Stats**: Real-time monitoring of CPU, Memory, and DB connections.
*   **S3 Management**: List and delete orphaned files from S3.
*   **Logs**: View system logs directly in the dashboard.

### **4. AI Assistant**
*   Integrated chat interface powered by Llama-3.
*   Context-aware responses for user queries.

---

## 📂 Project Structure

```
cloudComputing/
├── src/
│   ├── main/
│   │   ├── java/com/cloudapp/socialforum/
│   │   │   ├── config/       # Security & App Config
│   │   │   ├── controller/   # REST API Endpoints
│   │   │   ├── model/        # JPA Entities
│   │   │   ├── repository/   # Data Access Layer
│   │   │   ├── service/      # Business Logic
│   │   │   └── security/     # JWT Filters & Auth
│   │   └── resources/
│   │       ├── static/       # Frontend Assets (HTML/CSS/JS)
│   │       ├── application.yml # Main Configuration
│   │       └── application-*.yml # Environment-specific Config
├── pom.xml                   # Maven Dependencies
└── mvnw / mvnw.cmd           # Maven Wrapper
```

---

## 🚀 Getting Started

### **Prerequisites**
*   Java Development Kit (JDK) 17 or higher
*   Maven (optional, wrapper provided)
*   MySQL Database (Local or RDS)
*   AWS Credentials (for S3/SSM access)

### **Configuration**
The application uses `application.yml` for configuration. Key environment variables or properties include:

*   `spring.datasource.url`: JDBC URL for MySQL.
*   `aws.s3.bucket-name`: Target S3 bucket.
*   `aws.cloudfront.domain`: CloudFront distribution domain.
*   `jwt.secret`: Secret key for token generation.

### **Running Locally**

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd cloudComputing
    ```

2.  **Build the project**:
    ```bash
    ./mvnw clean install
    ```

3.  **Run the application**:
    ```bash
    ./mvnw spring-boot:run
    ```
    *The application will start on `http://localhost:8080`*

4.  **Access the App**:
    *   **Home**: `http://localhost:8080/index.html`
    *   **Login**: `http://localhost:8080/login.html`
    *   **Admin**: `http://localhost:8080/admin-dashboard.html` (Requires ADMIN role)

---

## 🔒 Security Highlights
*   **S3 Security**: The S3 bucket is **Private**. Files are accessed only via **Pre-signed URLs** or **CloudFront Signed URLs**, ensuring no unauthorized direct access.
*   **Data Protection**: Passwords are hashed using **BCrypt**.
*   **API Security**: All sensitive endpoints are protected by JWT filters.

---

## 🛠️ Troubleshooting
*   **S3 Upload Fails**: Check AWS Credentials in your environment (`~/.aws/credentials` or Environment Variables).
*   **Database Connection Error**: Verify RDS Security Group allows traffic from your IP.
*   **White Screen/UI Issues**: Clear browser cache or check console for JS errors.

---
*Generated for Meghan Cloud Project - Semester 2*
