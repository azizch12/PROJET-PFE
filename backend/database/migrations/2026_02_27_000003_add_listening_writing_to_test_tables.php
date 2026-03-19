<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add new columns
        Schema::table('test_questions', function (Blueprint $table) {
            $table->string('audio_path')->nullable()->after('passage')->comment('Audio file for listening questions');
            $table->string('correct_text')->nullable()->after('correct_option')->comment('Correct typed answer for writing questions');
        });

        // Expand category to include 'listening'
        DB::statement('ALTER TABLE test_questions DROP CONSTRAINT IF EXISTS test_questions_category_check');
        DB::statement("ALTER TABLE test_questions ALTER COLUMN category TYPE VARCHAR(255)");
        DB::statement("ALTER TABLE test_questions ADD CONSTRAINT test_questions_category_check CHECK (category IN ('vocabulary','grammar','reading','listening','writing'))");

        // Make MCQ option columns nullable
        DB::statement('ALTER TABLE test_questions ALTER COLUMN option_a DROP NOT NULL');
        DB::statement('ALTER TABLE test_questions ALTER COLUMN option_b DROP NOT NULL');
        DB::statement('ALTER TABLE test_questions ALTER COLUMN option_c DROP NOT NULL');
        DB::statement('ALTER TABLE test_questions ALTER COLUMN option_d DROP NOT NULL');

        // Make correct_option nullable and update its check constraint
        DB::statement('ALTER TABLE test_questions DROP CONSTRAINT IF EXISTS test_questions_correct_option_check');
        DB::statement('ALTER TABLE test_questions ALTER COLUMN correct_option DROP NOT NULL');
        DB::statement("ALTER TABLE test_questions ADD CONSTRAINT test_questions_correct_option_check CHECK (correct_option IN ('a','b','c','d') OR correct_option IS NULL)");

        // 2. Add listening_score to test_results
        Schema::table('test_results', function (Blueprint $table) {
            $table->unsignedSmallInteger('listening_score')->default(0)->after('reading_score');
        });
    }

    public function down(): void
    {
        Schema::table('test_questions', function (Blueprint $table) {
            $table->dropColumn(['audio_path', 'correct_text']);
        });

        // Revert category to original values
        DB::statement('ALTER TABLE test_questions DROP CONSTRAINT IF EXISTS test_questions_category_check');
        DB::statement("ALTER TABLE test_questions ADD CONSTRAINT test_questions_category_check CHECK (category IN ('vocabulary','grammar','reading','writing'))");

        // Restore MCQ option columns to NOT NULL
        DB::statement('ALTER TABLE test_questions ALTER COLUMN option_a SET NOT NULL');
        DB::statement('ALTER TABLE test_questions ALTER COLUMN option_b SET NOT NULL');
        DB::statement('ALTER TABLE test_questions ALTER COLUMN option_c SET NOT NULL');
        DB::statement('ALTER TABLE test_questions ALTER COLUMN option_d SET NOT NULL');

        // Restore correct_option to NOT NULL with original check constraint
        DB::statement('ALTER TABLE test_questions DROP CONSTRAINT IF EXISTS test_questions_correct_option_check');
        DB::statement('ALTER TABLE test_questions ALTER COLUMN correct_option SET NOT NULL');
        DB::statement("ALTER TABLE test_questions ADD CONSTRAINT test_questions_correct_option_check CHECK (correct_option IN ('a','b','c','d'))");

        Schema::table('test_results', function (Blueprint $table) {
            $table->dropColumn('listening_score');
        });
    }
};
