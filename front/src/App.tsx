import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { motion } from 'motion/react';
import { Shield, BookOpen, PlayCircle, Target, MapPin, Phone, Mail, ChevronRight, User as UserIcon, QrCode, ArrowLeft, Star } from 'lucide-react';
import { Screen, User } from './types';
import { mockUser } from './data';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './screens/HomeScreen';
import { MockTestScreen } from './screens/MockTestScreen';
import { VideosScreen } from './screens/VideosScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { PerformanceScreen } from './screens/PerformanceScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { LoginScreen } from './screens/LoginScreen';
import { ContactScreen } from './screens/ContactScreen';
import { PracticeScreen } from './screens/PracticeScreen';
import { TestSeriesScreen } from './screens/TestSeriesScreen';
import { AboutScreen } from './screens/AboutScreen';
import { TermsScreen } from './screens/TermsScreen';

function MobileApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = () => {
    setUser(mockUser);
    setCurrentScreen('home');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('login');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login': return <LoginScreen onLogin={handleLogin} />;
      case 'home': return <HomeScreen onNavigate={setCurrentScreen} user={user!} />;
      case 'mock': return <MockTestScreen onNavigate={setCurrentScreen} />;
      case 'practice': return <PracticeScreen onNavigate={setCurrentScreen} />;
      case 'videos': return <VideosScreen onNavigate={setCurrentScreen} />;
      case 'testSeries': return <TestSeriesScreen onNavigate={setCurrentScreen} />;
      case 'profile': return <ProfileScreen onNavigate={setCurrentScreen} onLogout={handleLogout} user={user!} />;
      case 'performance': return <PerformanceScreen onNavigate={setCurrentScreen} />;
      case 'settings': return <SettingsScreen onNavigate={setCurrentScreen} user={user!} />;
      case 'contact': return <ContactScreen onNavigate={setCurrentScreen} />;
      case 'about': return <AboutScreen onNavigate={setCurrentScreen} />;
      case 'terms': return <TermsScreen onNavigate={setCurrentScreen} />;
      default: return <HomeScreen onNavigate={setCurrentScreen} user={user!} />;
    }
  };

  const showBottomNav = user && !['login', 'performance', 'settings', 'contact', 'about', 'terms'].includes(currentScreen);

  return (
    <div className="w-[320px] h-[650px] lg:w-[360px] lg:h-[720px] bg-white rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col border-[8px] border-slate-900 shrink-0">
      {/* Notch */}
      <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50 pointer-events-none">
        <div className="w-32 h-6 bg-slate-900 rounded-b-3xl"></div>
      </div>
      
      {/* Status Bar Mockup */}
      <div className="h-6 w-full absolute top-0 flex justify-between items-center px-6 z-40 pointer-events-none">
        <span className="text-[10px] font-medium text-slate-800">9:41</span>
        <div className="flex gap-1.5 items-center">
          <svg className="w-3 h-3 text-slate-800" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
          <svg className="w-3 h-3 text-slate-800" fill="currentColor" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          <svg className="w-4 h-4 text-slate-800" fill="currentColor" viewBox="0 0 24 24"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/></svg>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-16 pt-0">
        {renderScreen()}
      </div>
      
      {showBottomNav && (
        <BottomNav currentScreen={currentScreen} onNavigate={setCurrentScreen} />
      )}
    </div>
  );
}

