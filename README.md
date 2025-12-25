# Social Forum - Cloud Native Application

## 📖 Project Overview
**Social Forum** is a scalable, cloud-native social media platform designed to demonstrate modern cloud computing principles. Built with **Spring Boot** and deployed on **AWS**, it features a secure RESTful API, stateless authentication, and integration with cloud storage and AI services for content moderation.

The application follows a **Monolithic Resource Architecture** where the backend API and frontend static assets are packaged together but utilize managed cloud services (RDS, S3, CloudFront) for persistence and content delivery.

---

## 🏗️ System Architecture

### High-Level Design
The system is designed for High Availability (HA) and Fault Tolerance using AWS infrastructure.

*   **Compute:** Spring Boot application running on EC2 instances (Auto Scaling Group).
*   **Database:** Amazon RDS (MySQL) for relational data (Users, Posts, Comments).
*   **Storage:** Amazon S3 for storing user-uploaded media (Images).
*   **Content Delivery:** Amazon CloudFront (CDN) for low-latency delivery of static assets and images.
*   **Security:**
    *   **JWT (JSON Web Tokens):** Stateless authentication.
    *   **Cloudflare Turnstile:** Bot protection for login/registration.
    *   **AWS SSM:** Secrets management (no hardcoded passwords).

### Tech Stack
| Category | Technology |
| :--- | :--- |
| **Backend** | Java 17, Spring Boot 3.x, Spring Security, Spring Data JPA |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (Fetch API) |
| **Database** | MySQL 8.0 (AWS RDS) |
| **Cloud** | AWS (EC2, S3, CloudFront, RDS, VPC, IAM) |
| **AI Integration** | Google Gemini Pro (Content Moderation) |
| **Build Tool** | Maven |

---

## 🚀 Key Features

1.  **Secure Authentication**
    *   User Registration & Login with BCrypt password hashing.
    *   JWT-based session management.
    *   Bot verification using Cloudflare Turnstile.

2.  **Post Management**
    *   Create, Read, Update, and Delete (CRUD) posts.
    *   Image uploads handled via AWS S3 with public access via CloudFront.

3.  **AI Content Moderation**
    *   Integrated **Google Gemini Pro** to analyze post content.
    *   Automatically flags or hides posts containing hate speech or inappropriate content.

4.  **Admin Dashboard**
    *   View system health metrics.
    *   Monitor user statistics and moderation logs.

---

## ⚙️ Configuration & Environment Variables

**Security Note:** This application does **not** use hardcoded passwords. All sensitive credentials must be injected via Environment Variables or System Properties at runtime.

### Required Environment Variables
To run this application locally or in production, set the following variables:

| Variable Name | Description | Example |
| :--- | :--- | :--- |
| `DB_USERNAME` | Database Username | `admin` |
| `DB_PASSWORD` | Database Password | `SecureP@ssw0rd!` |
| `JWT_SECRET` | Secret key for signing tokens | `YourLongRandomSecretKey...` |
| `S3_BUCKET_NAME` | AWS S3 Bucket for media | `social-forum-media` |
| `CLOUDFRONT_DOMAIN` | CloudFront Distribution Domain | `d12345.cloudfront.net` |
| `TURNSTILE_SITE_KEY` | Cloudflare Site Key | `0x4AAAA...` |
| `TURNSTILE_SECRET_KEY`| Cloudflare Secret Key | `0x4AAAA...` |

### Profiles
The application supports Spring Profiles:
*   `local`: For local development (uses `application-local.yml`).
*   `prod`: For AWS deployment (uses `application-prod.yml`).

To activate a profile:
```bash
export SPRING_PROFILES_ACTIVE=prod
```

---

## 🛠️ Installation & Setup

### Prerequisites
*   Java Development Kit (JDK) 17+
*   Maven 3.8+
*   MySQL Database (Local or Remote)

### Build Steps
1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/social-forum.git
    cd social-forum
    ```

2.  **Build the JAR artifact**
    ```bash
    mvn clean package -DskipTests
    ```

3.  **Run the Application**
    ```bash
    java -jar target/social-forum-0.0.1-SNAPSHOT.jar \
      --DB_USERNAME=root \
      --DB_PASSWORD=root \
      --JWT_SECRET=mysecretkey
    ```

---

## 📂 Project Structure

```text
src/main/
├── java/com/socialforum/
│   ├── config/       # Security & AWS Config
│   ├── controller/   # REST API Endpoints
│   ├── entity/       # Database Models
│   ├── repository/   # Data Access Layer
│   └── service/      # Business Logic
└── resources/
    ├── application.yml  # Main Config
    └── static/          # Frontend Assets
        ├── css/
        ├── js/          # API & Auth Logic
        └── index.html
```



---

## 📝 License
This project is for educational purposes.
