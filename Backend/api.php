<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Courses\CourseController;
use App\Http\Controllers\Enrollments\EnrollmentController;
use App\Http\Controllers\Progress\ProgressController;
use App\Http\Controllers\Quiz\QuizController;
use App\Http\Controllers\Admin\AdminController;
use App\Http\Middleware\JwtMiddleware;

Route::prefix('v1')->group(function () {
    // Public Auth Routes
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/admin-register', [AuthController::class, 'adminRegister']);
    Route::post('/auth/admin-login', [AuthController::class, 'adminLogin']);

    // Protected Routes
    Route::middleware([JwtMiddleware::class])->group(function () {
        // Auth
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::post('/auth/refresh', [AuthController::class, 'refresh']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        // Courses
        Route::get('/courses', [CourseController::class, 'index']);
        Route::get('/courses/{id}', [CourseController::class, 'show']);
        Route::post('/courses', [CourseController::class, 'store'])->middleware('admin');
        Route::put('/courses/{id}', [CourseController::class, 'update'])->middleware('admin');
        Route::patch('/courses/{id}', [CourseController::class, 'update'])->middleware('admin');
        Route::delete('/courses/{id}', [CourseController::class, 'destroy'])->middleware('admin');

        // Enrollments
        Route::post('/enrollments', [EnrollmentController::class, 'store']);
        Route::get('/enrollments', [EnrollmentController::class, 'index']);
        Route::get('/enrollments/{id}', [EnrollmentController::class, 'show']);

        // Progress
        Route::post('/progress/mark-complete', [ProgressController::class, 'markComplete']);
        Route::get('/progress/{courseId}', [ProgressController::class, 'getCourseProgress']);
        Route::get('/progress/all', [ProgressController::class, 'getAllProgress']);

        // Quiz
        Route::get('/quizzes', [QuizController::class, 'index']);
        Route::get('/quizzes/{id}', [QuizController::class, 'show']);
        Route::post('/quizzes/{id}/attempt', [QuizController::class, 'submitAttempt']);
        Route::get('/quizzes/{id}/results', [QuizController::class, 'getResults']);
        Route::post('/quizzes', [QuizController::class, 'store'])->middleware('admin');

        // Admin Routes
        Route::middleware('admin')->prefix('admin')->group(function () {
            Route::get('/dashboard', [AdminController::class, 'dashboard']);
            Route::get('/students', [AdminController::class, 'listStudents']);
            Route::get('/analytics', [AdminController::class, 'analytics']);
            Route::post('/certificates/generate', [AdminController::class, 'generateCertificates']);
        });
    });
});
