# API Testing Guide

This document shows how to test the API in this project with concrete examples (curl, PowerShell, and Postman). Adjust `BASE_URL` if your app runs under a different path (for example, a `public` folder or a virtual host).

## Prerequisites
- PHP app running (XAMPP) and accessible in your browser or via `curl`.
- `curl` (or PowerShell for Windows).
- `jq` (optional, for JSON parsing in bash).

## Base URL
Set the base URL according to your setup. Example values:
- If the repo is served from XAMPP as-is: `http://localhost/eepl_classess`
- If you use a `public` folder: `http://localhost/eepl_classess/public`

In examples below we use:

BASE_URL=http://localhost/eepl_classess
API_PREFIX=/v1

Full example endpoint: `http://localhost/eepl_classess/v1/auth/login`

---

## Authentication (JWT)

1) Register (public)

curl example:

```
curl -s -X POST "$BASE_URL$API_PREFIX/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"secret"}'
```

2) Login (public) — get JWT token

```
curl -s -X POST "$BASE_URL$API_PREFIX/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secret"}'
```

Login response should contain a token. Example (bash) to extract token with `jq`:

```
TOKEN=$(curl -s -X POST "$BASE_URL$API_PREFIX/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secret"}' | jq -r '.token')
```

For PowerShell (Windows) extract token like this:

```
$resp = Invoke-RestMethod -Method Post -Uri "$BASE_URL$API_PREFIX/auth/login" -Body (@{email='test@example.com';password='secret'} | ConvertTo-Json) -ContentType 'application/json'
$token = $resp.token
```

Use the token as `Authorization: Bearer <token>` for protected endpoints.

---

## Example endpoints & curl samples

List courses (protected):

```
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL$API_PREFIX/courses"
```

Get course by id:

```
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL$API_PREFIX/courses/1"
```

Create course (admin-only):

```
curl -s -X POST "$BASE_URL$API_PREFIX/courses" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"New Course","description":"Example course"}'
```

Enroll a student (public/protected depending on controller):

```
curl -s -X POST "$BASE_URL$API_PREFIX/enrollments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"student_id":1,"course_id":1}'
```

Mark progress complete:

```
curl -s -X POST "$BASE_URL$API_PREFIX/progress/mark-complete" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"student_id":1,"course_id":1,"module_id":2}'
```

List quizzes:

```
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL$API_PREFIX/quizzes"
```

Submit a quiz attempt (replace `{id}` with quiz id):

```
curl -s -X POST "$BASE_URL$API_PREFIX/quizzes/1/attempt" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"answers":[{"question_id":1,"answer":"A"}]}'
```

---

## PowerShell script example (Windows)

Save this as `run-api-tests.ps1` and run from PowerShell.

```
$BASE = 'http://localhost/eepl_classess/v1'
# Login
$loginBody = @{ email = 'test@example.com'; password = 'secret' } | ConvertTo-Json
$resp = Invoke-RestMethod -Method Post -Uri "$BASE/auth/login" -Body $loginBody -ContentType 'application/json'
$token = $resp.token

# Get courses
Invoke-RestMethod -Method Get -Uri "$BASE/courses" -Headers @{ Authorization = "Bearer $token" }
```

Adjust the script as needed for additional flows.

---

## Postman

1. Create a new collection.
2. Add an environment variable `base_url` set to `http://localhost/eepl_classess`.
3. Add requests mirroring the curl examples above, using `{{base_url}}/v1/...`.
4. For protected requests add an `Authorization` header with value `Bearer {{token}}`.

You can export a Postman collection from these requests and share it with teammates.

---

## Automated tests (suggestions)

- Simple approach: a PowerShell or Bash script that runs the sequence of `curl` commands, checks HTTP status codes, and fails early.
- PHP approach: write integration tests with `PHPUnit` using `GuzzleHttp` to call the API and assert responses. Example test skeleton:

```php
// tests/Api/CourseTest.php
use PHPUnit\Framework\TestCase;
use GuzzleHttp\Client;

class CourseTest extends TestCase
{
    public function testListCourses()
    {
        $client = new Client(['base_uri' => 'http://localhost/eepl_classess/v1/']);
        $res = $client->request('GET', 'courses');
        $this->assertEquals(200, $res->getStatusCode());
    }
}
```

Install `guzzlehttp/guzzle` and `phpunit/phpunit` via Composer to run PHP integration tests.

---

## Tips & Troubleshooting
- If you get 401 Unauthorized, ensure you pass `Authorization: Bearer <token>` header and that the token is not expired.
- If routes return 404, verify your `BASE_URL` and whether the app needs `public` in the path.
- Check `storage/logs` or your server logs for detailed error messages.

---

## Where I put this file
Saved as `API_TESTING.md` in the project root. Update `BASE_URL` at the top to match your local webserver configuration.

---

## Quick server setup (one-time)

- Ensure Apache `mod_rewrite` is enabled and `AllowOverride All` is set for `htdocs` in XAMPP.
- Import `schema.sql` into your MySQL database (phpMyAdmin or CLI) and ensure database name matches `.env` (`eepl_classroom` by default).
- (Optional) Create an admin account for testing:

```bash
php create_admin.php admin@example.com adminpassword "Admin Name"
```

- Start testing. The project includes a lightweight router; you can hit endpoints at:

```
http://localhost/eepl_classess/v1/auth/login
```

If that returns 404, try:

```
http://localhost/eepl_classess/public/v1/auth/login
```

Adjust `base_url` in Postman accordingly.


---

## Quick test scripts (included)

To make local testing easier the repository includes two quick smoke-test scripts and a minimal Postman collection.

- PowerShell: `run-api-tests.ps1` — run from PowerShell on Windows. Example:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
$env:BASE_URL = 'http://localhost/eepl_classess/v1'
.\run-api-tests.ps1
```

- Bash: `run-api-tests.sh` — run on macOS/Linux or Windows with WSL/Git Bash. Example:

```bash
BASE_URL=http://localhost/eepl_classess/v1 ./run-api-tests.sh
```

- Postman: `postman_collection.json` — import into Postman (File → Import) to get a minimal `Login` and `Get Courses` example. After importing set an environment variable `base_url` to `http://localhost/eepl_classess` and run the `Login` request to obtain a token, then set `{{token}}` for protected requests.

These scripts perform a simple login and a few protected calls so you can verify the API is responding. Edit the test credentials in the scripts if your local DB uses other test accounts.



