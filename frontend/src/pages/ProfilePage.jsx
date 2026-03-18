import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile, updatePassword, uploadAvatar, removeAvatar, sendVerificationCode, verifyEmailCode } from '../api/auth';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    bio: user?.bio || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Email verification states
  const [otpStep, setOtpStep] = useState('idle'); // idle | sending | sent | verifying | verified
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const otpInputRefs = useRef([]);
  const cooldownRef = useRef(null);

  const isVerified = !!user?.email_verified_at;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await updateProfile({
        name: [form.firstName, form.lastName].filter(Boolean).join(' '),
        email: form.email,
        bio: form.bio,
      });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSaving(true);
    try {
      await updatePassword(passwordForm);
      setPasswordSaved(true);
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
      setTimeout(() => setPasswordSaved(false), 3000);
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      await uploadAvatar(file);
      await refreshUser();
    } catch {}
    setAvatarLoading(false);
  };

  const handleAvatarRemove = async () => {
    setAvatarLoading(true);
    try {
      await removeAvatar();
      await refreshUser();
    } catch {}
    setAvatarLoading(false);
  };

  // OTP handlers
  const handleSendCode = async () => {
    setOtpStep('sending');
    setOtpError('');
    try {
      await sendVerificationCode();
      setOtpStep('sent');
      setOtpCode(['', '', '', '', '', '']);
      // Start cooldown (60 seconds)
      setOtpCooldown(60);
      if (cooldownRef.current) clearInterval(cooldownRef.current);
      cooldownRef.current = setInterval(() => {
        setOtpCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(cooldownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      // Focus first input
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Failed to send code.');
      setOtpStep('idle');
    }
  };

  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;
    const newCode = [...otpCode];
    newCode[index] = value;
    setOtpCode(newCode);
    setOtpError('');

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (value && index === 5 && newCode.every((d) => d !== '')) {
      handleVerifyCode(newCode.join(''));
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split('');
      setOtpCode(newCode);
      otpInputRefs.current[5]?.focus();
      handleVerifyCode(pasted);
    }
  };

  const handleVerifyCode = async (code) => {
    setOtpStep('verifying');
    setOtpError('');
    try {
      await verifyEmailCode({ code });
      await refreshUser();
      setOtpStep('verified');
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid code.');
      setOtpStep('sent');
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info' },
    { id: 'security', label: 'Account Security' },
    { id: 'notifications', label: 'Notifications' },
  ];

  const dark = user?.role === 'admin';

  return (
    <div>
        {/* Title */}
        <div className="mb-8">
          <h1 className={`text-2xl font-bold tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>Manage Profile</h1>
          <p className={`text-sm mt-1.5 leading-relaxed ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
            Update your photo and personal details here. These changes will be visible across the platform.
          </p>
        </div>

        {/* Email not verified banner */}
        {!isVerified && (
          <div className={`mb-6 flex items-center gap-3 p-4 rounded-2xl border ${dark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
            <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${dark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
              <svg className={`w-5 h-5 ${dark ? 'text-amber-400' : 'text-amber-600'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${dark ? 'text-amber-300' : 'text-amber-800'}`}>Email not verified</p>
              <p className={`text-xs mt-0.5 ${dark ? 'text-amber-400/70' : 'text-amber-600'}`}>
                Please verify your email address to secure your account.
              </p>
            </div>
            <button
              onClick={() => { setActiveTab('security'); }}
              className={`shrink-0 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${dark ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30' : 'bg-amber-200 text-amber-800 hover:bg-amber-300'}`}
            >
              Verify Now
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className={`border-b mb-8 ${dark ? 'border-white/10' : 'border-gray-200/80'}`}>
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 pb-3 text-[13px] font-medium border-b-2 transition-all duration-200 cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : dark ? 'border-transparent text-slate-500 hover:text-slate-300' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}>
                <span className="flex items-center gap-1.5">
                  {tab.label}
                  {tab.id === 'security' && !isVerified && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'personal' && (
          <div className="space-y-6">
            {/* Profile Photo */}
            <div className={`rounded-2xl border p-6 transition-shadow duration-300 ${dark ? 'bg-[#111827] border-white/5' : 'bg-white border-gray-100 hover:shadow-sm'}`}>
              <div className="flex items-center gap-6">
                <div className="relative">
                  {user?.avatar ? (
                    <img src={`http://localhost:8000/storage/${user.avatar}`} alt="Avatar"
                      className={`w-20 h-20 rounded-full object-cover ring-4 ${dark ? 'ring-white/5' : 'ring-gray-50'}`} />
                  ) : (
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl ring-4 ${dark ? 'bg-blue-500/10 text-blue-400 ring-blue-500/10' : 'bg-blue-50 text-blue-600 ring-blue-50/50'}`}>
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className={`absolute -bottom-0.5 -right-0.5 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center ring-2 shadow-sm ${dark ? 'ring-[#111827]' : 'ring-white'}`}>
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className={`font-semibold text-[15px] ${dark ? 'text-white' : 'text-gray-800'}`}>Profile Photo</h3>
                  <p className={`text-[13px] mb-3 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>This will be displayed on your profile and in courses.</p>
                  <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
                  <div className="flex items-center gap-3">
                    <button onClick={() => fileInputRef.current.click()} disabled={avatarLoading}
                      className={`px-4 py-1.5 text-[13px] border rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 font-medium ${dark ? 'border-white/10 text-slate-300 hover:bg-white/5 hover:border-white/20' : 'border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'}`}>
                      {avatarLoading ? 'Uploading...' : 'Change photo'}
                    </button>
                    {user?.avatar && (
                      <button onClick={handleAvatarRemove} disabled={avatarLoading}
                        className={`px-4 py-1.5 text-[13px] rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 font-medium ${dark ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' : 'text-red-500 hover:text-red-600 hover:bg-red-50'}`}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <div className={`rounded-2xl border p-6 transition-shadow duration-300 ${dark ? 'bg-[#111827] border-white/5' : 'bg-white border-gray-100 hover:shadow-sm'}`}>
              <h3 className={`font-semibold mb-1 text-[15px] ${dark ? 'text-white' : 'text-gray-800'}`}>Personal Details</h3>
              <p className={`text-[13px] mb-6 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Update your personal information used for communications.</p>

              <form onSubmit={handleSave} className="space-y-5">
                {error && (
                  <div className={`p-3 border rounded-xl text-[13px] flex items-center gap-2 ${dark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-100 text-red-600'}`}>
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-[13px] font-medium mb-1.5 ${dark ? 'text-slate-300' : 'text-gray-700'}`}>First Name</label>
                    <input name="firstName" value={form.firstName} onChange={handleChange}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-shadow duration-200 ${dark ? 'bg-white/5 border-white/10 text-slate-200 hover:border-white/20' : 'border-gray-200 hover:border-gray-300'}`} />
                  </div>
                  <div>
                    <label className={`block text-[13px] font-medium mb-1.5 ${dark ? 'text-slate-300' : 'text-gray-700'}`}>Last Name</label>
                    <input name="lastName" value={form.lastName} onChange={handleChange}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-shadow duration-200 ${dark ? 'bg-white/5 border-white/10 text-slate-200 hover:border-white/20' : 'border-gray-200 hover:border-gray-300'}`} />
                  </div>
                </div>

                <div>
                  <label className={`block text-[13px] font-medium mb-1.5 ${dark ? 'text-slate-300' : 'text-gray-700'}`}>Email Address</label>
                  <div className="relative">
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${dark ? 'text-slate-500' : 'text-gray-400'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </span>
                    <input name="email" type="email" value={form.email} onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-shadow duration-200 ${dark ? 'bg-white/5 border-white/10 text-slate-200 hover:border-white/20' : 'border-gray-200 hover:border-gray-300'}`} />
                  </div>
                </div>

                <div>
                  <label className={`block text-[13px] font-medium mb-1.5 ${dark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Bio <span className={`font-normal ${dark ? 'text-slate-500' : 'text-gray-400'}`}>(Optional)</span>
                  </label>
                  <textarea name="bio" value={form.bio} onChange={handleChange} rows={4} maxLength={500}
                    placeholder="Tell us a little about yourself..."
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-sm transition-shadow duration-200 ${dark ? 'bg-white/5 border-white/10 text-slate-200 placeholder-slate-500 hover:border-white/20' : 'border-gray-200 hover:border-gray-300'}`} />
                  <div className="flex items-center justify-between mt-1">
                    <p className={`text-xs ${dark ? 'text-slate-500' : 'text-gray-400'}`}>Brief description for your profile. URLs are hyperlinked.</p>
                    <span className={`text-xs ${dark ? 'text-slate-500' : 'text-gray-400'}`}>{form.bio.length}/500</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button type="submit" disabled={saving}
                    className="px-6 py-2.5 bg-blue-500 text-white text-[13px] rounded-xl font-semibold hover:bg-blue-600 disabled:opacity-50 transition-all duration-200 cursor-pointer shadow-sm shadow-blue-500/20 hover:shadow-md hover:shadow-blue-500/25">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  {saved && (
                    <span className="text-sm text-green-400 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Changes saved
                    </span>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Email Verification Section */}
            <div className={`rounded-2xl border p-6 transition-shadow duration-300 ${dark ? 'bg-[#111827] border-white/5' : 'bg-white border-gray-100 hover:shadow-sm'}`}>
              <div className="flex items-start justify-between mb-1">
                <h3 className={`font-semibold text-[15px] ${dark ? 'text-white' : 'text-gray-800'}`}>Email Verification</h3>
                {isVerified ? (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${dark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                    </svg>
                    Verified
                  </span>
                ) : (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${dark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    Not Verified
                  </span>
                )}
              </div>
              <p className={`text-[13px] mb-5 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
                {isVerified
                  ? `Your email (${user?.email}) has been verified.`
                  : 'Verify your email to secure your account and enable all features.'}
              </p>

              {/* Verified state */}
              {isVerified && (
                <div className={`flex items-center gap-3 p-4 rounded-xl ${dark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-100'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                    <svg className={`w-5 h-5 ${dark ? 'text-emerald-400' : 'text-emerald-600'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}>Your account is secured</p>
                    <p className={`text-xs mt-0.5 ${dark ? 'text-emerald-400/60' : 'text-emerald-600/70'}`}>Email verified on {new Date(user.email_verified_at).toLocaleDateString()}</p>
                  </div>
                </div>
              )}

              {/* Not verified — send code or enter code */}
              {!isVerified && otpStep !== 'verified' && (
                <div className="space-y-4">
                  {/* Idle / Send button */}
                  {(otpStep === 'idle' || otpStep === 'sending') && (
                    <div className={`p-5 rounded-xl border-2 border-dashed text-center ${dark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-gray-50/50'}`}>
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${dark ? 'bg-blue-500/15' : 'bg-blue-50'}`}>
                        <svg className={`w-7 h-7 ${dark ? 'text-blue-400' : 'text-blue-500'}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                      </div>
                      <p className={`text-sm font-medium mb-1 ${dark ? 'text-white' : 'text-gray-800'}`}>Verify your email address</p>
                      <p className={`text-xs mb-4 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
                        We'll send a 6-digit code to <strong className={dark ? 'text-slate-300' : 'text-gray-700'}>{user?.email}</strong>
                      </p>
                      <button
                        onClick={handleSendCode}
                        disabled={otpStep === 'sending'}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-white text-[13px] rounded-xl font-semibold hover:bg-blue-600 disabled:opacity-50 transition-all duration-200 cursor-pointer shadow-sm shadow-blue-500/20"
                      >
                        {otpStep === 'sending' ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                            Send Verification Code
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* OTP Input */}
                  {(otpStep === 'sent' || otpStep === 'verifying') && (
                    <div className={`p-5 rounded-xl border ${dark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-white'}`}>
                      <div className="text-center mb-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 ${dark ? 'bg-violet-500/15' : 'bg-violet-50'}`}>
                          <svg className={`w-6 h-6 ${dark ? 'text-violet-400' : 'text-violet-500'}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                          </svg>
                        </div>
                        <p className={`text-sm font-medium ${dark ? 'text-white' : 'text-gray-800'}`}>Enter verification code</p>
                        <p className={`text-xs mt-1 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
                          We sent a 6-digit code to <strong className={dark ? 'text-slate-300' : 'text-gray-700'}>{user?.email}</strong>
                        </p>
                      </div>

                      {/* 6-digit code inputs */}
                      <div className="flex items-center justify-center gap-2.5 mb-4" onPaste={handleOtpPaste}>
                        {otpCode.map((digit, i) => (
                          <input
                            key={i}
                            ref={(el) => (otpInputRefs.current[i] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(i, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                            disabled={otpStep === 'verifying'}
                            className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all duration-200 ${
                              dark
                                ? 'bg-white/5 border-white/15 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20'
                                : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                            } ${otpStep === 'verifying' ? 'opacity-50' : ''}`}
                          />
                        ))}
                      </div>

                      {/* Error */}
                      {otpError && (
                        <div className={`flex items-center justify-center gap-1.5 mb-3 text-xs font-medium ${dark ? 'text-red-400' : 'text-red-500'}`}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                          </svg>
                          {otpError}
                        </div>
                      )}

                      {/* Verifying spinner */}
                      {otpStep === 'verifying' && (
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                          <span className={`text-xs font-medium ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Verifying...</span>
                        </div>
                      )}

                      {/* Resend */}
                      <div className="text-center">
                        <p className={`text-xs ${dark ? 'text-slate-500' : 'text-gray-400'}`}>
                          Didn't receive the code?{' '}
                          {otpCooldown > 0 ? (
                            <span className={dark ? 'text-slate-400' : 'text-gray-500'}>Resend in {otpCooldown}s</span>
                          ) : (
                            <button
                              onClick={handleSendCode}
                              className={`font-semibold cursor-pointer hover:underline ${dark ? 'text-blue-400' : 'text-blue-500'}`}
                            >
                              Resend code
                            </button>
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* General error */}
                  {otpError && otpStep === 'idle' && (
                    <div className={`p-3 border rounded-xl text-[13px] flex items-center gap-2 ${dark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-100 text-red-600'}`}>
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                      {otpError}
                    </div>
                  )}
                </div>
              )}

              {/* Just verified success */}
              {!isVerified && otpStep === 'verified' && (
                <div className={`flex items-center gap-3 p-4 rounded-xl ${dark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-100'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                    <svg className={`w-5 h-5 ${dark ? 'text-emerald-400' : 'text-emerald-600'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}>Email verified successfully!</p>
                    <p className={`text-xs mt-0.5 ${dark ? 'text-emerald-400/60' : 'text-emerald-600/70'}`}>Your account is now secured.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Change Password */}
            <div className={`rounded-2xl border p-6 transition-shadow duration-300 ${dark ? 'bg-[#111827] border-white/5' : 'bg-white border-gray-100 hover:shadow-sm'}`}>
              <h3 className={`font-semibold mb-1 text-[15px] ${dark ? 'text-white' : 'text-gray-800'}`}>Change Password</h3>
              <p className={`text-[13px] mb-6 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Update your password to keep your account secure.</p>

              <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-md">
                {passwordError && (
                  <div className={`p-3 border rounded-xl text-[13px] flex items-center gap-2 ${dark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-100 text-red-600'}`}>
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                    {passwordError}
                  </div>
                )}
                {passwordSaved && (
                  <div className={`p-3 border rounded-xl text-[13px] flex items-center gap-2 ${dark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-green-50 border-green-100 text-green-600'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Password updated successfully.
                  </div>
                )}
                <div>
                  <label className={`block text-[13px] font-medium mb-1.5 ${dark ? 'text-slate-300' : 'text-gray-700'}`}>Current Password</label>
                  <input type="password" name="current_password" value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                    placeholder="••••••••"
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-shadow duration-200 ${dark ? 'bg-white/5 border-white/10 text-slate-200 placeholder-slate-500 hover:border-white/20' : 'border-gray-200 hover:border-gray-300'}`} />
                </div>
                <div>
                  <label className={`block text-[13px] font-medium mb-1.5 ${dark ? 'text-slate-300' : 'text-gray-700'}`}>New Password</label>
                  <input type="password" name="password" value={passwordForm.password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                    placeholder="••••••••"
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-shadow duration-200 ${dark ? 'bg-white/5 border-white/10 text-slate-200 placeholder-slate-500 hover:border-white/20' : 'border-gray-200 hover:border-gray-300'}`} />
                </div>
                <div>
                  <label className={`block text-[13px] font-medium mb-1.5 ${dark ? 'text-slate-300' : 'text-gray-700'}`}>Confirm New Password</label>
                  <input type="password" name="password_confirmation" value={passwordForm.password_confirmation}
                    onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
                    placeholder="••••••••"
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-shadow duration-200 ${dark ? 'bg-white/5 border-white/10 text-slate-200 placeholder-slate-500 hover:border-white/20' : 'border-gray-200 hover:border-gray-300'}`} />
                </div>
                <button type="submit" disabled={passwordSaving}
                  className="px-6 py-2.5 bg-blue-500 text-white text-[13px] rounded-xl font-semibold hover:bg-blue-600 disabled:opacity-50 transition-all duration-200 cursor-pointer shadow-sm shadow-blue-500/20 hover:shadow-md hover:shadow-blue-500/25">
                  {passwordSaving ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className={`rounded-2xl border p-6 transition-shadow duration-300 ${dark ? 'bg-[#111827] border-white/5' : 'bg-white border-gray-100 hover:shadow-sm'}`}>
            <h3 className={`font-semibold mb-1 text-[15px] ${dark ? 'text-white' : 'text-gray-800'}`}>Notification Preferences</h3>
            <p className={`text-[13px] mb-6 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Choose how you want to be notified.</p>

            <div className="space-y-3">
              {[
                { label: 'Email notifications', desc: 'Receive email updates about your courses and progress.' },
                { label: 'New course alerts', desc: 'Get notified when new courses are available in your languages.' },
                { label: 'Lesson reminders', desc: 'Daily reminders to continue your learning streak.' },
              ].map((item) => (
                <label key={item.label} className={`flex items-start justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200 ${dark ? 'border-white/5 hover:bg-white/[0.02] hover:border-white/10' : 'border-gray-100 hover:bg-gray-50/50 hover:border-gray-200'}`}>
                  <div>
                    <p className={`text-[13px] font-medium ${dark ? 'text-slate-300' : 'text-gray-700'}`}>{item.label}</p>
                    <p className={`text-xs mt-0.5 leading-relaxed ${dark ? 'text-slate-500' : 'text-gray-400'}`}>{item.desc}</p>
                  </div>
                  <input type="checkbox" defaultChecked
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
  );
}
