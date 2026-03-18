<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Code</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="460" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px 40px; text-align:center;">
                            <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:700; letter-spacing:-0.5px;">
                                🔐 Email Verification
                            </h1>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding: 36px 40px 20px;">
                            <p style="margin:0 0 8px; color:#1f2937; font-size:16px; font-weight:600;">
                                Hello {{ $userName }},
                            </p>
                            <p style="margin:0 0 28px; color:#6b7280; font-size:14px; line-height:1.6;">
                                Use the following code to verify your email address on LinguaPro. This code expires in <strong>5 minutes</strong>.
                            </p>
                        </td>
                    </tr>
                    <!-- Code -->
                    <tr>
                        <td align="center" style="padding: 0 40px 28px;">
                            <div style="background:#f5f3ff; border: 2px dashed #c4b5fd; border-radius:12px; padding: 20px 32px; display:inline-block;">
                                <span style="font-size:36px; font-weight:800; letter-spacing:10px; color:#6366f1; font-family: 'Courier New', monospace;">
                                    {{ $code }}
                                </span>
                            </div>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 0 40px 36px;">
                            <p style="margin:0; color:#9ca3af; font-size:12px; line-height:1.5; text-align:center;">
                                If you didn't request this code, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                    <!-- Bottom bar -->
                    <tr>
                        <td style="background:#f9fafb; padding: 16px 40px; text-align:center; border-top: 1px solid #f3f4f6;">
                            <p style="margin:0; color:#d1d5db; font-size:11px;">
                                © {{ date('Y') }} LinguaPro — Language Learning Platform
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
