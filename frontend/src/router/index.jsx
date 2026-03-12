import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import DashboardPage from '../pages/DashboardPage';
import ProfilePage from '../pages/ProfilePage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminLanguagesPage from '../pages/admin/AdminLanguagesPage';
import LearnerLanguagesPage from '../pages/learner/LearnerLanguagesPage';
import LearnerCoursesPage from '../pages/learner/LearnerCoursesPage';
import LearnerExercisesPage from '../pages/learner/LearnerExercisesPage';
import LearnerProgressPage from '../pages/learner/LearnerProgressPage';
import LearnerTestPage from '../pages/learner/LearnerTestPage';
import InstructorChaptersPage from '../pages/instructor/InstructorChaptersPage';
import InstructorTestQuestionsPage from '../pages/instructor/InstructorTestQuestionsPage';
import SSOCallbackPage from '../pages/auth/SSOCallbackPage';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminLayout from '../components/AdminLayout';
import InstructorLayout from '../components/InstructorLayout';
import LearnerLayout from '../components/LearnerLayout';

// If already logged in, redirect away from login/register/landing pages
function GuestRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

// Picks the correct sidebar layout based on role
function RoleBasedLayout() {
  const { user } = useAuth();
  if (user?.role === 'admin') return <AdminLayout />;
  if (user?.role === 'instructor') return <InstructorLayout />;
  return <LearnerLayout />;
}

const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      { path: '/',                element: <LandingPage /> },
      { path: '/login',           element: <LoginPage /> },
      { path: '/register',        element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password',  element: <ResetPasswordPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RoleBasedLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/profile',   element: <ProfilePage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin/users',     element: <AdminUsersPage /> },
          { path: '/admin/languages', element: <AdminLanguagesPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['instructor']} />,
    children: [
      {
        element: <InstructorLayout />,
        children: [
          { path: '/instructor/chapters',       element: <InstructorChaptersPage /> },
          { path: '/instructor/test-questions', element: <InstructorTestQuestionsPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['learner']} />,
    children: [
      {
        element: <LearnerLayout />,
        children: [
          { path: '/learner/languages', element: <LearnerLanguagesPage /> },
          { path: '/learner/courses',   element: <LearnerCoursesPage /> },
          { path: '/learner/exercises', element: <LearnerExercisesPage /> },
          { path: '/learner/progress',  element: <LearnerProgressPage /> },
          { path: '/learner/test',      element: <LearnerTestPage /> },
        ],
      },
    ],
  },
  // SSO callback route (must be public, outside GuestRoute/ProtectedRoute)
  { path: '/sso-callback', element: <SSOCallbackPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default router;
