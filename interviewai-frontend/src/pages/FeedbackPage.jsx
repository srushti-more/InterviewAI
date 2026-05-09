import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import logo from './assets/image_7.png'; 

export default function Feedback() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { analysisData } = location.state || {};
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/interviews', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        const pastOnly = data.filter(interview => interview._id !== analysisData?._id);
        setHistory(pastOnly);
      } catch (error) {
        console.error("Failed to load history:", error);
      } finally {
        setLoadingHistory(false);
      }
    };
    if (analysisData) fetchHistory();
  }, [analysisData]);

  if (!analysisData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-50 p-6 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-300 mb-6">No Analytics Data Found</h2>
        <button onClick={() => navigate('/dashboard')} className="bg-indigo-600 text-white px-8 py-3 rounded-xl hover:bg-indigo-500 font-semibold transition-colors">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const previousInterview = history.length > 0 ? history[0] : null; 
  const progressDifference = previousInterview ? (analysisData.score || 0) - (previousInterview.score || 0) : 0;

  const radius = 55; // Slightly smaller for mobile safety
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - ((analysisData.score || 0) / 100) * circumference;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans bg-slate-950 text-slate-50 selection:bg-indigo-500/30">
      
      {/* Mobile Top Header */}
      <div className="lg:hidden flex items-center justify-between bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <img src={logo} alt="Logo" className="w-6 h-6" />
          <span className="font-bold text-slate-50">InterviewPro</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-300 p-2 focus:outline-none">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}></path></svg>
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar Navigation */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:h-screen`}>
        <h1 className="hidden lg:flex text-xl font-bold text-slate-50 mb-10 items-center tracking-tight">
          <img src={logo} alt="InterviewAI Logo" className="w-8 h-8 mr-3 drop-shadow-md" />
          InterviewAI
        </h1>
        <nav className="flex-1 space-y-2 mt-4 lg:mt-0">
          <button onClick={() => navigate('/dashboard')} className="w-full flex items-center space-x-3 text-slate-400 hover:text-slate-50 hover:bg-slate-800/50 px-4 py-2.5 rounded-xl font-medium transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            <span>Dashboard</span>
          </button>
          <button className="w-full flex items-center space-x-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-4 py-2.5 rounded-xl font-medium transition-all shadow-[inset_0_0_12px_rgba(99,102,241,0.05)]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            <span>Analytics Report</span>
          </button>
        </nav>
      </div>

      {/* Main Analytics Content */}
      <div className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto w-full max-w-full">
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-800 pb-4 sm:pb-6 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-slate-50 tracking-tight">Performance Analytics</h2>
              <p className="text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base">Session logged on {new Date(analysisData.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <button onClick={() => navigate('/dashboard')} className="w-full sm:w-auto bg-slate-900 border border-slate-700 hover:border-indigo-500 text-slate-300 font-semibold py-2.5 px-6 rounded-xl transition-all shadow-md text-sm sm:text-base">
              Initialize New Session
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Score Ring */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 sm:p-8 flex flex-col items-center justify-center relative">
              <h3 className="text-xs sm:text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 sm:mb-6">Overall Rating</h3>
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
                <svg className="transform -rotate-90 w-full h-full drop-shadow-md" viewBox="0 0 130 130">
                  <circle cx="65" cy="65" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                  <circle 
                    cx="65" cy="65" r={radius} 
                    stroke="currentColor" strokeWidth="8" fill="transparent" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={strokeDashoffset} 
                    strokeLinecap="round"
                    className={`${analysisData.score >= 80 ? 'text-emerald-500' : analysisData.score >= 60 ? 'text-amber-500' : 'text-red-500'} transition-all duration-1000 ease-out`} 
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center mt-1">
                  <span className="text-4xl sm:text-5xl font-bold text-slate-50 tracking-tighter">{analysisData.score || 0}</span>
                </div>
              </div>
              
              {!loadingHistory && previousInterview && (
                <div className={`mt-5 sm:mt-6 flex items-center text-xs sm:text-sm font-semibold px-3 py-1 rounded-full border ${progressDifference >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                  {progressDifference >= 0 ? (
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                  )}
                  {Math.abs(progressDifference)} pts from previous
                </div>
              )}
            </div>

            {/* AI Summary */}
            <div className="lg:col-span-2 bg-slate-900 rounded-2xl shadow-xl border border-slate-800 flex flex-col overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>
              <div className="p-5 sm:p-6 border-b border-slate-800/50 bg-slate-900/50 flex items-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <h3 className="text-xs sm:text-sm font-semibold text-slate-300 uppercase tracking-wider">Executive Summary</h3>
              </div>
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-slate-300 leading-relaxed text-sm">
                  {analysisData.summary}
                </p>
                {analysisData.compliment && (
                  <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-xl p-3 sm:p-4 flex items-start mt-4">
                    <span className="text-lg sm:text-xl mr-2 sm:mr-3" role="img" aria-label="lightbulb">⚡</span>
                    <p className="text-cyan-200 font-medium text-xs sm:text-sm leading-relaxed">
                      {analysisData.compliment}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/50"></div>
              <h4 className="font-semibold text-slate-200 mb-4 sm:mb-5 flex items-center text-sm sm:text-base">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Core Strengths
              </h4>
              <ul className="space-y-3">
                {analysisData.strengths && analysisData.strengths.map((str, i) => (
                  <li key={i} className="text-xs sm:text-sm text-slate-400 flex items-start leading-relaxed">
                    <span className="mr-2 sm:mr-3 mt-1.5 text-emerald-400 text-[8px] sm:text-[10px]">■</span> {str}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50"></div>
              <h4 className="font-semibold text-slate-200 mb-4 sm:mb-5 flex items-center text-sm sm:text-base">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                Risk Areas
              </h4>
              <ul className="space-y-3">
                {analysisData.weaknesses && analysisData.weaknesses.map((weak, i) => (
                  <li key={i} className="text-xs sm:text-sm text-slate-400 flex items-start leading-relaxed">
                    <span className="mr-2 sm:mr-3 mt-1.5 text-red-400 text-[8px] sm:text-[10px]">■</span> {weak}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6 md:col-span-2 lg:col-span-1">
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/50"></div>
                <h4 className="font-semibold text-slate-200 mb-4 sm:mb-5 flex items-center text-sm sm:text-base">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>
                  Lexical Padding
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysisData.repeatedWords && analysisData.repeatedWords.length > 0 ? (
                    analysisData.repeatedWords.map((word, i) => (
                      <span key={i} className="bg-slate-800 border border-slate-700 text-amber-400 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider">
                        "{word}"
                      </span>
                    ))
                  ) : (
                    <span className="text-xs sm:text-sm text-slate-500">No major filler words detected.</span>
                  )}
                </div>
              </div>

              {analysisData.suggestions && analysisData.suggestions.length > 0 && (
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/50"></div>
                   <h4 className="font-semibold text-slate-200 mb-4 sm:mb-5 flex items-center text-sm sm:text-base">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    Action Plan
                  </h4>
                  <ul className="space-y-3">
                    {analysisData.suggestions.map((sug, i) => (
                      <li key={i} className="text-xs sm:text-sm text-slate-400 flex items-start leading-relaxed">
                        <span className="mr-2 sm:mr-3 mt-0.5 text-indigo-400 font-bold">→</span> {sug}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

          </div>

          <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden mt-6 sm:mt-8">
            <div className="bg-slate-900/80 border-b border-slate-800 p-4 sm:p-6">
               <h3 className="text-xs sm:text-sm font-semibold text-slate-300 uppercase tracking-wider">Session Transcript</h3>
            </div>
            <div className="p-0 divide-y divide-slate-800/50">
              {analysisData.qaPairs && analysisData.qaPairs.map((pair, index) => (
                <div key={index} className="p-4 sm:p-6 md:p-8 hover:bg-slate-800/30 transition-colors flex flex-col sm:flex-row gap-4 sm:gap-6">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-800 border border-slate-700 text-indigo-400 flex items-center justify-center font-bold flex-shrink-0 shadow-sm text-sm sm:text-base">
                    Q{index + 1}
                  </div>
                  
                  <div className="flex-1 space-y-4 sm:space-y-5 overflow-hidden">
                    <div>
                      <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2 block">Interviewer System</span>
                      <p className="text-slate-200 font-medium text-sm sm:text-base">{pair.question}</p>
                    </div>
                    
                    <div className="bg-slate-950/50 rounded-xl p-4 sm:p-5 border border-slate-800/80 relative">
                      <span className="text-[10px] sm:text-[11px] font-bold text-cyan-500 uppercase tracking-wider mb-1.5 sm:mb-2 flex items-center">
                         Candidate Input
                      </span>
                      <p className="text-slate-400 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">{pair.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

