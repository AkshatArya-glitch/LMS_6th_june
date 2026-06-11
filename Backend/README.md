# Emancipation LMS Backend API

A comprehensive Learning Management System API built with Laravel for delivering online courses, managing students, tracking progress, and handling assessments.

## Features

- **Student Authentication** (Registration, Login, Profile Management)
- **Course Management** (Create, Update, Delete courses with modules and lessons)
- **Enrollment & Payment** (Student enrollment, payment status tracking)
- **Progress Tracking** (Lesson completion, course progress percentage)
- **Quiz & Assessment** (Quiz creation, question management, scoring logic)
- **Admin Panel** (Dashboard, analytics, student management)
- **Analytics & Reports** (Enrollment trends, completion rates, revenue)
- **Certificate Generation** (Auto-generate on course completion)
- **Webinar Management** (Register, list, manage webinars)

## Tech Stack

- **Framework**: Laravel 11+
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **API**: RESTful API with JSON responses

## Installation

```bash
# Clone repository
git clone https://github.com/karannkumar04/emancipation-lms-backend.git
cd emancipation-lms-backend

# Install dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate

# Start development server
php artisan serve


Base URL: http://localhost:8000/api/v1/

Authentication Endpoints
POST /auth/register - Student registration
POST /auth/login - Student login
POST /auth/admin-login - Admin login
GET /auth/me - Get current user
POST /auth/logout - Logout
POST /auth/refresh - Refresh JWT token
Course Endpoints
GET /courses - List all courses
GET /courses/{id} - Get course details
POST /courses - Create course (admin only)
PUT /courses/{id} - Update course (admin only)
DELETE /courses/{id} - Delete course (admin only)
Enrollment Endpoints
POST /enrollments - Enroll in course
GET /enrollments - List student enrollments
GET /enrollments/{id} - Get enrollment details
Progress Endpoints
POST /progress/mark-complete - Mark lesson as complete
GET /progress/{courseId} - Get course progress
GET /progress/all - Get all progress
Quiz Endpoints
GET /quizzes - List quizzes
GET /quizzes/{id} - Get quiz details
POST /quizzes/{id}/attempt - Submit quiz attempt
GET /quizzes/{id}/results - Get quiz results
Admin Endpoints
GET /admin/dashboard - Admin dashboard stats
GET /admin/students - List all students
GET /admin/analytics - Analytics data
POST /admin/certificates/generate - Generate certificates