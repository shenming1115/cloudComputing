# Social Forum Application

A modern, production-ready social media application built with Spring Boot and Facebook-inspired UI design.

## 🎯 Features

✅ **Complete Authentication System**
- Register with strong password validation
- Login with email or username
- Secure BCrypt password hashing

✅ **Social Posting**
- Create text, image, and video posts
- Real-time like/unlike system
- Comment on posts
- Share posts with unique links
- All timestamps in GMT+8 (Malaysia/Kuala Lumpur)

✅ **Advanced Search**
- Search all (posts + users)
- Search people by username/email
- Search posts by tags/content
- Real database queries (no mock data)

✅ **AWS S3 Integration**
- Upload images, videos, and reels
- Automatic file organization
- 100MB file size limit

✅ **Modern UI/UX**
- Facebook-inspired blue theme
- Clean, professional design
- Smooth transitions and animations
- Responsive layout

## 📚 Documentation

- **[Quick Start Guide](QUICK_START.md)** - Get up and running in 5 minutes
- **[Implementation Complete](IMPLEMENTATION_COMPLETE.md)** - Detailed feature documentation
- **[Implementation Summary](IMPLEMENTATION_SUMMARY.md)** - Architecture and statistics

## 🚀 Quick Start

### Prerequisites
- Java 17+
- Maven 3.6+
- MySQL 8.0+
- AWS credentials (optional, for uploads)

### Run Application
```bash
# Build
mvn clean package

# Run
mvn spring-boot:run

# Or use JAR
java -jar target/social-forum.jar
```

### Run Tests
```powershell
.\test-all-features.ps1
```

### Access Application
- **Frontend**: http://localhost:8080
- **Health Check**: http://localhost:8080/actuator/health

## 📊 Tech Stack

**Backend:**
- Spring Boot 3.2.0
- Spring Data JPA
- Spring Security
- MySQL 8.0
- AWS SDK for S3

**Frontend:**
- HTML5
- CSS3 (Facebook-inspired)
- Vanilla JavaScript (Fetch API)

**Testing:**
- PowerShell automated test suite
- 18+ comprehensive test cases

## 🏗️ Architecture

```
Frontend (HTML/CSS/JS)
    ↓ REST API
Spring Boot Backend
    ↓ JDBC
MySQL Database (RDS)
    
AWS S3 (Media Storage)
```

## 📁 Project Structure

```
cloudComputing/
├── src/main/
│   ├── java/                # Backend code
│   │   └── com/cloudapp/socialforum/
│   │       ├── controller/  # REST endpoints
│   │       ├── service/     # Business logic
│   │       ├── model/       # Entities
│   │       └── repository/  # Data access
│   └── resources/
│       ├── application.yml  # Configuration
│       └── static/          # Frontend files
├── test-all-features.ps1   # Automated tests
└── *.md                     # Documentation
```

## 🔑 Key APIs

### Authentication
- `POST /api/users/register` - Register user
- `POST /api/users/login` - Login

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create post
- `GET /api/posts/{id}` - Get post

### Likes
- `POST /api/posts/{id}/likes?userId={userId}` - Toggle like
- `GET /api/posts/{id}/likes/status?userId={userId}` - Check like status

### Search
- `GET /api/search?query={q}&type={all|people|tags}` - Search

### Upload
- `POST /api/upload/image` - Upload image to S3
- `POST /api/upload/video` - Upload video to S3

## ✅ Implementation Status

All requirements complete:
- [x] GMT+8 timezone
- [x] Like & comment system with DB persistence
- [x] Real search (no undefined)
- [x] Settings page cleaned up
- [x] Facebook-like UI
- [x] AWS S3 uploads
- [x] Root path redirect
- [x] Enhanced authentication
- [x] Fetch API only
- [x] Automated testing

**100% Complete - Production Ready ✅**

## 🧪 Testing

Run automated test suite:
```powershell
.\test-all-features.ps1
```

Expected: 18 tests, 100% pass rate

## 🔧 Configuration

### Database
Edit `src/main/resources/application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/social_forum
    username: your_username
    password: your_password
```

### AWS S3
Set environment variables:
```bash
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_S3_BUCKET=social-forum-media
```

## 📝 Notes

- Default timezone: **Asia/Kuala_Lumpur (GMT+8)**
- Max file upload: **100MB**
- Default port: **8080**
- Password requirements: 8+ chars, uppercase, lowercase, digit, special char

## 🆘 Troubleshooting

See [Quick Start Guide](QUICK_START.md) troubleshooting section.

## 📄 License

This is a university project for educational purposes.

---

**Built with ❤️ for Cloud Computing Course**  
**Status**: ✅ Production Ready  
**Version**: 1.0.0
