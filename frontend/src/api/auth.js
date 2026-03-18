import client from './client';

export const registerUser = (data) => client.post('/register', data);
export const loginUser    = (data) => client.post('/login', data);
export const logoutUser      = ()     => client.post('/logout');
export const getUser         = ()     => client.get('/user');
export const forgotPassword  = (data) => client.post('/forgot-password', data);
export const resetPassword   = (data) => client.post('/reset-password', data);
export const socialLogin     = (data) => client.post('/social-login', data);

// Email verification (OTP)
export const sendVerificationCode = () => client.post('/email/send-code');
export const verifyEmailCode      = (data) => client.post('/email/verify-code', data);

export const updateProfile   = (data) => client.put('/profile', data);
export const updatePassword  = (data) => client.put('/profile/password', data);
export const uploadAvatar    = (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  return client.post('/profile/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const removeAvatar    = ()     => client.delete('/profile/avatar');

// Admin
export const getUsers          = (params) => client.get('/admin/users', { params });
export const toggleUserActive  = (id)     => client.patch(`/admin/users/${id}/toggle`);
export const addInstructor     = (data)   => client.post('/admin/users', data);
export const updateUser        = (id, data) => client.put(`/admin/users/${id}`, data);
export const deleteUser        = (id)     => client.delete(`/admin/users/${id}`);

// Languages
export const getLanguages        = (params) => client.get('/admin/languages', { params });
export const getActiveLanguages  = ()       => client.get('/languages/active');
export const addLanguage         = (data)   => {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('code', data.code);
  if (data.image) formData.append('image', data.image);
  if (data.instructor_id) formData.append('instructor_id', data.instructor_id);
  return client.post('/admin/languages', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const updateLanguage      = (id, data) => {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('code', data.code);
  if (data.image) formData.append('image', data.image);
  if (data.instructor_id) formData.append('instructor_id', data.instructor_id);
  return client.post(`/admin/languages/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const deleteLanguage      = (id)     => client.delete(`/admin/languages/${id}`);
export const toggleLanguageActive = (id)    => client.patch(`/admin/languages/${id}/toggle`);
export const assignInstructor    = (id, data) => client.put(`/admin/languages/${id}/instructor`, data);
export const getInstructors      = ()       => client.get('/admin/instructors');

// Instructor – Chapters
export const getInstructorLanguages = ()       => client.get('/instructor/languages');
export const getInstructorLevels    = (params) => client.get('/instructor/levels', { params });
export const getChapters            = (params) => client.get('/instructor/chapters', { params });
export const addChapter             = (data)   => {
  const formData = new FormData();
  formData.append('title', data.title);
  if (data.description) formData.append('description', data.description);
  formData.append('level_id', data.level_id);
  formData.append('language_id', data.language_id);
  if (data.pdf) formData.append('pdf', data.pdf);
  if (data.video_url) formData.append('video_url', data.video_url);
  if (data.order) formData.append('order', data.order);
  return client.post('/instructor/chapters', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const updateChapter          = (id, data) => {
  const formData = new FormData();
  formData.append('title', data.title);
  if (data.description) formData.append('description', data.description);
  formData.append('level_id', data.level_id);
  formData.append('language_id', data.language_id);
  if (data.pdf) formData.append('pdf', data.pdf);
  if (data.video_url) formData.append('video_url', data.video_url);
  if (data.order) formData.append('order', data.order);
  return client.post(`/instructor/chapters/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const deleteChapter          = (id)     => client.delete(`/instructor/chapters/${id}`);
export const toggleChapterPublish   = (id)     => client.patch(`/instructor/chapters/${id}/toggle`);

// Instructor – Test Questions
export const getTestQuestions       = (params) => client.get('/instructor/test-questions', { params });
export const addTestQuestion        = (data)   => {
  const formData = new FormData();
  formData.append('language_id', data.language_id);
  formData.append('category', data.category);
  formData.append('difficulty', data.difficulty);
  formData.append('question_text', data.question_text);
  if (data.passage) formData.append('passage', data.passage);
  if (data.audio) formData.append('audio', data.audio);
  if (data.correct_text) formData.append('correct_text', data.correct_text);
  if (data.option_a) formData.append('option_a', data.option_a);
  if (data.option_b) formData.append('option_b', data.option_b);
  if (data.option_c) formData.append('option_c', data.option_c);
  if (data.option_d) formData.append('option_d', data.option_d);
  if (data.correct_option) formData.append('correct_option', data.correct_option);
  return client.post('/instructor/test-questions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const updateTestQuestion     = (id, data) => {
  const formData = new FormData();
  formData.append('language_id', data.language_id);
  formData.append('category', data.category);
  formData.append('difficulty', data.difficulty);
  formData.append('question_text', data.question_text);
  if (data.passage) formData.append('passage', data.passage);
  if (data.audio) formData.append('audio', data.audio);
  if (data.correct_text) formData.append('correct_text', data.correct_text);
  if (data.option_a) formData.append('option_a', data.option_a);
  if (data.option_b) formData.append('option_b', data.option_b);
  if (data.option_c) formData.append('option_c', data.option_c);
  if (data.option_d) formData.append('option_d', data.option_d);
  if (data.correct_option) formData.append('correct_option', data.correct_option);
  formData.append('_method', 'PUT');
  return client.post(`/instructor/test-questions/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const deleteTestQuestion     = (id)     => client.delete(`/instructor/test-questions/${id}`);
export const getTestQuestionStats   = (params) => client.get('/instructor/test-questions/stats', { params });

// Learner – chapters by language (level-filtered + progress)
export const getLearnerChapters     = (params) => client.get('/learner/chapters', { params });
export const completeChapter        = (id)     => client.post(`/learner/chapters/${id}/complete`);

// Learner – placement test
export const getLearnerTest         = (params) => client.get('/learner/test', { params });
export const submitLearnerTest      = (data)   => client.post('/learner/test/submit', data);
export const getLearnerTestResult   = (params) => client.get('/learner/test/result', { params });
export const retakeLearnerTest      = (data)   => client.post('/learner/test/retake', data);


export const getLearnerDashboard    = ()       => client.get('/learner/dashboard');
export const getLearnerProgress     = (params) => client.get('/learner/progress', { params });

// Learner – AI-generated exercises
export const generateExercises = (languageId) =>
    client.get(`/learner/exercises?language_id=${languageId}`).then(r => r.data);
