<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'is_active',
        'bio',
        'avatar',
        'email_verified_at',
        'otp_code',
        'otp_expires_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'otp_code',
        'otp_expires_at',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Languages assigned to this instructor.
     */
    public function languages()
    {
        return $this->hasMany(Language::class, 'instructor_id');
    }

    public function chapters()
    {
        return $this->hasMany(Chapter::class, 'instructor_id');
    }

    public function learnerLevels()
    {
        return $this->hasMany(LearnerLevel::class);
    }

    public function testQuestions()
    {
        return $this->hasMany(TestQuestion::class, 'instructor_id');
    }

    public function testResults()
    {
        return $this->hasMany(TestResult::class);
    }
}
