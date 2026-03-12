import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, logoutUser, getUser, socialLogin as socialLoginApi } from '../api/auth';

// Step 1: Create a "container" to share auth data across all pages
const AuthContext = createContext(null);

// Step 2: The Provider — wraps the entire app and holds auth state
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Step 3: When the app starts, check if user was logged in before (page refresh)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Token exists — ask the API "who am I?"
      getUser()
        .then((res) => setUser(res.data.user))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      // No token — user is not logged in
      setLoading(false);
    }
  }, []);

  // Step 4: Login function — called from LoginPage
  const login = async (email, password) => {
    const res = await loginUser({ email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
  };

  // Step 5: Register function — called from RegisterPage
  const register = async (name, email, password, password_confirmation) => {
    const res = await registerUser({ name, email, password, password_confirmation });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
  };

  // Step 6: Logout function — called from DashboardPage
  const logout = async () => {
    try { await logoutUser(); } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('selectedLanguageId');
    setUser(null);
  };

  // Refresh user data from the API
  const refreshUser = async () => {
    try {
      const res = await getUser();
      setUser(res.data.user);
    } catch {}
  };

  // Social login (Google via Clerk) — create or find user in backend
  const googleLogin = async (email, name) => {
    const res = await socialLoginApi({ email, name });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
  };

  // Step 7: Share everything with child components
  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, googleLogin, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

// Step 8: A shortcut hook — instead of writing useContext(AuthContext) every time
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
