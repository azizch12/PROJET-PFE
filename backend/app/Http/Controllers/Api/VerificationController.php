<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\VerificationCodeMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class VerificationController extends Controller
{
    /**
     * Send a 6-digit verification code to the authenticated user's email.
     */
    public function sendCode(Request $request)
    {
        $user = $request->user();

        // Already verified
        if ($user->email_verified_at) {
            return response()->json(['message' => 'Email is already verified.'], 422);
        }

        // Rate limit: don't send a new code if the last one hasn't expired yet
        if ($user->otp_code && $user->otp_expires_at && $user->otp_expires_at > now()) {
            return response()->json([
                'message' => 'A code was already sent. Please wait before requesting a new one.',
                'expires_in' => now()->diffInSeconds($user->otp_expires_at),
            ], 429);
        }

        // Generate a 6-digit code
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $user->otp_code = $code;
        $user->otp_expires_at = now()->addMinutes(5);
        $user->save();

        // Send the email
        Mail::to($user->email)->send(new VerificationCodeMail($code, $user->name));

        return response()->json(['message' => 'Verification code sent to your email.']);
    }

    /**
     * Verify the 6-digit code and mark email as verified.
     */
    public function verifyCode(Request $request)
    {
        $request->validate([
            'code' => 'required|string|size:6',
        ]);

        $user = $request->user();

        // Already verified
        if ($user->email_verified_at) {
            return response()->json(['message' => 'Email is already verified.'], 422);
        }

        // No pending code
        if (!$user->otp_code) {
            return response()->json(['message' => 'No verification code found. Please request a new one.'], 422);
        }

        // Code expired
        if ($user->otp_expires_at < now()) {
            $user->otp_code = null;
            $user->otp_expires_at = null;
            $user->save();
            return response()->json(['message' => 'Code has expired. Please request a new one.'], 422);
        }

        // Code mismatch
        if ($user->otp_code !== $request->code) {
            return response()->json(['message' => 'Invalid verification code.'], 422);
        }

        // Success — mark as verified
        $user->email_verified_at = now();
        $user->otp_code = null;
        $user->otp_expires_at = null;
        $user->save();

        return response()->json([
            'message' => 'Email verified successfully!',
            'user' => $user,
        ]);
    }
}
