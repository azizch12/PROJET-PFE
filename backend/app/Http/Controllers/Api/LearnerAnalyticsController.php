<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chapter;
use App\Models\ChapterProgress;
use App\Models\LearnerLevel;
use App\Models\TestResult;
use Carbon\Carbon;
use Illuminate\Http\Request;

class LearnerAnalyticsController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'learner') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $userId = $user->id;
        $activityCounts = $this->activityCountsByDate($userId);
        $learnerLevels = LearnerLevel::where('user_id', $userId)->get(['language_id', 'level_id']);

        $totals = $this->chapterTotalsForLevels($userId, $learnerLevels);
        $completedChapters = ChapterProgress::where('user_id', $userId)->count();
        $testsTaken = TestResult::where('user_id', $userId)->count();
        $xpPoints = ($completedChapters * 20) + ($testsTaken * 50);

        $now = now();
        $weekStart = $now->copy()->startOfWeek(Carbon::MONDAY);
        $weeklyActivity = [];
        for ($i = 0; $i < 7; $i++) {
            $date = $weekStart->copy()->addDays($i);
            $key = $date->toDateString();
            $weeklyActivity[] = [
                'date' => $key,
                'day' => $date->format('D'),
                'count' => $activityCounts[$key] ?? 0,
            ];
        }

        return response()->json([
            'stats' => [
                'languages_enrolled' => $learnerLevels->count(),
                'courses_in_progress' => $totals['courses_in_progress'],
                'completed_chapters' => $completedChapters,
                'overall_progress' => $totals['overall_progress'],
                'day_streak' => $this->currentStreak($activityCounts),
                'xp_points' => $xpPoints,
            ],
            'weekly_activity' => $weeklyActivity,
            'continue_learning' => $this->nextIncompleteChapter($userId, $learnerLevels),
        ]);
    }

    public function progress(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'learner') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'period' => 'nullable|in:week,month,all',
            'language_id' => 'nullable|exists:languages,id',
        ]);

        $period = $validated['period'] ?? 'week';
        $languageId = $validated['language_id'] ?? null;
        $userId = $user->id;

        $allActivityCounts = $this->activityCountsByDate($userId);
        $periodStart = match ($period) {
            'month' => now()->copy()->subDays(29)->startOfDay(),
            'all' => null,
            default => now()->copy()->subDays(6)->startOfDay(),
        };

        $periodActivityCounts = $periodStart
            ? array_filter(
                $allActivityCounts,
                fn ($count, $date) => Carbon::parse($date)->greaterThanOrEqualTo($periodStart),
                ARRAY_FILTER_USE_BOTH
            )
            : $allActivityCounts;

        $completedChaptersQuery = ChapterProgress::where('user_id', $userId);
        $testsQuery = TestResult::where('user_id', $userId);

        if ($languageId) {
            $completedChaptersQuery->where('language_id', $languageId);
            $testsQuery->where('language_id', $languageId);
        }

        $lessonsDone = (clone $completedChaptersQuery)->count();
        $testsDone = (clone $testsQuery)->count();
        $xpPoints = ($lessonsDone * 20) + ($testsDone * 50);

        $skills = $this->buildSkills($userId, $languageId);
        $languageProgress = $this->buildLanguageProgress($userId);
        $heatmap = $this->buildHeatmap($allActivityCounts, 84);

        $achievementChecks = [
            ['key' => 'first_step', 'title' => 'First Step', 'desc' => 'Complete your first chapter', 'icon' => 'FS', 'unlocked' => $lessonsDone >= 1],
            ['key' => 'test_starter', 'title' => 'Test Starter', 'desc' => 'Finish your first placement test', 'icon' => 'TS', 'unlocked' => $testsDone >= 1],
            ['key' => 'streak_master', 'title' => 'Streak Master', 'desc' => 'Reach a 7-day streak', 'icon' => 'SM', 'unlocked' => $this->currentStreak($allActivityCounts) >= 7],
            ['key' => 'chapter_master', 'title' => 'Chapter Master', 'desc' => 'Complete 10 chapters', 'icon' => 'CM', 'unlocked' => $lessonsDone >= 10],
            ['key' => 'multilingual', 'title' => 'Multilingual', 'desc' => 'Enroll in 3 languages', 'icon' => 'ML', 'unlocked' => count($languageProgress) >= 3],
            ['key' => 'dedicated', 'title' => 'Dedicated', 'desc' => 'Be active on 20 different days', 'icon' => 'DD', 'unlocked' => count($allActivityCounts) >= 20],
        ];

        $unlockedAchievements = count(array_filter($achievementChecks, fn ($item) => $item['unlocked']));

        return response()->json([
            'period' => $period,
            'overview' => [
                'total_xp' => $xpPoints,
                'lessons_done' => $lessonsDone,
                'tests_done' => $testsDone,
                'day_streak' => $this->currentStreak($allActivityCounts),
                'active_days' => count($periodActivityCounts),
            ],
            'heatmap' => $heatmap,
            'skills' => $skills,
            'languages' => $languageProgress,
            'achievements' => [
                'unlocked' => $unlockedAchievements,
                'total' => count($achievementChecks),
                'items' => $achievementChecks,
            ],
        ]);
    }

    private function chapterTotalsForLevels(int $userId, $learnerLevels): array
    {
        $totalChapters = 0;
        $completedInCurrentLevels = 0;
        $coursesInProgress = 0;

        foreach ($learnerLevels as $item) {
            $total = Chapter::where('language_id', $item->language_id)
                ->where('level_id', $item->level_id)
                ->where('is_published', true)
                ->count();

            $completed = ChapterProgress::where('user_id', $userId)
                ->where('language_id', $item->language_id)
                ->whereHas('chapter', function ($q) use ($item) {
                    $q->where('level_id', $item->level_id)->where('is_published', true);
                })
                ->count();

            $totalChapters += $total;
            $completedInCurrentLevels += $completed;

            if ($total > 0 && $completed < $total) {
                $coursesInProgress++;
            }
        }

        return [
            'courses_in_progress' => $coursesInProgress,
            'overall_progress' => $totalChapters > 0 ? (int) round(($completedInCurrentLevels / $totalChapters) * 100) : 0,
        ];
    }

    private function nextIncompleteChapter(int $userId, $learnerLevels): ?array
    {
        $completedIds = ChapterProgress::where('user_id', $userId)->pluck('chapter_id');

        foreach ($learnerLevels as $item) {
            $chapter = Chapter::with(['language:id,name,code,image', 'level:id,name,order'])
                ->where('language_id', $item->language_id)
                ->where('level_id', $item->level_id)
                ->where('is_published', true)
                ->whereNotIn('id', $completedIds)
                ->orderBy('order')
                ->first();

            if ($chapter) {
                $total = Chapter::where('language_id', $item->language_id)
                    ->where('level_id', $item->level_id)
                    ->where('is_published', true)
                    ->count();

                $completed = $completedIds->intersect(
                    Chapter::where('language_id', $item->language_id)
                        ->where('level_id', $item->level_id)
                        ->where('is_published', true)
                        ->pluck('id')
                )->count();

                return [
                    'chapter_id' => $chapter->id,
                    'chapter_title' => $chapter->title,
                    'chapter_order' => $chapter->order,
                    'language_name' => $chapter->language->name,
                    'language_code' => $chapter->language->code,
                    'level_name' => $chapter->level->name,
                    'completed' => $completed,
                    'total' => $total,
                ];
            }
        }

        return null;
    }

    private function buildSkills(int $userId, ?int $languageId): array
    {
        $query = TestResult::where('user_id', $userId);
        if ($languageId) {
            $query->where('language_id', $languageId);
        }

        $results = $query->get([
            'vocab_score',
            'grammar_score',
            'reading_score',
            'listening_score',
            'writing_score',
        ]);

        $count = $results->count();
        if ($count === 0) {
            return [
                ['skill' => 'Grammar', 'progress' => 0],
                ['skill' => 'Vocabulary', 'progress' => 0],
                ['skill' => 'Reading', 'progress' => 0],
                ['skill' => 'Listening', 'progress' => 0],
                ['skill' => 'Writing', 'progress' => 0],
            ];
        }

        // In this project test generation targets 12 points per category (2 questions x difficulties 1,2,3).
        $categoryMax = 12 * $count;
        $sum = [
            'grammar' => (int) $results->sum('grammar_score'),
            'vocabulary' => (int) $results->sum('vocab_score'),
            'reading' => (int) $results->sum('reading_score'),
            'listening' => (int) $results->sum('listening_score'),
            'writing' => (int) $results->sum('writing_score'),
        ];

        return [
            ['skill' => 'Grammar', 'progress' => $this->scoreToPercent($sum['grammar'], $categoryMax)],
            ['skill' => 'Vocabulary', 'progress' => $this->scoreToPercent($sum['vocabulary'], $categoryMax)],
            ['skill' => 'Reading', 'progress' => $this->scoreToPercent($sum['reading'], $categoryMax)],
            ['skill' => 'Listening', 'progress' => $this->scoreToPercent($sum['listening'], $categoryMax)],
            ['skill' => 'Writing', 'progress' => $this->scoreToPercent($sum['writing'], $categoryMax)],
        ];
    }

    private function buildLanguageProgress(int $userId): array
    {
        $levels = LearnerLevel::with([
            'language:id,name,code,image',
            'level:id,name,order',
        ])->where('user_id', $userId)->get();

        $rows = [];
        foreach ($levels as $item) {
            $total = Chapter::where('language_id', $item->language_id)
                ->where('level_id', $item->level_id)
                ->where('is_published', true)
                ->count();

            $completed = ChapterProgress::where('user_id', $userId)
                ->where('language_id', $item->language_id)
                ->whereHas('chapter', function ($q) use ($item) {
                    $q->where('level_id', $item->level_id)->where('is_published', true);
                })
                ->count();

            $rows[] = [
                'id' => $item->language->id,
                'name' => $item->language->name,
                'code' => $item->language->code,
                'image_url' => $item->language->image ? asset('storage/' . $item->language->image) : null,
                'level_name' => $item->level->name,
                'level_order' => $item->level->order,
                'completed' => $completed,
                'total' => $total,
                'percentage' => $total > 0 ? (int) round(($completed / $total) * 100) : 0,
            ];
        }

        return $rows;
    }

    private function buildHeatmap(array $activityCounts, int $days): array
    {
        $items = [];
        $start = now()->subDays($days - 1)->startOfDay();
        for ($i = 0; $i < $days; $i++) {
            $date = $start->copy()->addDays($i)->toDateString();
            $count = $activityCounts[$date] ?? 0;
            $items[] = [
                'date' => $date,
                'count' => $count,
                'level' => $count <= 0 ? 0 : ($count === 1 ? 1 : ($count === 2 ? 2 : 3)),
            ];
        }

        return $items;
    }

    private function activityCountsByDate(int $userId): array
    {
        $counts = [];

        $chapterDates = ChapterProgress::where('user_id', $userId)
            ->pluck('completed_at');
        foreach ($chapterDates as $dateTime) {
            $date = Carbon::parse($dateTime)->toDateString();
            $counts[$date] = ($counts[$date] ?? 0) + 1;
        }

        $testDates = TestResult::where('user_id', $userId)
            ->pluck('created_at');
        foreach ($testDates as $dateTime) {
            $date = Carbon::parse($dateTime)->toDateString();
            $counts[$date] = ($counts[$date] ?? 0) + 1;
        }

        ksort($counts);
        return $counts;
    }

    private function currentStreak(array $activityCounts): int
    {
        $streak = 0;
        $cursor = now()->startOfDay();

        while (($activityCounts[$cursor->toDateString()] ?? 0) > 0) {
            $streak++;
            $cursor->subDay();
        }

        return $streak;
    }

    private function scoreToPercent(int $score, int $max): int
    {
        if ($max <= 0) {
            return 0;
        }

        return max(0, min(100, (int) round(($score / $max) * 100)));
    }
}
