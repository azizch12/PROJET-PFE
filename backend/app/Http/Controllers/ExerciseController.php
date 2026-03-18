<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;

class ExerciseController extends Controller
{
    public function generate(Request $request)
    {
        $request->validate([
            'language_id' => 'required|integer|exists:languages,id',
        ]);

        /** @var \App\Models\User $user */
        $user       = Auth::user();
        $userId     = (int) $user->id;
        $languageId = $request->integer('language_id');

        // Get learner's current level + language name
        $learnerLevel = DB::table('learner_levels')
            ->join('levels',     'learner_levels.level_id',    '=', 'levels.id')
            ->join('languages',  'learner_levels.language_id', '=', 'languages.id')
            ->where('learner_levels.user_id',    $userId)
            ->where('learner_levels.language_id', $languageId)
            ->select('levels.name as level_name', 'languages.name as language_name')
            ->first();

        if (! $learnerLevel) {
            return response()->json(['error' => 'No level found for this language. Please take the placement test first.'], 422);
        }

        // Get most recent test scores for this learner + language
        $testResult = DB::table('test_results')
            ->where('user_id',    $userId)
            ->where('language_id', $languageId)
            ->first();

        // Build category scores map
        $scores = [
            'vocabulary' => $testResult->vocab_score   ?? 0,
            'grammar'    => $testResult->grammar_score ?? 0,
            'reading'    => $testResult->reading_score ?? 0,
            'writing'    => $testResult->writing_score ?? 0,
        ];

        // Sort ascending, pick 2 lowest
        asort($scores);
        $weakCategories = \array_keys(\array_slice($scores, 0, 2, true));

        $levelName    = $learnerLevel->level_name;
        $languageName = $learnerLevel->language_name;
        $weakList     = implode(' and ', $weakCategories);

        $prompt = <<<PROMPT
You are a professional language teacher. Generate exactly 6 exercises in {$languageName} for a {$levelName} learner.
The learner's weakest areas are: {$weakList}. Tailor the difficulty and content to address these weaknesses.

Return ONLY a valid JSON object (no markdown, no explanation) in this exact structure:
{
  "multiple_choice": {
    "question": "...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correct": "A",
    "explanation": "..."
  },
  "fill_in_the_blank": {
    "sentence": "The sentence with a _____ to fill.",
    "answer": "correct word",
    "hint": "optional hint"
  },
  "matching": {
    "pairs": [
      {"left": "word1", "right": "translation1"},
      {"left": "word2", "right": "translation2"},
      {"left": "word3", "right": "translation3"},
      {"left": "word4", "right": "translation4"}
    ]
  },
  "translation": {
    "source_text": "Sentence to translate",
    "source_language": "English",
    "target_language": "{$languageName}",
    "suggested_answer": "The correct translation"
  },
  "listening": {
    "text_to_speak": "The sentence that will be read aloud",
    "question": "What did you hear?",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correct": "A",
    "explanation": "..."
  },
  "reading": {
    "passage": "A short reading passage in {$languageName} (3-5 sentences).",
    "question": "Comprehension question about the passage",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correct": "A",
    "explanation": "..."
  }
}
PROMPT;

        $apiKey   = config('services.groq.api_key');
        $response = Http::withHeaders([
            'Authorization' => "Bearer {$apiKey}",
            'Content-Type'  => 'application/json',
        ])->timeout(60)->post('https://api.groq.com/openai/v1/chat/completions', [
            'model'       => 'llama-3.3-70b-versatile',
            'messages'    => [['role' => 'user', 'content' => $prompt]],
            'max_tokens'  => 2000,
            'temperature' => 0.7,
        ]);

        if ($response->failed()) {
            $groqError = $response->json();
            $message   = $groqError['error']['message'] ?? 'Failed to generate exercises.';
            $type      = $groqError['error']['type']    ?? 'unknown';

            return response()->json([
                'error'   => "[Groq API {$response->status()}] {$type}: {$message}",
                'details' => $groqError,
            ], 502);
        }

        $body = $response->json();
        $raw  = $body['choices'][0]['message']['content'] ?? '';

        // Strip markdown code fences if present
        $raw = preg_replace('/^```(?:json)?\s*/i', '', trim($raw));
        $raw = preg_replace('/\s*```$/', '', $raw);

        $exercises = json_decode($raw, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return response()->json(['error' => 'Invalid response from AI. Please try again.'], 502);
        }

        return response()->json([
            'language'         => $languageName,
            'level'            => $levelName,
            'weak_categories'  => $weakCategories,
            'exercises'        => $exercises,
        ]);
    }
}
