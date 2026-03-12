<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LearnerLevel;
use App\Models\Level;
use App\Models\TestQuestion;
use App\Models\TestResult;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TestController extends Controller
{
    // ─── INSTRUCTOR: List questions (with filters) ───

    public function index(Request $request)
    {
        $query = TestQuestion::with('language:id,name,code')
            ->where('instructor_id', $request->user()->id);

        if ($request->filled('language_id')) {
            $query->where('language_id', $request->language_id);
        }
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }
        if ($request->filled('difficulty')) {
            $query->where('difficulty', $request->difficulty);
        }
        if ($request->filled('search')) {
            $query->where('question_text', 'like', "%{$request->search}%");
        }

        $questions = $query->orderBy('language_id')
            ->orderBy('category')
            ->orderBy('difficulty')
            ->get();

        // Append audio URL for listening questions
        $questions->each(function ($q) {
            $q->audio_url = $q->audio_path ? asset('storage/' . $q->audio_path) : null;
        });

        return response()->json($questions);
    }

    // ─── INSTRUCTOR: Create a question ───

    public function store(Request $request)
    {
        $category = $request->input('category');

        $rules = [
            'language_id'   => 'required|exists:languages,id',
            'category'      => 'required|in:vocabulary,grammar,reading,listening,writing',
            'difficulty'    => 'required|in:1,2,3',
            'question_text' => 'required|string|max:2000',
        ];

        // Category-specific validation
        if ($category === 'reading') {
            $rules['passage'] = 'required|string|max:5000';
            $rules += $this->mcqRules();
        } elseif ($category === 'listening') {
            $rules['audio'] = 'required|file|mimes:mp3,wav,ogg,m4a|max:10240';
            $rules += $this->mcqRules();
        } elseif ($category === 'writing') {
            $rules['correct_text'] = 'required|string|max:1000';
        } else {
            // vocabulary & grammar = standard MCQ
            $rules += $this->mcqRules();
        }

        $validated = $request->validate($rules);
        $data = collect($validated)->except('audio')->toArray();
        $data['instructor_id'] = $request->user()->id;

        // Ensure language is assigned to this instructor
        $lang = \App\Models\Language::find($data['language_id']);
        if (!$lang || $lang->instructor_id !== $request->user()->id) {
            return response()->json(['message' => 'You are not assigned to this language.'], 403);
        }

        // Handle audio upload for listening
        if ($request->hasFile('audio')) {
            $data['audio_path'] = $request->file('audio')->store('test-audio', 'public');
        }

        $question = TestQuestion::create($data);
        $question->load('language:id,name,code');
        $question->audio_url = $question->audio_path ? asset('storage/' . $question->audio_path) : null;

        return response()->json($question, 201);
    }

    // ─── INSTRUCTOR: Update a question ───

    public function update(Request $request, TestQuestion $question)
    {
        if ($question->instructor_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $category = $request->input('category');

        $rules = [
            'language_id'   => 'required|exists:languages,id',
            'category'      => 'required|in:vocabulary,grammar,reading,listening,writing',
            'difficulty'    => 'required|in:1,2,3',
            'question_text' => 'required|string|max:2000',
        ];

        if ($category === 'reading') {
            $rules['passage'] = 'required|string|max:5000';
            $rules += $this->mcqRules();
        } elseif ($category === 'listening') {
            $rules['audio'] = 'nullable|file|mimes:mp3,wav,ogg,m4a|max:10240';
            $rules += $this->mcqRules();
        } elseif ($category === 'writing') {
            $rules['correct_text'] = 'required|string|max:1000';
        } else {
            $rules += $this->mcqRules();
        }

        $validated = $request->validate($rules);
        $data = collect($validated)->except('audio')->toArray();

        // Handle audio upload
        if ($request->hasFile('audio')) {
            // Delete old audio
            if ($question->audio_path) {
                Storage::disk('public')->delete($question->audio_path);
            }
            $data['audio_path'] = $request->file('audio')->store('test-audio', 'public');
        }

        // Clear fields that don't apply to the new category
        if ($category === 'writing') {
            $data['option_a'] = null;
            $data['option_b'] = null;
            $data['option_c'] = null;
            $data['option_d'] = null;
            $data['correct_option'] = null;
            $data['audio_path'] = $question->audio_path; // keep or overwrite above
            if (!$request->hasFile('audio')) {
                $data['audio_path'] = null;
            }
            $data['passage'] = null;
        } elseif ($category === 'listening') {
            $data['passage'] = null;
            $data['correct_text'] = null;
        } elseif ($category === 'reading') {
            $data['correct_text'] = null;
            if (!$request->hasFile('audio')) {
                $data['audio_path'] = null;
            }
        } else {
            $data['passage'] = null;
            $data['correct_text'] = null;
            if (!$request->hasFile('audio')) {
                $data['audio_path'] = null;
            }
        }

        $question->update($data);
        $question->load('language:id,name,code');
        $question->audio_url = $question->audio_path ? asset('storage/' . $question->audio_path) : null;

        return response()->json($question);
    }

    // ─── INSTRUCTOR: Delete a question ───

    public function destroy(Request $request, TestQuestion $question)
    {
        if ($question->instructor_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($question->audio_path) {
            Storage::disk('public')->delete($question->audio_path);
        }

        $question->delete();

        return response()->json(['message' => 'Question deleted.']);
    }

    // ─── INSTRUCTOR: Stats per language ───

    public function stats(Request $request)
    {
        $request->validate(['language_id' => 'required|exists:languages,id']);

        $counts = TestQuestion::where('language_id', $request->language_id)
            ->selectRaw("category, difficulty, COUNT(*) as total")
            ->groupBy('category', 'difficulty')
            ->get();

        return response()->json($counts);
    }

    // ─── LEARNER: Get test for a language (30 random questions – 5 categories) ───

    public function getTest(Request $request)
    {
        $request->validate(['language_id' => 'required|exists:languages,id']);

        // Check if learner already took this test
        $existing = TestResult::where('user_id', $request->user()->id)
            ->where('language_id', $request->language_id)
            ->first();

        if ($existing) {
            return response()->json([
                'already_taken' => true,
                'result' => $existing->load('level:id,name,order'),
            ]);
        }

        $categories = ['vocabulary', 'grammar', 'reading', 'listening', 'writing'];
        $questions = collect();

        foreach ($categories as $cat) {
            foreach ([1, 2, 3] as $diff) {
                $cols = ['id', 'category', 'question_text'];

                // Add category-specific fields
                if ($cat === 'reading')   $cols[] = 'passage';
                if ($cat === 'listening')  $cols[] = 'audio_path';
                if ($cat === 'writing')    $cols[] = 'id'; // no extra visible fields

                // MCQ categories get options
                if ($cat !== 'writing') {
                    $cols = array_merge($cols, ['option_a', 'option_b', 'option_c', 'option_d']);
                }

                $batch = TestQuestion::where('language_id', $request->language_id)
                    ->where('category', $cat)
                    ->where('difficulty', $diff)
                    ->inRandomOrder()
                    ->limit(2)
                    ->get(array_unique($cols));

                // Append audio_url for listening
                if ($cat === 'listening') {
                    $batch->each(function ($q) {
                        $q->audio_url = $q->audio_path ? asset('storage/' . $q->audio_path) : null;
                        unset($q->audio_path);
                    });
                }

                $questions = $questions->merge($batch);
            }
        }

        $questions = $questions->shuffle()->values();

        return response()->json([
            'already_taken' => false,
            'questions' => $questions,
            'total_questions' => $questions->count(),
        ]);
    }

    // ─── LEARNER: Submit test answers ───

    public function submitTest(Request $request)
    {
        $request->validate([
            'language_id' => 'required|exists:languages,id',
            'answers'     => 'required|array',
            'answers.*.question_id' => 'required|exists:test_questions,id',
            'answers.*.answer'      => 'required|string',
        ]);

        // Prevent re-submission
        $existing = TestResult::where('user_id', $request->user()->id)
            ->where('language_id', $request->language_id)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Test already taken for this language.'], 422);
        }

        $answers = collect($request->answers);
        $questionIds = $answers->pluck('question_id');
        $questions = TestQuestion::whereIn('id', $questionIds)->get()->keyBy('id');

        $scores = [
            'vocabulary' => 0,
            'grammar'    => 0,
            'reading'    => 0,
            'listening'  => 0,
            'writing'    => 0,
        ];
        $totalScore = 0;
        $maxScore = 0;

        foreach ($answers as $ans) {
            $q = $questions->get($ans['question_id']);
            if (!$q) continue;

            $points = $q->difficulty; // 1, 2, or 3
            $maxScore += $points;

            $correct = false;

            if ($q->category === 'writing') {
                // Fuzzy text comparison: normalize whitespace, strip punctuation, case-insensitive
                $normalize = function ($str) {
                    $str = mb_strtolower(trim($str));
                    $str = preg_replace('/[^\p{L}\p{N}\s]/u', '', $str);   // strip punctuation
                    $str = preg_replace('/\s+/', ' ', $str);                // collapse whitespace
                    return $str;
                };
                $learnerAnswer = $normalize($ans['answer']);
                $correctAnswer = $normalize($q->correct_text);

                if ($learnerAnswer === $correctAnswer) {
                    $correct = true;
                } else {
                    // Allow minor typos via Levenshtein (threshold = 15% of correct answer length, min 1)
                    $maxDist = max(1, (int) ceil(mb_strlen($correctAnswer) * 0.15));
                    $dist = levenshtein($learnerAnswer, $correctAnswer);
                    $correct = $dist <= $maxDist;
                }
            } else {
                // MCQ comparison
                $correct = $ans['answer'] === $q->correct_option;
            }

            if ($correct) {
                $totalScore += $points;
                $scores[$q->category] += $points;
            }
        }

        // Determine level based on percentage
        $percentage = $maxScore > 0 ? ($totalScore / $maxScore) * 100 : 0;

        if ($percentage >= 67) {
            $scoredLevelOrder = 3; // Advanced
        } elseif ($percentage >= 34) {
            $scoredLevelOrder = 2; // Intermediate
        } else {
            $scoredLevelOrder = 1; // Beginner
        }

        // Check if this is a level-up retake (learner already has a level)
        $existingLearnerLevel = LearnerLevel::where('user_id', $request->user()->id)
            ->where('language_id', $request->language_id)
            ->first();

        $isLevelUpRetake = false;
        if ($existingLearnerLevel) {
            // Level-up retake: always advance to the next level (current + 1), regardless of score
            $currentOrder = Level::find($existingLearnerLevel->level_id)->order;
            $targetLevelOrder = $currentOrder + 1;
            $isLevelUpRetake = true;
        } else {
            // First-time test: use the scored level
            $targetLevelOrder = $scoredLevelOrder;
        }

        $level = Level::where('language_id', $request->language_id)
            ->where('order', $targetLevelOrder)
            ->first();

        if (!$level) {
            // Fallback: if target doesn't exist (e.g. already max), keep current level
            if ($existingLearnerLevel) {
                $level = Level::find($existingLearnerLevel->level_id);
            }
            if (!$level) {
                return response()->json(['message' => 'Level configuration error.'], 500);
            }
        }

        // Save result
        $result = TestResult::create([
            'user_id'         => $request->user()->id,
            'language_id'     => $request->language_id,
            'level_id'        => $level->id,
            'total_score'     => $totalScore,
            'max_score'       => $maxScore,
            'vocab_score'     => $scores['vocabulary'],
            'grammar_score'   => $scores['grammar'],
            'reading_score'   => $scores['reading'],
            'listening_score' => $scores['listening'],
            'writing_score'   => $scores['writing'],
        ]);

        // Update learner_levels table
        LearnerLevel::updateOrCreate(
            ['user_id' => $request->user()->id, 'language_id' => $request->language_id],
            ['level_id' => $level->id]
        );

        $leveledUp = $isLevelUpRetake;

        $result->load('level:id,name,order');

        // Build corrections array for learner review
        $corrections = [];
        foreach ($answers as $ans) {
            $q = $questions->get($ans['question_id']);
            if (!$q) continue;

            $wasCorrect = false;
            $correctDisplay = '';

            if ($q->category === 'writing') {
                $correctDisplay = $q->correct_text;
                $normalize = function ($str) {
                    $str = mb_strtolower(trim($str));
                    $str = preg_replace('/[^\p{L}\p{N}\s]/u', '', $str);
                    $str = preg_replace('/\s+/', ' ', $str);
                    return $str;
                };
                $la = $normalize($ans['answer']);
                $ca = $normalize($q->correct_text);
                $wasCorrect = $la === $ca || levenshtein($la, $ca) <= max(1, (int) ceil(mb_strlen($ca) * 0.15));
            } else {
                $correctDisplay = $q->correct_option;
                $wasCorrect = $ans['answer'] === $q->correct_option;
            }

            $corrections[] = [
                'question_id'    => $q->id,
                'category'       => $q->category,
                'question_text'  => $q->question_text,
                'your_answer'    => $ans['answer'],
                'correct_answer' => $correctDisplay,
                'is_correct'     => $wasCorrect,
                'options'        => $q->category !== 'writing' ? [
                    'a' => $q->option_a,
                    'b' => $q->option_b,
                    'c' => $q->option_c,
                    'd' => $q->option_d,
                ] : null,
            ];
        }

        return response()->json([
            'result' => $result,
            'percentage' => round($percentage, 1),
            'level_name' => $level->name,
            'corrections' => $corrections,
            'leveled_up' => $leveledUp,
        ]);
    }

    // ─── LEARNER: Get previous result for a language ───

    public function getResult(Request $request)
    {
        $request->validate(['language_id' => 'required|exists:languages,id']);

        $result = TestResult::where('user_id', $request->user()->id)
            ->where('language_id', $request->language_id)
            ->with('level:id,name,order')
            ->first();

        return response()->json($result);
    }

    // ─── LEARNER: Retake test for level-up (only when all chapters completed) ───

    public function retakeTest(Request $request)
    {
        $request->validate(['language_id' => 'required|exists:languages,id']);

        $userId = $request->user()->id;
        $langId = $request->language_id;

        // Check learner has a level and has completed all chapters in it
        $learnerLevel = LearnerLevel::where('user_id', $userId)
            ->where('language_id', $langId)
            ->first();

        if (!$learnerLevel) {
            return response()->json(['message' => 'No level found.'], 404);
        }

        $totalInLevel = \App\Models\Chapter::where('language_id', $langId)
            ->where('level_id', $learnerLevel->level_id)
            ->where('is_published', true)
            ->count();

        $completedInLevel = \App\Models\ChapterProgress::where('user_id', $userId)
            ->where('language_id', $langId)
            ->whereHas('chapter', function ($q) use ($learnerLevel) {
                $q->where('level_id', $learnerLevel->level_id)->where('is_published', true);
            })
            ->count();

        if ($completedInLevel < $totalInLevel || $totalInLevel === 0) {
            return response()->json(['message' => 'You must complete all chapters before retaking the test.'], 422);
        }

        // Check there is a next level to advance to
        $currentOrder = Level::find($learnerLevel->level_id)->order;
        $nextLevel = Level::where('language_id', $langId)
            ->where('order', $currentOrder + 1)
            ->where('is_active', true)
            ->first();

        if (!$nextLevel) {
            return response()->json(['message' => 'You are already at the highest level.'], 422);
        }

        // Delete existing test result so they can retake
        TestResult::where('user_id', $userId)
            ->where('language_id', $langId)
            ->delete();

        return response()->json(['message' => 'Test reset. You can retake it now.']);
    }

    // ─── Private helpers ───

    private function mcqRules(): array
    {
        return [
            'option_a'       => 'required|string|max:500',
            'option_b'       => 'required|string|max:500',
            'option_c'       => 'required|string|max:500',
            'option_d'       => 'required|string|max:500',
            'correct_option' => 'required|in:a,b,c,d',
        ];
    }
}
