<#
Simple PowerShell API smoke test for this project.

Usage:
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  $env:BASE_URL = 'http://localhost/eepl_classess/v1'
  .\run-api-tests.ps1

Adjust the login credentials below as needed.
#>

param()

$BASE = $env:BASE_URL
if (-not $BASE) { $BASE = 'http://localhost/eepl_classess/v1' }
Write-Host "Using BASE URL: $BASE"

function FailExit($msg) {
    Write-Error $msg
    exit 1
}

# 1) Login and get token
$loginBody = @{ email = 'test@example.com'; password = 'secret' } | ConvertTo-Json
try {
    $resp = Invoke-RestMethod -Method Post -Uri "$BASE/auth/login" -Body $loginBody -ContentType 'application/json' -ErrorAction Stop
    $token = $resp.token
    if (-not $token) { FailExit "Login succeeded but no token found in response." }
    Write-Host "Login OK; token received."
} catch {
    FailExit "Login failed: $_"
}

$headers = @{ Authorization = "Bearer $token" }

# 2) Get courses
try {
    $courses = Invoke-RestMethod -Method Get -Uri "$BASE/courses" -Headers $headers -ErrorAction Stop
    Write-Host "GET /courses OK; returned $(($courses | Measure-Object).Count) item(s)."
} catch {
    FailExit "GET /courses failed: $_"
}

# 3) Get quizzes (example)
try {
    $quizzes = Invoke-RestMethod -Method Get -Uri "$BASE/quizzes" -Headers $headers -ErrorAction Stop
    Write-Host "GET /quizzes OK; returned $(($quizzes | Measure-Object).Count) item(s)."
} catch {
    Write-Warning "GET /quizzes failed: $_"
}

# 4) Optional: attempt a quiz (commented sample)
<#
try {
    $attemptBody = @{ answers = @(@{ question_id = 1; answer = 'A' }) } | ConvertTo-Json
    $attempt = Invoke-RestMethod -Method Post -Uri "$BASE/quizzes/1/attempt" -Headers $headers -Body $attemptBody -ContentType 'application/json' -ErrorAction Stop
    Write-Host "POST /quizzes/1/attempt OK"
} catch {
    Write-Warning "POST /quizzes/1/attempt failed: $_"
}
#>

Write-Host "All smoke checks finished."
exit 0
