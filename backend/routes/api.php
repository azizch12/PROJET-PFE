<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChapterController;
use App\Http\Controllers\Api\LanguageController;
use App\Http\Controllers\Api\LearnerAnalyticsController;
use App\Http\Controllers\Api\VerificationController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\TestController;
use App\Http\Controllers\ExerciseController;
use Illuminate\Support\Facades\Route;

// Public routes (no token needed)
Route::post('/register',        [AuthController::class, 'register']);
Route::post('/login',           [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password',  [AuthController::class, 'resetPassword']);
Route::post('/social-login',    [AuthController::class, 'socialLogin']);

// Protected routes (token required)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user',    [AuthController::class, 'user']);

    Route::put('/profile',          [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);
    Route::post('/profile/avatar',  [ProfileController::class, 'updateAvatar']);
    Route::delete('/profile/avatar',[ProfileController::class, 'removeAvatar']);

    // Email verification (OTP)
    Route::post('/email/send-code',   [VerificationController::class, 'sendCode']);
    Route::post('/email/verify-code', [VerificationController::class, 'verifyCode']);

    // Public (authenticated) – active languages for learners
    Route::get('/languages/active', [LanguageController::class, 'activeLanguages']);

    // Learner – chapters by language (level-filtered + progress)
    Route::get('/learner/chapters', [ChapterController::class, 'learnerChapters']);
    Route::post('/learner/chapters/{chapter}/complete', [ChapterController::class, 'completeChapter']);
    Route::get('/learner/dashboard', [LearnerAnalyticsController::class, 'dashboard']);
    Route::get('/learner/progress', [LearnerAnalyticsController::class, 'progress']);

    // Learner – AI-generated exercises
    Route::get('/learner/exercises', [ExerciseController::class, 'generate']);

    // Learner – placement test
    Route::get('/learner/test',          [TestController::class, 'getTest']);
    Route::post('/learner/test/submit',  [TestController::class, 'submitTest']);
    Route::get('/learner/test/result',   [TestController::class, 'getResult']);
    Route::post('/learner/test/retake',  [TestController::class, 'retakeTest']);

    // Instructor-only routes
    Route::middleware('instructor')->prefix('instructor')->group(function () {
        Route::get('/languages',                      [ChapterController::class, 'instructorLanguages']);
        Route::get('/levels',                         [ChapterController::class, 'levels']);
        Route::get('/chapters',                       [ChapterController::class, 'index']);
        Route::post('/chapters',                      [ChapterController::class, 'store']);
        Route::post('/chapters/{chapter}',            [ChapterController::class, 'update']);
        Route::delete('/chapters/{chapter}',          [ChapterController::class, 'destroy']);
        Route::patch('/chapters/{chapter}/toggle',    [ChapterController::class, 'togglePublish']);

        // Test questions management
        Route::get('/test-questions',                    [TestController::class, 'index']);
        Route::post('/test-questions',                   [TestController::class, 'store']);
        Route::put('/test-questions/{question}',         [TestController::class, 'update']);
        Route::delete('/test-questions/{question}',      [TestController::class, 'destroy']);
        Route::get('/test-questions/stats',              [TestController::class, 'stats']);
    });

    // Admin-only routes
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/users',              [AdminController::class, 'users']);
        Route::patch('/users/{user}/toggle', [AdminController::class, 'toggleActive']);
        Route::post('/users',             [AdminController::class, 'addInstructor']);
        Route::put('/users/{user}',       [AdminController::class, 'updateUser']);
        Route::delete('/users/{user}',    [AdminController::class, 'deleteUser']);

        // Language management
        Route::get('/languages',                         [LanguageController::class, 'index']);
        Route::post('/languages',                        [LanguageController::class, 'store']);
        Route::post('/languages/{language}',             [LanguageController::class, 'update']);
        Route::delete('/languages/{language}',           [LanguageController::class, 'destroy']);
        Route::patch('/languages/{language}/toggle',     [LanguageController::class, 'toggleActive']);
        Route::put('/languages/{language}/instructor',   [LanguageController::class, 'assignInstructor']);
        Route::get('/instructors',                       [LanguageController::class, 'availableInstructors']);
    });
});
