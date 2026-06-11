# Postman One-by-One API Test Guide

Use Postman to test each endpoint one at a time. Import `postman_full_collection.json` (provided) or create requests manually using the examples below.

- Set a Postman environment variable `base_url` to `http://localhost/eepl_classess` (adjust if needed).
- Use `{{base_url}}/v1` as the API base.
- For protected requests add header: `Authorization: Bearer {{token}}` after you obtain the token from `Auth -> Login`.

---

Auth

1) Register
- Method: POST
- URL: `{{base_url}}/v1/auth/register`
- Body (raw JSON):
```
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "secret"
}
```

2) Login
- Method: POST
- URL: `{{base_url}}/v1/auth/login`
- Body (raw JSON):
```
{
  "email": "test@example.com",
  "password": "secret"
}
```
- Response contains `token`. Save it to environment variable `token`.

3) Admin Login
- Method: POST
- URL: `{{base_url}}/v1/auth/admin-login`
- Body (raw JSON):
```
{
  "email": "admin@example.com",
  "password": "adminpassword"
}
```

Protected Auth

4) Logout
- Method: POST
- URL: `{{base_url}}/v1/auth/logout`
- Header: `Authorization: Bearer {{token}}`

5) Refresh
- Method: POST
- URL: `{{base_url}}/v1/auth/refresh`
- Header: `Authorization: Bearer {{token}}`

6) Me
- Method: GET
- URL: `{{base_url}}/v1/auth/me`
- Header: `Authorization: Bearer {{token}}`

---

Courses

7) List courses
- Method: GET
- URL: `{{base_url}}/v1/courses`
- Header: `Authorization: Bearer {{token}}`

8) Get course by id
- Method: GET
- URL: `{{base_url}}/v1/courses/1`
- Header: `Authorization: Bearer {{token}}`

9) Create course (admin only)
- Method: POST
- URL: `{{base_url}}/v1/courses`
- Header: `Authorization: Bearer {{token}}`, `Content-Type: application/json`
- Body:
```
{
  "title": "New Course",
  "description": "Example description"
}
```

10) Update course (admin only)
- Method: PUT
- URL: `{{base_url}}/v1/courses/1`
- Header: `Authorization: Bearer {{token}}`, `Content-Type: application/json`
- Body:
```
{
  "title": "Updated Course",
  "description": "Updated description"
}
```

11) Delete course (admin only)
- Method: DELETE
- URL: `{{base_url}}/v1/courses/1`
- Header: `Authorization: Bearer {{token}}`

---

Enrollments

12) Create enrollment
- Method: POST
- URL: `{{base_url}}/v1/enrollments`
- Header: `Authorization: Bearer {{token}}`, `Content-Type: application/json`
- Body:
```
{
  "student_id": 1,
  "course_id": 1
}
```

13) List enrollments
- Method: GET
- URL: `{{base_url}}/v1/enrollments`
- Header: `Authorization: Bearer {{token}}`

14) Get enrollment by id
- Method: GET
- URL: `{{base_url}}/v1/enrollments/1`
- Header: `Authorization: Bearer {{token}}`

---

Progress

15) Mark complete
- Method: POST
- URL: `{{base_url}}/v1/progress/mark-complete`
- Header: `Authorization: Bearer {{token}}`, `Content-Type: application/json`
- Body:
```
{
  "student_id": 1,
  "course_id": 1,
  "module_id": 2
}
```

16) Get course progress
- Method: GET
- URL: `{{base_url}}/v1/progress/1`  (replace `1` with `courseId`)
- Header: `Authorization: Bearer {{token}}`

17) Get all progress
- Method: GET
- URL: `{{base_url}}/v1/progress/all`
- Header: `Authorization: Bearer {{token}}`

---

Quizzes

18) List quizzes
- Method: GET
- URL: `{{base_url}}/v1/quizzes`
- Header: `Authorization: Bearer {{token}}`

19) Get quiz by id
- Method: GET
- URL: `{{base_url}}/v1/quizzes/1`
- Header: `Authorization: Bearer {{token}}`

20) Submit quiz attempt
- Method: POST
- URL: `{{base_url}}/v1/quizzes/1/attempt`
- Header: `Authorization: Bearer {{token}}`, `Content-Type: application/json`
- Body:
```
{
  "answers": [
    { "question_id": 1, "answer": "A" }
  ]
}
```

21) Get quiz results
- Method: GET
- URL: `{{base_url}}/v1/quizzes/1/results`
- Header: `Authorization: Bearer {{token}}`

22) Create quiz (admin only)
- Method: POST
- URL: `{{base_url}}/v1/quizzes`
- Header: `Authorization: Bearer {{token}}`, `Content-Type: application/json`
- Body (example):
```
{
  "title": "Sample Quiz",
  "questions": [
    { "text": "Question 1?", "options": ["A","B","C"], "answer": "A" }
  ]
}
```

---

Admin endpoints (prefix `/v1/admin` - require admin middleware)

23) Dashboard
- Method: GET
- URL: `{{base_url}}/v1/admin/dashboard`
- Header: `Authorization: Bearer {{token}}` (admin token)

24) List students
- Method: GET
- URL: `{{base_url}}/v1/admin/students`
- Header: `Authorization: Bearer {{token}}` (admin token)

25) Analytics
- Method: GET
- URL: `{{base_url}}/v1/admin/analytics`
- Header: `Authorization: Bearer {{token}}` (admin token)

26) Generate certificates
- Method: POST
- URL: `{{base_url}}/v1/admin/certificates/generate`
- Header: `Authorization: Bearer {{token}}`, `Content-Type: application/json`
- Body (example):
```
{
  "course_id": 1,
  "batch": "2026-06-03"
}
```

---

Tips for Postman

- After running `Login`, copy the returned token and set it as environment variable `token` (or use Tests script to save it automatically).
- For admin-only requests, login with an admin account and set `token` to the admin token.

This file is saved as `POSTMAN_TESTING.md`. Import `postman_full_collection.json` for ready-to-run requests.