function ScrollToAnchor() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      setTimeout(() => {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}

function Navbar() {
  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md">E</div>
          <span className="text-2xl font-black text-indigo-900 tracking-tight">ExamRoot</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-slate-600 font-medium">
          <Link to="/#home" className="hover:text-indigo-600 transition-colors">Home</Link>
          <Link to="/#features" className="hover:text-indigo-600 transition-colors">Features</Link>
          <Link to="/#about" className="hover:text-indigo-600 transition-colors">About Us</Link>
          <Link to="/#faq" className="hover:text-indigo-600 transition-colors">FAQ</Link>
          <Link to="/#contact" className="hover:text-indigo-600 transition-colors">Contact</Link>
        </div>
        <div className="flex gap-3">
          <Link to="/#download" className="px-5 py-2 rounded-full bg-indigo-600 text-white font-semibold shadow-md hover:bg-indigo-700 transition-colors hidden sm:block">Download App</Link>
          <button className="md:hidden p-2 text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer id="contact" className="bg-slate-900 text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">E</div>
              <span className="text-2xl font-black tracking-tight">ExamRoot</span>
            </Link>
            <p className="text-slate-400 max-w-sm mb-6 leading-relaxed">
              Accelerating government exam preparation with data-driven results and AI assistance. Your success is our mission.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-indigo-600 transition-colors">
                <span className="font-bold">f</span>
              </a>
              <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-indigo-600 transition-colors">
                <span className="font-bold">x</span>
              </a>
              <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-indigo-600 transition-colors">
                <span className="font-bold">in</span>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Quick Links</h4>
            <ul className="space-y-4 text-slate-300">
              <li><Link to="/#about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/#features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link to="/#faq" className="hover:text-white transition-colors">FAQs</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/data-safety" className="hover:text-white transition-colors">Data Safety</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Contact Us</h4>
            <ul className="space-y-4 text-slate-300">
              <li className="flex items-start gap-3">
                <MapPin className="shrink-0 text-indigo-400 mt-1" size={20} />
                <span className="leading-relaxed">Patna, Bihar - 803212<br/>Corporate Office</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="shrink-0 text-indigo-400" size={20} />
                <span className="font-medium">+91 7004198258</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="shrink-0 text-indigo-400" size={20} />
                <a href="mailto:examrootofficial@gmail.com" className="hover:text-white transition-colors">examrootofficial@gmail.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} ExamRoot. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/data-safety" className="hover:text-white transition-colors">Data Safety</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function DataSafetyPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [activeAction, setActiveAction] = useState<'sendOtp' | 'review' | 'deleteOtp' | 'deletePassword' | null>(null);
  const [reviewData, setReviewData] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const apiBase = "http://localhost:5000/api";
  const hasEmail = email.trim().length > 0;
  const hasOtp = otp.trim().length > 0;
  const isIdle = activeAction === null;
  const canSendOtp = isIdle && hasEmail;
  const canUseOtpActions = isIdle && hasEmail && hasOtp && otpSent;
  const canDeleteWithPassword = isIdle && hasEmail && password.trim().length > 0;
  const sendingOtp = activeAction === 'sendOtp';
  const verifyingOtp = activeAction === 'review';
  const deletingOtp = activeAction === 'deleteOtp';
  const deletingPassword = activeAction === 'deletePassword';

  const handleSendOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setActiveAction('sendOtp');
    setMessage(null);
    setReviewData(null);

    try {
      const response = await fetch(`${apiBase}/auth/data-request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to send OTP');
      setOtpSent(true);
      setMessage({ type: 'success', text: data.message });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Unable to send OTP' });
    } finally {
      setActiveAction(null);
    }
  };

  const handleReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hasEmail || !hasOtp) {
      setMessage({ type: 'error', text: 'Please enter both email and OTP before reviewing data.' });
      return;
    }

    setActiveAction('review');
    setMessage(null);

    try {
      const response = await fetch(`${apiBase}/auth/data-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to review your data');
      setReviewData(data.data);
      setMessage({ type: 'success', text: data.message });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Unable to review your data' });
    } finally {
      setActiveAction(null);
    }
  };

  const handleDelete = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hasEmail || !hasOtp) {
      setMessage({ type: 'error', text: 'Please enter both email and OTP before deleting data.' });
      return;
    }

    setActiveAction('deleteOtp');
    setMessage(null);

    try {
      const response = await fetch(`${apiBase}/auth/data-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to delete your data');
      setReviewData(null);
      setOtp('');
      setOtpSent(false);
      setMessage({ type: 'success', text: data.message });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Unable to delete your data' });
    } finally {
      setActiveAction(null);
    }
  };

  const handleDirectDelete = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hasEmail || !password.trim()) {
      setMessage({ type: 'error', text: 'Please enter both email and password before deleting data.' });
      return;
    }

    setActiveAction('deletePassword');
    setMessage(null);

    try {
      const response = await fetch(`${apiBase}/auth/data-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to delete your data');
      setReviewData(null);
      setPassword('');
      setOtp('');
      setOtpSent(false);
      setMessage({ type: 'success', text: data.message });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Unable to delete your data' });
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 pt-32 pb-24 min-h-[80vh]">
      <Helmet>
        <title>Data Safety | ExamRoot</title>
        <meta name="description" content="Review or delete your personal data from ExamRoot using email and OTP or email and password." />
        <meta property="og:title" content="Data Safety | ExamRoot" />
        <meta property="og:description" content="Review or delete your personal data from ExamRoot using email and OTP or email and password." />
        <link rel="canonical" href="https://examroot.cc/data-safety" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-600">Data Control Center</p>
            <h1 className="mt-3 text-4xl font-extrabold text-slate-900 sm:text-5xl">Review or remove your personal data</h1>
          </div>
          <Link to="/" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
            <ArrowLeft size={18} /> Back to Home
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.85fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 sm:p-8">
            <div className="space-y-3 pb-6 border-b border-slate-200">
              <p className="text-slate-500">Secure account verification with email OTP or password confirmation.</p>
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">OTP flow</p>
                  <p className="text-sm text-slate-600">Send OTP to your email and review or delete data after verification.</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Password flow</p>
                  <p className="text-sm text-slate-600">Directly delete account data if your password is configured.</p>
                </div>
              </div>
            </div>

            {message && (
              <div className={`mt-6 rounded-3xl border px-5 py-4 text-sm ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                {message.text}
              </div>
            )}

            <div className="mt-6 grid gap-6">
              <form onSubmit={handleSendOtp} className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <p className="font-semibold text-slate-900">Step 1: Request OTP</p>
                <label className="text-sm font-medium text-slate-700">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  required
                />
                <button type="submit" disabled={!canSendOtp} className="w-full rounded-3xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70">
                  {sendingOtp ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>

              {otpSent && (
                <form onSubmit={handleReview} className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="font-semibold text-slate-900">Step 2: Verify OTP</p>
                  <label className="text-sm font-medium text-slate-700">Enter OTP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    placeholder="123456"
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    required
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button type="submit" disabled={!canUseOtpActions} className="rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70">
                      {verifyingOtp ? 'Verifying...' : 'Review my data'}
                    </button>
                    <button type="button" onClick={handleDelete} disabled={!canUseOtpActions} className="rounded-3xl border border-rose-200 bg-white px-5 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70">
                      {deletingOtp ? 'Deleting...' : 'Delete my data'}
                    </button>
                  </div>
                </form>
              )}

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="font-semibold text-slate-900">Password delete</p>
                <p className="mt-2 text-sm text-slate-600">If your account already has a password, you can delete it directly without waiting for OTP.</p>
                <form onSubmit={handleDirectDelete} className="mt-4 space-y-4">
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    required
                  />
                  <button type="submit" disabled={!canDeleteWithPassword} className="w-full rounded-3xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70">
                    {deletingPassword ? 'Deleting...' : 'Delete account data'}
                  </button>
                </form>
              </div>
            </div>

            {reviewData && (
              <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Your account summary</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl bg-white p-4 shadow-sm">
                    <p className="text-sm text-slate-500">Name</p>
                    <p className="mt-2 font-semibold text-slate-900">{reviewData.name}</p>
                  </div>
                  <div className="rounded-3xl bg-white p-4 shadow-sm">
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="mt-2 font-semibold text-slate-900">{reviewData.email}</p>
                  </div>
                  <div className="rounded-3xl bg-white p-4 shadow-sm">
                    <p className="text-sm text-slate-500">Password set</p>
                    <p className="mt-2 font-semibold text-slate-900">{reviewData.hasPassword ? 'Yes' : 'No'}</p>
                  </div>
                  <div className="rounded-3xl bg-white p-4 shadow-sm">
                    <p className="text-sm text-slate-500">Saved questions</p>
                    <p className="mt-2 font-semibold text-slate-900">{reviewData.savedQuestionCount}</p>
                  </div>
                  <div className="rounded-3xl bg-white p-4 shadow-sm">
                    <p className="text-sm text-slate-500">Tracked records</p>
                    <p className="mt-2 font-semibold text-slate-900">{reviewData.trackingCount}</p>
                  </div>
                  <div className="rounded-3xl bg-white p-4 shadow-sm">
                    <p className="text-sm text-slate-500">Transactions</p>
                    <p className="mt-2 font-semibold text-slate-900">{reviewData.transactionCount}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-6">
            <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-600 p-8 text-white shadow-2xl">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Privacy first</p>
              <h2 className="mt-4 text-3xl font-extrabold">Your data is controlled by you</h2>
              <p className="mt-4 text-sm leading-7 text-slate-200">We only process deletion requests after verifying your ownership via email OTP or password. This protects your account from accidental or unauthorized removal.</p>
            </div>
            <div className="grid gap-4 rounded-[2rem] bg-white border border-slate-200 p-6 shadow-sm">
              <div className="rounded-3xl bg-slate-50 p-6">
                <p className="text-sm font-semibold text-slate-900">What gets removed</p>
                <ul className="mt-4 space-y-3 text-slate-600 text-sm">
                  <li>Account details and credentials</li>
                  <li>Saved questions and progress</li>
                  <li>Activity and tracking logs</li>
                  <li>Transaction metadata</li>
                </ul>
              </div>
              <div className="rounded-3xl bg-slate-50 p-6">
                <p className="text-sm font-semibold text-slate-900">Need help?</p>
                <p className="mt-3 text-slate-600 text-sm">Contact our privacy team at <a href="mailto:privacy@examroot.cc" className="font-semibold text-indigo-700 underline">privacy@examroot.cc</a> for support.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 pt-32 pb-24 min-h-[80vh]">
      <Helmet>
        <title>Privacy Policy | ExamRoot</title>
        <meta name="description" content="Read the privacy policy of ExamRoot to understand how we collect, use, and protect your personal data while you prepare for government exams." />
        <meta property="og:title" content="Privacy Policy | ExamRoot" />
        <meta property="og:description" content="Read the privacy policy of ExamRoot to understand how we collect, use, and protect your personal data while you prepare for government exams." />
        <link rel="canonical" href="https://examroot.cc/privacy" />
      </Helmet>
      <Link to="/" className="inline-flex items-center gap-2 text-indigo-600 font-bold mb-8 hover:text-indigo-700 transition-colors">
        <ArrowLeft size={20} /> Back to Home
      </Link>
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-100">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-6">Privacy Policy</h1>
        <div className="space-y-6 text-slate-600 leading-relaxed">
          <p><strong>Last Updated:</strong> July 2026</p>
          
          <p>Welcome to ExamRoot. Your privacy is critically important to us. This Privacy Policy outlines how we collect, use, process, and protect your personal information when you use our website, mobile application, and related services (collectively, the "Services"). By accessing or using ExamRoot, you agree to the collection and use of information in accordance with this policy.</p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">1. Information We Collect</h2>
          <p>We collect various types of information to provide and improve our Services to you:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Personal Information:</strong> When you register for an account, we may ask for your name, email address, phone number, date of birth, and educational background. If you purchase premium services, we collect billing details and transaction history.</li>
            <li><strong>Usage Data:</strong> We automatically collect data about how you interact with our platform. This includes your test scores, time spent on video lectures, subjects of interest, mock test performance, study streaks, and interaction with other students or faculty.</li>
            <li><strong>Device and Log Data:</strong> Like most online services, we collect information that your browser or device sends when you use our App. This may include your IP address, browser type, device type, operating system, unique device identifiers, and crash reports.</li>
            <li><strong>Cookies and Tracking Technologies:</strong> We use cookies, beacons, tags, and scripts to analyze trends, administer the website, track users' movements around the platform, and gather demographic information about our user base as a whole.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">2. How We Use Your Information</h2>
          <p>The information we collect is used in the following ways:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>To Provide and Maintain Services:</strong> Ensuring the app functions correctly, managing your account, and providing customer support.</li>
            <li><strong>Personalization:</strong> Using AI to analyze your test performance and learning patterns to recommend tailored study materials, video lectures, and practice quizzes.</li>
            <li><strong>Communication:</strong> Sending you important updates, newsletters, promotional materials, security alerts, and administrative messages. You can opt out of promotional emails at any time.</li>
            <li><strong>Analytics and Improvement:</strong> Understanding how users interact with ExamRoot to improve our UI/UX, develop new features, and optimize our educational content.</li>
            <li><strong>Security and Fraud Prevention:</strong> Monitoring for suspicious activities, enforcing our Terms of Service, and protecting the integrity of our platform.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">3. How We Share Your Information</h2>
          <p>We do not sell your personal data. However, we may share your information in specific circumstances:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>With Service Providers:</strong> We employ third-party companies and individuals to facilitate our Services (e.g., cloud hosting, payment processing, analytics). They have access to your data only to perform these tasks on our behalf and are obligated not to disclose or use it for other purposes.</li>
            <li><strong>For Legal Reasons:</strong> We will disclose your information where required to do so by law, in response to a valid request by a public authority, or to protect the rights, property, or safety of ExamRoot, our users, or the public.</li>
            <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or asset sale, your personal information may be transferred as part of that transaction. We will provide notice before your personal data is transferred and becomes subject to a different Privacy Policy.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">4. Data Security and Retention</h2>
          <p>The security of your data is important to us. We implement industry-standard encryption, firewalls, and secure socket layer (SSL) technology to protect your personal information. However, remember that no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.</p>
          <p>We retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your information to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our legal agreements and policies.</p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">5. Your Rights and Choices</h2>
          <p>Depending on your location, you may have certain rights regarding your personal data:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Access and Update:</strong> You can review and edit your profile information at any time through your account settings.</li>
            <li><strong>Data Deletion:</strong> You can request the deletion of your account and associated personal data by contacting our support team. Please note that we may retain certain information as required by law or for legitimate business purposes.</li>
            <li><strong>Opt-Out:</strong> You can opt out of receiving promotional communications from us by following the unsubscribe instructions provided in those emails.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">6. Children's Privacy</h2>
          <p>Our Services are not intended for use by children under the age of 13. We do not knowingly collect personally identifiable information from children under 13. If we discover that a child under 13 has provided us with personal data, we will immediately delete this information from our servers. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us.</p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">7. Changes to This Privacy Policy</h2>
          <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">8. Contact Us</h2>
          <p>If you have any questions, concerns, or requests regarding this Privacy Policy, please contact our Data Protection Officer at:</p>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mt-4">
            <p className="font-medium text-slate-900">ExamRoot Privacy Team</p>
            <p>Email: privacy@examroot.cc</p>
            <p>Address: Patna, Bihar - 803212, India</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 pt-32 pb-24 min-h-[80vh]">
      <Helmet>
        <title>Terms of Service | ExamRoot</title>
        <meta name="description" content="Review the Terms of Service for using the ExamRoot platform, including subscription details, user responsibilities, and payment policies." />
        <meta property="og:title" content="Terms of Service | ExamRoot" />
        <meta property="og:description" content="Review the Terms of Service for using the ExamRoot platform, including subscription details, user responsibilities, and payment policies." />
        <link rel="canonical" href="https://examroot.cc/terms" />
      </Helmet>
      <Link to="/" className="inline-flex items-center gap-2 text-indigo-600 font-bold mb-8 hover:text-indigo-700 transition-colors">
        <ArrowLeft size={20} /> Back to Home
      </Link>
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-100">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-6">Terms of Service</h1>
        <div className="space-y-6 text-slate-600 leading-relaxed">
          <p><strong>Last Updated:</strong> July 2026</p>
          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>By accessing or using the ExamRoot application, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access our service.</p>
          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">2. Subscriptions & Payments</h2>
          <p>Certain features, mock tests, and video lectures are provided as premium paid content. All payments made are final and non-refundable unless otherwise required by law.</p>
          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">3. User Responsibilities</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials. You agree not to share your account or distribute premium content from ExamRoot without authorization.</p>
        </div>
      </div>
    </div>
  );
}

function HomePage() {
  return (
    <>
      <Helmet>
        <title>ExamRoot | Best App for Government Exam Preparation</title>
        <meta name="description" content="Master your SSC, Banking, and Railway exams with ExamRoot. Access premium study materials, daily mock tests, video lectures, and AI-driven performance tracking." />
        <meta name="keywords" content="Government exams, SSC preparation, Bank PO, Railway NTPC, mock tests, online classes, study materials, exam preparation app" />
        <meta property="og:title" content="ExamRoot | Best App for Government Exam Preparation" />
        <meta property="og:description" content="Master your SSC, Banking, and Railway exams with ExamRoot. Access premium study materials, daily mock tests, video lectures, and AI-driven performance tracking." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://examroot.cc/" />
        <link rel="canonical" href="https://examroot.cc/" />
      </Helmet>
      {/* Hero Section */}
      <section id="home" className="pt-28 pb-16 lg:pt-36 lg:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        <div className="flex-1 space-y-8 text-center lg:text-left z-10">
          <div className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold uppercase tracking-wider">
            #1 Learning App for Govt Exams
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
            Master Every <br className="hidden lg:block"/>
            <span className="text-indigo-600">Govt Exam</span> With Confidence.
          </h1>
          <p className="text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0">
            Your all-in-one destination for SSC, Banking, and Railway exams. Access premium notes, test series, and personalized AI-driven progress tracking.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-indigo-600 text-white font-bold text-lg shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
              Explore Features <ChevronRight size={20} />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-slate-700 border border-slate-200 font-bold text-lg shadow-sm hover:bg-slate-50 transition-colors">
              View Courses
            </button>
          </div>
          <div className="flex items-center justify-center lg:justify-start gap-4 pt-4">
            <div className="flex -space-x-3">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop" className="w-10 h-10 rounded-full border-2 border-white object-cover" alt="User" />
              <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=100&auto=format&fit=crop" className="w-10 h-10 rounded-full border-2 border-white object-cover" alt="User" />
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop" className="w-10 h-10 rounded-full border-2 border-white object-cover" alt="User" />
              <div className="w-10 h-10 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-[10px] text-indigo-700 font-bold">10k+</div>
            </div>
            <div className="text-sm text-slate-600 leading-tight">
              <span className="font-bold text-slate-900">Over 10,000+ students</span><br/>preparing daily
            </div>
          </div>
          
          <div id="download" className="pt-6 hidden sm:block">
            <div className="inline-flex items-center gap-6 bg-white p-4 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
              <div className="w-20 h-20 bg-indigo-50 rounded-2xl p-3 shrink-0 flex items-center justify-center text-indigo-600">
                <QrCode size={48} />
              </div>
              <div className="text-left pr-4">
                <div className="font-bold text-slate-900 text-lg mb-1">Download ExamRoot App</div>
                <div className="text-sm text-slate-500 mb-3">Scan this QR code with your phone camera</div>
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold tracking-wider uppercase bg-slate-900 text-white px-3 py-1.5 rounded-lg flex items-center gap-1">iOS App</span>
                  <span className="text-[10px] font-bold tracking-wider uppercase bg-slate-900 text-white px-3 py-1.5 rounded-lg flex items-center gap-1">Android</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex justify-center lg:justify-end w-full relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100 to-purple-50 rounded-full blur-3xl opacity-70 -z-10 transform scale-110"></div>
          {/* Interactive Mobile Mockup */}
          <MobileApp />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Everything you need to crack the exam</h2>
            <p className="text-lg text-slate-600">Comprehensive study materials, rigorous practice tests, and detailed analytics to keep you on track.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-xl transition-shadow group">
              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <BookOpen size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Premium Notes</h3>
              <p className="text-slate-600 leading-relaxed">Access high-quality, exam-oriented study material curated by top educators.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-xl transition-shadow group">
              <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                <Shield size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Mock Tests</h3>
              <p className="text-slate-600 leading-relaxed">Full-length tests and previous year papers with detailed solutions.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-xl transition-shadow group">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-500 group-hover:text-white transition-colors">
                <PlayCircle size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Video Lectures</h3>
              <p className="text-slate-600 leading-relaxed">Learn complex concepts easily through interactive video classes.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.4 }} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-xl transition-shadow group">
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                <Target size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Performance</h3>
              <p className="text-slate-600 leading-relaxed">Track your daily progress, accuracy, and streak with smart analytics.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Trusted by top achievers</h2>
            <p className="text-lg text-slate-600">See what our successful students have to say about ExamRoot.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
              <div className="flex items-center gap-1 text-yellow-400 mb-6">
                <Star size={20} fill="currentColor" />
                <Star size={20} fill="currentColor" />
                <Star size={20} fill="currentColor" />
                <Star size={20} fill="currentColor" />
                <Star size={20} fill="currentColor" />
              </div>
              <p className="text-slate-700 leading-relaxed mb-8">"ExamRoot's mock tests are exactly like the real exam. The detailed performance analytics helped me identify my weak spots and improve my score significantly!"</p>
              <div className="flex items-center gap-4">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop" className="w-12 h-12 rounded-full object-cover" alt="Priya Singh" />
                <div>
                  <div className="font-bold text-slate-900">Priya Singh</div>
                  <div className="text-sm text-slate-500">SSC CGL Qualifier</div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }} className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
              <div className="flex items-center gap-1 text-yellow-400 mb-6">
                <Star size={20} fill="currentColor" />
                <Star size={20} fill="currentColor" />
                <Star size={20} fill="currentColor" />
                <Star size={20} fill="currentColor" />
                <Star size={20} fill="currentColor" />
              </div>
              <p className="text-slate-700 leading-relaxed mb-8">"The video lectures are so easy to understand, and the faculty is amazing. The daily quizzes keep me on track with my preparation."</p>
              <div className="flex items-center gap-4">
                <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=100&auto=format&fit=crop" className="w-12 h-12 rounded-full object-cover" alt="Rahul Verma" />
                <div>
                  <div className="font-bold text-slate-900">Rahul Verma</div>
                  <div className="text-sm text-slate-500">SBI PO</div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }} className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
              <div className="flex items-center gap-1 text-yellow-400 mb-6">
                <Star size={20} fill="currentColor" />
                <Star size={20} fill="currentColor" />
                <Star size={20} fill="currentColor" />
                <Star size={20} fill="currentColor" />
                <Star size={20} fill="currentColor" />
              </div>
              <p className="text-slate-700 leading-relaxed mb-8">"I love the structured approach of the test series. It gave me the confidence I needed to crack the Railway NTPC exam on my first try."</p>
              <div className="flex items-center gap-4">
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop" className="w-12 h-12 rounded-full object-cover" alt="Anjali Sharma" />
                <div>
                  <div className="font-bold text-slate-900">Anjali Sharma</div>
                  <div className="text-sm text-slate-500">RRB NTPC</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="flex-1 order-2 lg:order-1 relative">
               <div className="absolute inset-0 bg-indigo-200 rounded-3xl transform -rotate-3 scale-105"></div>
               <img 
                 src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000&auto=format&fit=crop" 
                 alt="Students learning together" 
                 className="relative z-10 rounded-3xl shadow-2xl object-cover h-[400px] w-full"
               />
               <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-xl z-20 border border-slate-100">
                 <div className="text-4xl font-black text-indigo-600 mb-1">98%</div>
                 <div className="text-sm font-bold text-slate-600 uppercase tracking-wider">Success Rate</div>
               </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }} className="flex-1 order-1 lg:order-2 space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">Empowering Students Across India</h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                ExamRoot was founded with a single mission: to make high-quality education accessible to every aspiring student. We believe that with the right guidance, anyone can crack their dream government job.
              </p>
              <ul className="space-y-4 pt-4">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <span className="text-slate-700 font-medium">Expert Faculty with years of experience</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <span className="text-slate-700 font-medium">Latest Exam Patterns & Syllabus</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <span className="text-slate-700 font-medium">Doubt Solving & Community Support</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-slate-600">Got questions? We've got answers.</p>
          </div>
          <div className="space-y-4">
            <div className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-3">How can I download the app?</h3>
              <p className="text-slate-600 leading-relaxed">You can scan the QR code in the hero section above with your smartphone camera, or click the "Download App" button to get the mobile app on your Android or iOS device directly from the respective app stores.</p>
            </div>
            <div className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-3">Are the mock tests free?</h3>
              <p className="text-slate-600 leading-relaxed">We offer both free and premium mock tests. You can start with our extensive library of free tests and daily quizzes, and optionally upgrade to a premium test series for advanced, full-length preparation.</p>
            </div>
            <div className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-3">Can I access video lectures offline?</h3>
              <p className="text-slate-600 leading-relaxed">Currently, watching video lectures requires an active internet connection. We are actively developing an offline download feature that will be available in a future update.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden selection:bg-indigo-100">
          <Helmet>
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta name="theme-color" content="#4f46e5" />
            <meta property="og:site_name" content="ExamRoot" />
            <meta name="twitter:card" content="summary_large_image" />
          </Helmet>
          <ScrollToAnchor />
          <Navbar />
          
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/data-safety" element={<DataSafetyPage />} />
            <Route path="/terms" element={<TermsPage />} />
          </Routes>
          
          <Footer />
        </div>
      </BrowserRouter>
    </HelmetProvider>
  );
}