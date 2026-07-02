"use client";

import { useState } from "react";
import { 
  User, FileText, BookOpen, PlayCircle, Clock, 
  HelpCircle, X, Book, Home, Layers, Star, 
  Target, Video, TrendingUp, Zap, Mail, Phone, MapPin 
} from "lucide-react";

// --- Phone Preview UI Component ---
function PhonePreview() {
  const [activeAppId, setActiveAppId] = useState("home");

  const screens = [
    { id: "home", title: "Dashboard" },
    { id: "practice", title: "Practice" },
    { id: "test", title: "Mock Test" },
    { id: "series", title: "Series" },
  ];

  return (
    <div className="flex-1 w-full flex flex-col justify-center items-center z-10 overflow-visible">
      {/* Buttons to switch phone screens */}
      <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-8">
        {screens.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveAppId(s.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
              s.id === activeAppId
                ? "bg-slate-900 text-white shadow-lg"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* Phone Mockup Frame */}
      <div className="perspective-wrapper relative w-[280px] h-[580px] sm:w-[300px] sm:h-[620px] lg:w-[320px] lg:h-[660px] bg-white rounded-[3rem] border-[10px] border-slate-900 shadow-2xl shadow-slate-900/40">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] h-[24px] bg-slate-900 rounded-b-2xl z-50"></div>
        <div className="w-full h-full rounded-[2.2rem] overflow-hidden bg-white relative hide-scrollbar">
          
          {/* HOME SCREEN */}
          <div className={`absolute inset-0 bg-slate-50 flex flex-col transition-all duration-400 ${activeAppId === "home" ? "opacity-100 scale-100 z-10" : "opacity-0 scale-95 pointer-events-none z-0"}`}>
            <div className="bg-amber-500 pt-10 pb-10 px-5 rounded-b-3xl shrink-0">
              <div className="flex justify-between items-center text-white mb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-white text-slate-900 font-bold text-xs px-1.5 py-0.5 rounded">ER</div>
                  <span className="font-bold text-lg">ExamRoot</span>
                </div>
                <div className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center">
                  <User size={16} />
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar -mt-6 px-4 pb-20">
              <div className="bg-white rounded-2xl shadow-sm p-4 flex justify-between border border-slate-100 mb-6">
                <div className="text-center"><p className="text-[10px] font-bold text-slate-400 tracking-wide mb-1">TESTS</p><p className="text-2xl font-extrabold text-amber-600">0</p></div>
                <div className="w-px bg-slate-100"></div>
                <div className="text-center"><p className="text-[10px] font-bold text-slate-400 tracking-wide mb-1">ACCURACY</p><p className="text-2xl font-extrabold text-green-500">0%</p></div>
                <div className="w-px bg-slate-100"></div>
                <div className="text-center"><p className="text-[10px] font-bold text-slate-400 tracking-wide mb-1">STREAK</p><p className="text-2xl font-extrabold text-amber-600">0🔥</p></div>
              </div>
              <h3 className="font-bold text-slate-800 mb-3 text-sm">Explore Categories</h3>
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="flex flex-col items-center gap-1.5"><div className="w-10 h-10 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-center"><FileText size={20} className="text-amber-500" /></div><span className="text-[10px] font-medium text-slate-600">Mocks</span></div>
                <div className="flex flex-col items-center gap-1.5"><div className="w-10 h-10 bg-green-50 rounded-2xl border border-green-100 flex items-center justify-center"><BookOpen size={20} className="text-green-500" /></div><span className="text-[10px] font-medium text-slate-600">Practice</span></div>
                <div className="flex flex-col items-center gap-1.5"><div className="w-10 h-10 bg-orange-50 rounded-2xl border border-orange-100 flex items-center justify-center"><PlayCircle size={20} className="text-orange-500" /></div><span className="text-[10px] font-medium text-slate-600">Videos</span></div>
                <div className="flex flex-col items-center gap-1.5"><div className="w-10 h-10 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-center"><Clock size={20} className="text-purple-500" /></div><span className="text-[10px] font-medium text-slate-600">PYQs</span></div>
              </div>
            </div>
          </div>

          {/* PRACTICE SCREEN */}
          <div className={`absolute inset-0 bg-slate-50 flex flex-col transition-all duration-400 ${activeAppId === "practice" ? "opacity-100 scale-100 z-10" : "opacity-0 scale-95 pointer-events-none z-0"}`}>
             <div className="bg-amber-500 pt-10 pb-4 px-5 shrink-0 flex justify-between items-center text-white"><span className="font-bold text-lg">Subject Practice</span><User size={20} /></div>
             <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-3 pb-20">
                 <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm"><div className="flex justify-between items-start mb-1"><h4 className="font-bold text-slate-800 text-sm">Percentage Basics</h4><span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-md">Easy</span></div><p className="text-[11px] text-slate-500 mb-3">Mathematics • Percentage</p><div className="flex justify-between items-center pt-3 border-t border-slate-50"><span className="text-[11px] font-medium text-slate-500 flex items-center gap-1"><HelpCircle size={12} /> 4 Qs</span><button className="bg-amber-600 text-white text-[11px] font-bold px-4 py-1.5 rounded-lg">Practice</button></div></div>
                 <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm"><div className="flex justify-between items-start mb-1"><h4 className="font-bold text-slate-800 text-sm">Profit and Loss</h4><span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-md">Medium</span></div><p className="text-[11px] text-slate-500 mb-3">Mathematics • Profit & Loss</p><div className="flex justify-between items-center pt-3 border-t border-slate-50"><span className="text-[11px] font-medium text-slate-500 flex items-center gap-1"><HelpCircle size={12} /> 4 Qs</span><button className="bg-amber-600 text-white text-[11px] font-bold px-4 py-1.5 rounded-lg">Practice</button></div></div>
             </div>
          </div>

          {/* MOCK TEST SCREEN */}
          <div className={`absolute inset-0 bg-white flex flex-col transition-all duration-400 ${activeAppId === "test" ? "opacity-100 scale-100 z-10" : "opacity-0 scale-95 pointer-events-none z-0"}`}>
              <div className="pt-10 pb-3 px-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                  <div className="flex items-center gap-2"><X size={20} className="text-slate-600" /><span className="font-bold text-sm text-slate-800 truncate w-24">SSC CGL Tier 1...</span></div>
                  <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><Clock size={12} /> 01:00:00</div>
              </div>
              <div className="flex-1 overflow-y-auto hide-scrollbar p-4 flex flex-col">
                  <div className="flex gap-2 mb-4"><span className="border border-green-200 text-green-600 bg-green-50 text-[10px] font-bold px-2 py-0.5 rounded">+1.00</span><span className="border border-red-200 text-red-600 bg-red-50 text-[10px] font-bold px-2 py-0.5 rounded">-0.25</span></div>
                  <h3 className="font-bold text-slate-800 text-lg mb-6">What is 15% of 200?</h3>
                  <div className="space-y-3">
                      <div className="border border-slate-200 rounded-xl p-3 flex items-center gap-3"><div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">A</div><span className="text-sm font-medium text-slate-800">20</span></div>
                      <div className="border border-slate-200 rounded-xl p-3 flex items-center gap-3"><div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">B</div><span className="text-sm font-medium text-slate-800">25</span></div>
                      <div className="border border-slate-200 rounded-xl p-3 flex items-center gap-3"><div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">C</div><span className="text-sm font-medium text-slate-800">30</span></div>
                  </div>
              </div>
              <div className="p-3 border-t border-slate-100 bg-white flex justify-between gap-2 shrink-0">
                  <button className="border border-slate-200 text-slate-600 text-xs font-bold px-4 py-2.5 rounded-lg flex-1">Clear</button>
                  <button className="bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex-[2]">Save & Next</button>
              </div>
          </div>

          {/* SERIES SCREEN */}
          <div className={`absolute inset-0 bg-slate-50 flex flex-col transition-all duration-400 ${activeAppId === "series" ? "opacity-100 scale-100 z-10" : "opacity-0 scale-95 pointer-events-none z-0"}`}>
              <div className="bg-amber-500 pt-10 pb-4 px-5 shrink-0 flex justify-between items-center text-white"><span className="font-bold text-lg">Book Test Series</span></div>
              <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4 pb-20">
                  <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                      <div className="flex gap-3 mb-3"><div className="w-10 h-10 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-center shrink-0"><Book size={20} className="text-purple-500" /></div><div className="flex-1"><h4 className="font-bold text-slate-800 text-sm">SSC Maths Book</h4><p className="text-[10px] text-slate-500 mt-1">📖 Practice Book</p></div></div>
                      <div className="flex justify-between items-center pt-3 border-t border-slate-50"><div><span className="font-extrabold text-slate-800">₹199</span></div><button className="bg-purple-50 text-purple-600 text-[11px] font-bold px-4 py-1.5 rounded-lg">View</button></div>
                  </div>
              </div>
          </div>

          {/* BOTTOM NAVIGATION BAR */}
          <div className={`absolute bottom-0 w-full bg-white border-t border-slate-100 flex justify-between px-6 py-3 pb-6 z-50 transition-transform duration-300 ${activeAppId === 'test' ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
            <div onClick={() => setActiveAppId('home')} className={`flex flex-col items-center gap-1 cursor-pointer ${activeAppId === 'home' ? 'text-amber-500' : 'text-slate-400'}`}><Home size={20} className={activeAppId === 'home' ? "fill-amber-50" : ""} /><span className="text-[9px] font-bold">Home</span></div>
            <div onClick={() => setActiveAppId('test')} className={`flex flex-col items-center gap-1 cursor-pointer ${activeAppId === 'test' ? 'text-amber-500' : 'text-slate-400'}`}><FileText size={20} /><span className="text-[9px] font-medium">Test</span></div>
            <div onClick={() => setActiveAppId('practice')} className={`flex flex-col items-center gap-1 cursor-pointer ${activeAppId === 'practice' ? 'text-amber-500' : 'text-slate-400'}`}><BookOpen size={20} /><span className="text-[9px] font-medium">Practice</span></div>
            <div onClick={() => setActiveAppId('series')} className={`flex flex-col items-center gap-1 cursor-pointer ${activeAppId === 'series' ? 'text-amber-500' : 'text-slate-400'}`}><Layers size={20} /><span className="text-[9px] font-medium">Series</span></div>
          </div>

        </div>
      </div>
    </div>
  );
}


// --- Main Page Component ---
export default function ExamRootSPA() {
  const [currentView, setCurrentView] = useState("landing"); // "landing" | "legal"
  const [legalTab, setLegalTab] = useState("about"); // "about" | "contact" | "privacy" | "terms" | "refund"

  // Function to handle smooth scrolling or view switching
  const navigateTo = (view, sectionId = "") => {
    if (view === "landing") {
      setCurrentView("landing");
      setTimeout(() => {
        if (sectionId) {
          document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }, 100);
    } else if (view === "legal") {
      setCurrentView("legal");
      if (sectionId) setLegalTab(sectionId);
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  };

  return (
    <main className="bg-slate-50 text-slate-900 overflow-x-hidden font-sans selection:bg-amber-200 min-h-screen">
      
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-[80vh] overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] bg-amber-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-[20%] right-[-5%] w-[30%] h-[40%] bg-blue-400/10 rounded-full blur-3xl"></div>
      </div>

      {/* --- Navbar --- */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center relative z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('landing')}>
          <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-xl tracking-tighter border-b-2 border-amber-500">ER</div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900">ExamRoot</span>
        </div>
        <div className="hidden md:flex gap-8 font-medium text-slate-600">
          <button onClick={() => navigateTo('landing', 'features')} className="hover:text-amber-600 transition-colors">Features</button>
          <button onClick={() => navigateTo('landing', 'reviews')} className="hover:text-amber-600 transition-colors">Reviews</button>
          <button onClick={() => navigateTo('legal', 'about')} className="hover:text-amber-600 transition-colors">About Us</button>
        </div>
        <button className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
          Download App
        </button>
      </nav>

      {/* --- Landing View --- */}
      {currentView === "landing" && (
        <div className="view-section animate-in fade-in duration-500">
          {/* Hero Section */}
          <section className="container mx-auto px-6 pt-8 pb-20 lg:pt-16 lg:pb-32 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1 space-y-8 text-center lg:text-left z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-amber-700 font-semibold text-sm border border-amber-200 shadow-sm">
                <Star size={16} className="fill-amber-500 text-amber-500" />
                <span>Interactive Live UI Preview</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight">
                Your Success, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">Our Mission.</span>
              </h1>
              <p className="text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                Experience the exact interface designed for serious aspirants. High-quality mock tests, chapter-wise practice, and detailed analytics all in one place.
              </p>
              <div className="pt-4">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Explore the App Interface</p>
                {/* Note: The phone buttons are rendered inside the PhonePreview component */}
              </div>
            </div>
            
            <PhonePreview />
          </section>

          {/* Features Section */}
          <section id="features" className="container mx-auto px-6 py-20 z-10 relative">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4">Crafted for Top Performers</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">Everything you need to analyze your weaknesses, improve your speed, and dominate your exams.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="md:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mb-6 border border-amber-200"><Target size={28} className="text-amber-600" /></div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Real Exam Interface Mocks</h3>
                <p className="text-slate-600 max-w-md">Get familiar with the actual TCS-style exam layout. Detailed post-test analytics, sectional timing, and All-India Rank prediction included.</p>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 border border-blue-200"><Video size={28} className="text-blue-600" /></div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Video Solutions</h3>
                <p className="text-slate-600">Complex problems broken down simply by top educators.</p>
              </div>
              <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl"></div>
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm"><BookOpen size={28} className="text-amber-400" /></div>
                <h3 className="text-xl font-bold text-white mb-3">Topic-Wise Practice</h3>
                <p className="text-slate-300">Master individual concepts with leveled practice sets.</p>
              </div>
              <div className="md:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Why Students Love Us</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                    <div className="bg-green-100 p-2 rounded-lg text-green-600"><TrendingUp size={20} /></div>
                    <div><p className="font-bold text-slate-800">Streak & Motivation System</p><p className="text-sm text-slate-500">Daily targets and streaks keep you consistent.</p></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><Zap size={20} /></div>
                    <div><p className="font-bold text-slate-800">Speed & Accuracy Tracker</p><p className="text-sm text-slate-500">Identify which sections take too much of your time.</p></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Reviews Section */}
          <section id="reviews" className="bg-slate-100 py-20 border-y border-slate-200 relative z-10">
            <div className="container mx-auto px-6 max-w-6xl">
              <div className="text-center mb-16">
                <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4">Hear From Our Achievers</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Review Card 1 */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative">
                  <div className="flex text-amber-500 mb-4">
                    {[1,2,3,4,5].map(i => <Star key={i} size={16} className="fill-current" />)}
                  </div>
                  <p className="text-slate-700 mb-6 italic">"The mock test UI is exactly like the real exam. It removed my exam phobia completely."</p>
                  <div className="flex items-center gap-3"><div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold">A</div><div><p className="font-bold text-sm">Amit Kumar</p><p className="text-xs text-slate-500">SSC CGL Selected</p></div></div>
                </div>
                {/* Review Card 2 */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative">
                  <div className="flex text-amber-500 mb-4">
                    {[1,2,3,4,5].map(i => <Star key={i} size={16} className="fill-current" />)}
                  </div>
                  <p className="text-slate-700 mb-6 italic">"The Chapter-wise practice feature is a game changer. Cleared my basic concepts."</p>
                  <div className="flex items-center gap-3"><div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold">P</div><div><p className="font-bold text-sm">Priya Singh</p><p className="text-xs text-slate-500">IBPS PO Aspirant</p></div></div>
                </div>
                {/* Review Card 3 */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative">
                  <div className="flex text-amber-500 mb-4">
                    {[1,2,3,4].map(i => <Star key={i} size={16} className="fill-current" />)}
                    <Star size={16} className="fill-current text-slate-300" />
                  </div>
                  <p className="text-slate-700 mb-6 italic">"Very clean app interface. No lag while giving full-length tests. Highly organized."</p>
                  <div className="flex items-center gap-3"><div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold">R</div><div><p className="font-bold text-sm">Rahul Verma</p><p className="text-xs text-slate-500">Railway NTPC</p></div></div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* --- Legal / Secondary View --- */}
      {currentView === "legal" && (
        <div className="pt-8 pb-20 z-10 relative animate-in fade-in duration-500">
          <div className="container mx-auto px-6 max-w-6xl flex flex-col md:flex-row gap-10">
            {/* Sidebar */}
            <aside className="w-full md:w-64 shrink-0">
              <div className="sticky top-24 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-3">Company</h3>
                <ul className="space-y-1 mb-6">
                  <li><button onClick={() => setLegalTab('about')} className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${legalTab === 'about' ? 'bg-amber-50 text-amber-600' : 'text-slate-600 hover:bg-slate-50'}`}>About Us</button></li>
                  <li><button onClick={() => setLegalTab('contact')} className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${legalTab === 'contact' ? 'bg-amber-50 text-amber-600' : 'text-slate-600 hover:bg-slate-50'}`}>Contact Us</button></li>
                </ul>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-3">Legal</h3>
                <ul className="space-y-1">
                  <li><button onClick={() => setLegalTab('privacy')} className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${legalTab === 'privacy' ? 'bg-amber-50 text-amber-600' : 'text-slate-600 hover:bg-slate-50'}`}>Privacy Policy</button></li>
                  <li><button onClick={() => setLegalTab('terms')} className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${legalTab === 'terms' ? 'bg-amber-50 text-amber-600' : 'text-slate-600 hover:bg-slate-50'}`}>Terms & Conditions</button></li>
                  <li><button onClick={() => setLegalTab('refund')} className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${legalTab === 'refund' ? 'bg-amber-50 text-amber-600' : 'text-slate-600 hover:bg-slate-50'}`}>Refund Policy</button></li>
                </ul>
              </div>
            </aside>

            {/* Content Area */}
            <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-8 lg:p-12 shadow-sm min-h-[600px]">
              
              {legalTab === 'about' && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                  <h1 className="text-3xl font-extrabold mb-6">About ExamRoot</h1>
                  <div className="text-slate-600 space-y-4 leading-relaxed">
                    <p>Welcome to <strong>ExamRoot</strong>, India's most trusted platform for Government Job Preparation.</p>
                    <h3 className="text-xl font-bold text-slate-800 mt-6">Why Choose Us?</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Real Exam Interface</strong> to eliminate exam-day anxiety.</li>
                      <li><strong>Deep Analytics</strong> to show your time taken per question and weak topics.</li>
                      <li><strong>Affordable Excellence</strong> for every student across India.</li>
                    </ul>
                  </div>
                </div>
              )}

              {legalTab === 'contact' && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                  <h1 className="text-3xl font-extrabold mb-6">Contact Us</h1>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <form className="space-y-4">
                      <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-amber-500" placeholder="Name" />
                      <input type="email" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-amber-500" placeholder="Email" />
                      <textarea rows={4} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-amber-500" placeholder="Message"></textarea>
                      <button type="button" className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold w-full hover:bg-slate-800 transition-colors">Send Message</button>
                    </form>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-6">
                      <div className="flex gap-4 items-start"><Mail className="text-amber-500 mt-1" size={20} /><div><h4 className="font-bold text-sm">Email Support</h4><p className="text-sm text-slate-500">support@examroot.com</p></div></div>
                      <div className="flex gap-4 items-start"><Phone className="text-amber-500 mt-1" size={20} /><div><h4 className="font-bold text-sm">Phone</h4><p className="text-sm text-slate-500">+91 98765 43210 <br />(Mon-Sat, 10 AM to 6 PM)</p></div></div>
                      <div className="flex gap-4 items-start"><MapPin className="text-amber-500 mt-1" size={20} /><div><h4 className="font-bold text-sm">Location</h4><p className="text-sm text-slate-500">Noida, UP, India 201309</p></div></div>
                    </div>
                  </div>
                </div>
              )}

              {legalTab === 'privacy' && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                  <h1 className="text-3xl font-extrabold mb-6">Privacy Policy</h1>
                  <div className="text-slate-600 space-y-4 leading-relaxed">
                    <p>At ExamRoot, your privacy is of utmost importance to us. This policy explains how we collect and protect your data.</p>
                    <h3 className="text-xl font-bold text-slate-800">1. Information We Collect</h3>
                    <p>We collect basic information like Name, email address, phone number, and derivative data like IP addresses when you use our app.</p>
                    <h3 className="text-xl font-bold text-slate-800">2. How We Use It</h3>
                    <p>We use this data strictly to personalize your test recommendations and generate accuracy analytics.</p>
                    <h3 className="text-xl font-bold text-slate-800">3. Data Security</h3>
                    <p>We adopt industry-standard security measures to protect against unauthorized access or disclosure of your information.</p>
                  </div>
                </div>
              )}

              {legalTab === 'terms' && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                  <h1 className="text-3xl font-extrabold mb-6">Terms & Conditions</h1>
                  <div className="text-slate-600 space-y-4 leading-relaxed">
                    <h3 className="text-xl font-bold text-slate-800">1. User Accounts</h3>
                    <p>Sharing your account credentials with multiple users is strictly prohibited and will result in permanent ban without refund.</p>
                    <h3 className="text-xl font-bold text-slate-800">2. Intellectual Property</h3>
                    <p>All test questions, UI designs, and video lectures are the exclusive property of ExamRoot. Unauthorized copying is illegal.</p>
                    <h3 className="text-xl font-bold text-slate-800">3. Fair Usage</h3>
                    <p>You agree not to use automated scripts or bots to scrape test questions from our platform.</p>
                  </div>
                </div>
              )}

              {legalTab === 'refund' && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                  <h1 className="text-3xl font-extrabold mb-6">Refund Policy</h1>
                  <div className="text-slate-600 space-y-4 leading-relaxed">
                    <div className="bg-amber-50 p-4 rounded-xl mb-4 border border-amber-100 text-amber-800 text-sm font-semibold">Please read carefully before purchasing.</div>
                    <p>Purchases of any digital product (Mock Test Series, Video classes) are generally <strong>non-refundable</strong> once activated.</p>
                    <h3 className="text-xl font-bold text-slate-800">Exceptions</h3>
                    <p>We will issue a 100% refund in the following rare scenarios:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Duplicate Payment:</strong> Money is deducted twice for the same transaction.</li>
                      <li><strong>Non-Activation:</strong> Payment was successful but course was not assigned within 48 hours.</li>
                    </ul>
                    <p>For refund requests, email <strong>support@examroot.com</strong> within 3 days.</p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* --- Footer --- */}
      <footer className="bg-white border-t border-slate-200 pt-16 pb-8 relative z-50">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4 cursor-pointer" onClick={() => navigateTo('landing')}>
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-sm">ER</div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900">ExamRoot</span>
              </div>
              <p className="text-sm text-slate-500 mb-6">Empowering students with top-tier mock tests and guided practice.</p>
            </div>
            <div className="hidden md:block"></div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Quick Links</h4>
              <ul className="space-y-3">
                <li><button onClick={() => navigateTo('landing')} className="text-sm text-slate-500 hover:text-amber-600">Home</button></li>
                <li><button onClick={() => navigateTo('landing', 'features')} className="text-sm text-slate-500 hover:text-amber-600">Features</button></li>
                <li><button onClick={() => navigateTo('legal', 'about')} className="text-sm text-slate-500 hover:text-amber-600">About Us</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Support & Legal</h4>
              <ul className="space-y-3">
                <li><button onClick={() => navigateTo('legal', 'contact')} className="text-sm text-slate-500 hover:text-amber-600">Contact Us</button></li>
                <li><button onClick={() => navigateTo('legal', 'privacy')} className="text-sm text-slate-500 hover:text-amber-600">Privacy Policy</button></li>
                <li><button onClick={() => navigateTo('legal', 'terms')} className="text-sm text-slate-500 hover:text-amber-600">Terms & Conditions</button></li>
                <li><button onClick={() => navigateTo('legal', 'refund')} className="text-sm text-slate-500 hover:text-amber-600">Refund Policy</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-8 flex justify-between items-center text-sm text-slate-400">
            <p>© 2026 ExamRoot. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}