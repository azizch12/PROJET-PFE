<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chapter;
use App\Models\ChapterProgress;
use App\Models\Language;
use App\Models\LearnerLevel;
use App\Models\Level;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ChapterController extends Controller
{
    /**
     * List chapters for the authenticated instructor, with optional filters.
     */
    public function index(Request $request)
    {
        $query = Chapter::with(['level:id,name,order', 'language:id,name,code,image'])
            ->where('instructor_id', $request->user()->id);

        if ($request->filled('level_id')) {
            $query->where('level_id', $request->level_id);
        }

        if ($request->filled('language_id')) {
            $query->where('language_id', $request->language_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('title', 'like', "%{$search}%");
        }

        $chapters = $query->orderBy('language_id')
            ->orderBy('level_id')
            ->orderBy('order')
            ->get();

        $chapters->transform(function ($ch) {
            $ch->pdf_url = $ch->pdf_path ? asset('storage/' . $ch->pdf_path) : null;
            return $ch;
        });

        return response()->json($chapters);
    }

    /**
     * Store a new chapter.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'level_id'    => 'required|exists:levels,id',
            'language_id' => 'required|exists:languages,id',
            'pdf'         => 'nullable|file|mimes:pdf|max:10240',
            'video_url'   => 'nullable|string|max:500',
            'order'       => 'nullable|integer|min:1',
        ]);

        $data = collect($validated)->except('pdf')->toArray();
        $data['instructor_id'] = $request->user()->id;

        // Ensure language is assigned to this instructor
        $lang = Language::find($data['language_id']);
        if (!$lang || $lang->instructor_id !== $request->user()->id) {
            return response()->json(['message' => 'You are not assigned to this language.'], 403);
        }

        if ($request->hasFile('pdf')) {
            $data['pdf_path'] = $request->file('pdf')->store('chapters/pdfs', 'public');
        }

        // Auto-set order if not provided
        if (empty($data['order'])) {
            $maxOrder = Chapter::where('level_id', $data['level_id'])
                ->where('language_id', $data['language_id'])
                ->max('order');
            $data['order'] = ($maxOrder ?? 0) + 1;
        }

        $chapter = Chapter::create($data);
        $chapter->load(['level:id,name,order', 'language:id,name,code,image']);
        $chapter->pdf_url = $chapter->pdf_path ? asset('storage/' . $chapter->pdf_path) : null;

        return response()->json($chapter, 201);
    }

    /**
     * Update a chapter.
     */
    public function update(Request $request, Chapter $chapter)
    {
        // Ensure instructor owns this chapter
        if ($chapter->instructor_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'level_id'    => 'required|exists:levels,id',
            'language_id' => 'required|exists:languages,id',
            'pdf'         => 'nullable|file|mimes:pdf|max:10240',
            'video_url'   => 'nullable|string|max:500',
            'order'       => 'nullable|integer|min:1',
        ]);

        $data = collect($validated)->except('pdf')->toArray();

        if ($request->hasFile('pdf')) {
            // Delete old PDF
            if ($chapter->pdf_path) {
                Storage::disk('public')->delete($chapter->pdf_path);
            }
            $data['pdf_path'] = $request->file('pdf')->store('chapters/pdfs', 'public');
        }

        $chapter->update($data);
        $chapter->load(['level:id,name,order', 'language:id,name,code,image']);
        $chapter->pdf_url = $chapter->pdf_path ? asset('storage/' . $chapter->pdf_path) : null;

        return response()->json($chapter);
    }

    /**
     * Delete a chapter.
     */
    public function destroy(Request $request, Chapter $chapter)
    {
        if ($chapter->instructor_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($chapter->pdf_path) {
            Storage::disk('public')->delete($chapter->pdf_path);
        }

        $chapter->delete();

        return response()->json(['message' => 'Chapter deleted.']);
    }

    /**
     * Toggle publish status.
     */
    public function togglePublish(Request $request, Chapter $chapter)
    {
        if ($chapter->instructor_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $chapter->update(['is_published' => !$chapter->is_published]);
        $chapter->load(['level:id,name,order', 'language:id,name,code,image']);
        $chapter->pdf_url = $chapter->pdf_path ? asset('storage/' . $chapter->pdf_path) : null;

        return response()->json($chapter);
    }

    /**
     * Get levels for a specific language (for instructor dropdowns).
     */
    public function levels(Request $request)
    {
        $request->validate(['language_id' => 'required|exists:languages,id']);

        $levels = Level::where('language_id', $request->language_id)
            ->where('is_active', true)
            ->orderBy('order')
            ->get(['id', 'name', 'order']);

        return response()->json($levels);
    }

    /**
     * Get published chapters for a language, filtered by the learner's current level.
     * Returns needs_test=true if the learner hasn't taken the placement test.
     */
    public function learnerChapters(Request $request)
    {
        $request->validate(['language_id' => 'required|exists:languages,id']);

        $userId = $request->user()->id;
        $langId = $request->language_id;

        // Check if learner has a level for this language
        $learnerLevel = LearnerLevel::where('user_id', $userId)
            ->where('language_id', $langId)
            ->with('level:id,name,order')
            ->first();

        if (!$learnerLevel) {
            return response()->json([
                'needs_test' => true,
                'chapters'   => [],
                'progress'   => null,
            ]);
        }

        // Get chapters only for the learner's current level
        $chapters = Chapter::where('language_id', $langId)
            ->where('level_id', $learnerLevel->level_id)
            ->where('is_published', true)
            ->orderBy('order')
            ->get();

        $chapters->transform(function ($ch) {
            $ch->pdf_url = $ch->pdf_path ? asset('storage/' . $ch->pdf_path) : null;
            return $ch;
        });

        // Get completed chapter progress for this user + language
        $completedMap = ChapterProgress::where('user_id', $userId)
            ->where('language_id', $langId)
            ->pluck('completed_at', 'chapter_id')
            ->toArray();

        // Attach completion status + timestamp
        $chapters->each(function ($ch) use ($completedMap) {
            $ch->is_completed = isset($completedMap[$ch->id]);
            $ch->completed_at = $completedMap[$ch->id] ?? null;
        });

        $totalChapters = $chapters->count();
        $completedCount = $chapters->where('is_completed', true)->count();

        // Check if there's a next level available
        $currentOrder = $learnerLevel->level->order;
        $nextLevel = Level::where('language_id', $langId)
            ->where('order', $currentOrder + 1)
            ->where('is_active', true)
            ->first();

        // Check if all chapters are completed (level test needed to advance)
        $levelCompleted = $totalChapters > 0 && $completedCount >= $totalChapters && !!$nextLevel;

        return response()->json([
            'needs_test'      => false,
            'level'           => $learnerLevel->level,
            'chapters'        => $chapters,
            'progress'        => [
                'completed'  => $completedCount,
                'total'      => $totalChapters,
                'percentage' => $totalChapters > 0 ? round(($completedCount / $totalChapters) * 100) : 0,
            ],
            'has_next_level'  => !!$nextLevel,
            'next_level'      => $nextLevel ? $nextLevel->only(['id', 'name', 'order']) : null,
            'level_completed' => $levelCompleted,
        ]);
    }

    /**
     * Mark a chapter as completed. If all chapters in the level are done, level up.
     */
    public function completeChapter(Request $request, Chapter $chapter)
    {
        $userId = $request->user()->id;
        $langId = $chapter->language_id;

        // Ensure chapter is published
        if (!$chapter->is_published) {
            return response()->json(['message' => 'Chapter not available.'], 404);
        }

        // Ensure learner has a level for this language
        $learnerLevel = LearnerLevel::where('user_id', $userId)
            ->where('language_id', $langId)
            ->first();

        if (!$learnerLevel || $learnerLevel->level_id !== $chapter->level_id) {
            return response()->json(['message' => 'This chapter is not in your current level.'], 403);
        }

        // Mark as completed (ignore if already done)
        ChapterProgress::firstOrCreate(
            ['user_id' => $userId, 'chapter_id' => $chapter->id],
            ['language_id' => $langId, 'completed_at' => now()]
        );

        // Check if ALL published chapters in this level are now completed
        $totalInLevel = Chapter::where('language_id', $langId)
            ->where('level_id', $learnerLevel->level_id)
            ->where('is_published', true)
            ->count();

        $completedInLevel = ChapterProgress::where('user_id', $userId)
            ->where('language_id', $langId)
            ->whereHas('chapter', function ($q) use ($learnerLevel) {
                $q->where('level_id', $learnerLevel->level_id)
                  ->where('is_published', true);
            })
            ->count();

        $needsLevelTest = false;
        $nextLevel = null;

        if ($completedInLevel >= $totalInLevel && $totalInLevel > 0) {
            // Check if there's a next level
            $currentOrder = Level::find($learnerLevel->level_id)->order;
            $next = Level::where('language_id', $langId)
                ->where('order', $currentOrder + 1)
                ->where('is_active', true)
                ->first();

            if ($next) {
                // Don't auto-level-up — learner must retake placement test first
                $needsLevelTest = true;
                $nextLevel = $next->only(['id', 'name', 'order']);
            }
        }

        return response()->json([
            'completed'        => true,
            'leveled_up'       => false,
            'needs_level_test' => $needsLevelTest,
            'next_level'       => $nextLevel,
            'completed_count'  => $completedInLevel,
            'total_count'      => $totalInLevel,
            'percentage'       => $totalInLevel > 0 ? round(($completedInLevel / $totalInLevel) * 100) : 0,
        ]);
    }

    /**
     * Get languages assigned to the authenticated instructor.
     */
    public function instructorLanguages(Request $request)
    {
        $languages = Language::where('is_active', true)
            ->where('instructor_id', $request->user()->id)
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'image']);

        $languages->transform(function ($lang) {
            $lang->image_url = $lang->image ? asset('storage/' . $lang->image) : null;
            return $lang;
        });

        return response()->json($languages);
    }
}
