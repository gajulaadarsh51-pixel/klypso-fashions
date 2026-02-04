import { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const AuthModal = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authMode,
    setAuthMode,
    login,
    signup,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (authMode === 'login') {
        const result = await login(email, password);
        if (!result.success) {
          setError(result.error || 'Login failed');
        } else {
          toast.success('Welcome back!');
          resetForm();
          setIsAuthModalOpen(false);
        }
      } else {
        const result = await signup(name, email, password);
        if (!result.success) {
          setError(result.error || 'Signup failed');
        } else {
          toast.success('Account created successfully!');
          resetForm();
          setIsAuthModalOpen(false);
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError('');
  };

  const switchMode = () => {
    resetForm();
    setAuthMode(authMode === 'login' ? 'signup' : 'login');
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-primary/40 z-50 animate-fade-in"
        onClick={() => setIsAuthModalOpen(false)}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-background w-full max-w-md p-8 shadow-2xl animate-scale-in">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-2xl font-semibold">
              {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="p-2 hover:text-gold transition-colors"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {authMode === 'signup' && (
              <div>
                <label htmlFor="name" className="block text-xs tracking-wider mb-2">
                  FULL NAME
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-elegant"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs tracking-wider mb-2">
                EMAIL ADDRESS
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-elegant"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs tracking-wider mb-2">
                PASSWORD
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-elegant pr-10"
                  placeholder="Enter your password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary disabled:opacity-50"
            >
              {isLoading
                ? 'PLEASE WAIT...'
                : authMode === 'login'
                ? 'SIGN IN'
                : 'CREATE ACCOUNT'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              {authMode === 'login'
                ? "Don't have an account?"
                : 'Already have an account?'}
              <button
                onClick={switchMode}
                className="ml-2 text-foreground font-medium hover:text-gold transition-colors"
              >
                {authMode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          {authMode === 'login' && (
            <div className="mt-4 text-center">
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Forgot your password?
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AuthModal;