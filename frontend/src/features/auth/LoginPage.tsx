import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { AlertCircle, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';

const CAROUSEL_SLIDES = [
  {
    src: '/login-hero.jpg',
    alt: 'Engineering & Hardware Laboratory',
    tag: 'Hardware & Engineering',
    title: 'Work From Home Attendance',
  },
  {
    src: '/login-hero-2.jpg',
    alt: 'Technology & Cross-Functional Team',
    tag: 'Collaboration & Development',
    title: 'Kolaborasi Terintegrasi',
  },
  {
    src: '/login-hero-3.jpg',
    alt: 'Dexa Group Enterprise Workplace',
    tag: 'Dexa Corporate Facility',
    title: 'Sistem Terstandar Audit',
  },
];

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-slide every 4.5 seconds (paused on hover)
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [isPaused]);

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length);
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (!email.trim() || !password) {
      setError('Harap isi alamat email/username dan password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const user = await login(email, password);
      if (user.role === 'HR_ADMIN') {
        navigate('/admin/employees');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        'Gagal masuk. Periksa kembali email dan password Anda.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setError(null);
    setInfoMessage(null);
  };

  const handleActionNotice = (feature: string) => {
    setInfoMessage(`${feature}: Silakan hubungi HR Administrator untuk bantuan akses akun.`);
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Main Split Card */}
      <div className="max-w-[1000px] w-full bg-white rounded-[32px] p-6 sm:p-8 lg:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        
        {/* Left Column: Login Form */}
        <div className="lg:col-span-7 flex flex-col justify-center px-1 sm:px-4">
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              Welcome Back!
            </h1>
            <p className="text-sm text-slate-400 mt-1.5 font-normal">
              Sign in with your Username and Password.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-2.5 text-rose-800 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-start space-x-2.5 text-blue-800 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Username / Email Field */}
            <div>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Username"
                autoComplete="email"
                required
                className="w-full px-5 py-3 rounded-full border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-colors"
              />
            </div>

            {/* Password Field with Eye Toggle */}
            <div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  required
                  className="w-full px-5 py-3 pr-12 rounded-full border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Forget Password */}
              <div className="text-right mt-1.5">
                <button
                  type="button"
                  onClick={() => handleActionNotice('Lupa Password')}
                  className="text-xs font-semibold text-slate-800 hover:text-slate-950 transition-colors cursor-pointer"
                >
                  Forget Password?
                </button>
              </div>
            </div>

            {/* Main Login Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-6 bg-[#111827] hover:bg-[#1f2937] disabled:bg-slate-400 text-white text-sm font-semibold rounded-full shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </button>
          </form>

          {/* "or login with" Divider */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-xs text-slate-400 whitespace-nowrap">
              or login with
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          {/* Social / SSO Buttons */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleActionNotice('Login with Google')}
              className="w-full py-2.5 px-4 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center justify-center space-x-2.5 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Login with Google</span>
            </button>

            <button
              type="button"
              onClick={() => handleActionNotice('Login with Facebook')}
              className="w-full py-2.5 px-4 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center justify-center space-x-2.5 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 fill-[#1877F2] shrink-0" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Login with Facebook</span>
            </button>
          </div>

          {/* Register Prompt */}
          <p className="text-center text-xs text-slate-500 mt-4">
            Did not have any account?{' '}
            <button
              type="button"
              onClick={() => handleActionNotice('Registrasi Akun')}
              className="font-bold text-slate-900 hover:underline cursor-pointer"
            >
              Register Now
            </button>
          </p>

          {/* Demo Accounts Quick-Fill (Matching Mockup Footer) */}
          <div className="mt-5 pt-3.5 border-t border-slate-100 text-center">
            <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase block mb-2">
              DEMO ACCOUNTS
            </span>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill('hr@dexa.com')}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded text-[11px] font-medium text-slate-600 transition-colors cursor-pointer"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('hr@dexa.com')}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded text-[11px] font-medium text-slate-600 transition-colors cursor-pointer"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('employee@dexa.com')}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded text-[11px] font-medium text-slate-600 transition-colors cursor-pointer"
              >
                Finance
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('employee@dexa.com')}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded text-[11px] font-medium text-slate-600 transition-colors cursor-pointer"
              >
                Guru
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('siti@dexa.com')}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded text-[11px] font-medium text-slate-600 transition-colors cursor-pointer"
              >
                Murid
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Visual Carousel (Interactive & Auto-Sliding) */}
        <div 
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="hidden lg:block lg:col-span-5 h-[560px] w-full rounded-[24px] overflow-hidden relative shadow-sm bg-slate-900 group select-none"
        >
          {/* Sliding Track */}
          <div
            className="flex h-full w-full transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {CAROUSEL_SLIDES.map((slide, idx) => (
              <div key={idx} className="w-full h-full shrink-0 relative">
                <img
                  src={slide.src}
                  alt={slide.alt}
                  className="w-full h-full object-cover object-center pointer-events-none"
                />
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent pointer-events-none" />

                {/* Caption / Tag */}
                <div className="absolute bottom-12 left-6 right-6 text-white pointer-events-none">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/20 backdrop-blur-md mb-1.5 shadow-2xs">
                    {slide.tag}
                  </span>
                  <h4 className="text-sm font-semibold text-white drop-shadow-sm">
                    {slide.title}
                  </h4>
                  <p className="text-xs text-slate-300 drop-shadow-sm">
                    {slide.alt}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Manual Arrow Controls (Appear on Hover) */}
          <button
            type="button"
            onClick={handlePrevSlide}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/40 hover:bg-slate-950/70 text-white backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20 shadow-xs"
            aria-label="Slide sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextSlide}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/40 hover:bg-slate-950/70 text-white backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20 shadow-xs"
            aria-label="Slide berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Carousel Pagination Dots (Manual Selection) */}
          <div className="absolute bottom-5 inset-x-0 flex justify-center items-center space-x-1.5 z-20">
            {CAROUSEL_SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Pilih slide ${idx + 1}`}
                className={`transition-all duration-300 cursor-pointer ${
                  currentSlide === idx
                    ? 'w-6 h-1.5 bg-white rounded-full shadow-xs'
                    : 'w-1.5 h-1.5 bg-white/60 hover:bg-white/90 rounded-full shadow-xs'
                }`}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
