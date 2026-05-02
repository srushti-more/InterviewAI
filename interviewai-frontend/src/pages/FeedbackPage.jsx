import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import logo from './assets/image_7.png'; 

export default function Feedback() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract the specific interview data we just finished (or clicked on from the dashboard)
  const { analysisData } = location.state || {};
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Fetch past interviews to show progress
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/interviews');
        const data = await response.json();
        // Remove the current interview from the history list so we don't compare it against itself
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

  // Fallback if navigated directly
  if (!analysisData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-slate-700 mb-4">No Feedback Data Found</h2>
        <button onClick={() => navigate('/dashboard')} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 shadow-md">
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Calculate Progress
  const previousInterview = history.length > 0 ? history[0] : null; // The most recent past interview
  const progressDifference = previousInterview ? analysisData.score - previousInterview.score : 0;

  // Circular Score SVG Logic
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (analysisData.score / 100) * circumference;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 p-6 hidden lg:flex flex-col">
        <h1 className="text-xl font-bold text-blue-600 mb-10 flex items-center">
          <img src={logo} alt="InterviewAI Logo" className="w-8 h-8 mr-2" />
          InterviewPro
        </h1>
        <nav className="flex-1 space-y-2">
          <button onClick={() => navigate('/dashboard')} className="w-full flex items-center space-x-3 text-slate-500 hover:bg-slate-100 px-4 py-3 rounded-lg font-medium transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            <span>Dashboard</span>
          </button>
          <button className="w-full flex items-center space-x-3 bg-blue-50 text-blue-700 px-4 py-3 rounded-lg font-medium transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            <span>Feedback Report</span>
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 lg:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-6 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-800">Interview Analysis</h2>
              <p className="text-slate-500 mt-2">Completed on {new Date(analysisData.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <button onClick={() => navigate('/dashboard')} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2 px-6 rounded-lg transition-colors shadow-sm">
              Start New Session
            </button>
          </div>

          {/* TOP ROW: Score, Progress, and Compliment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Radial Score & Progress */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col items-center justify-center relative">
              <h3 className="text-lg font-bold text-slate-700 mb-4 text-center">Overall Rating</h3>
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                  <circle 
                    cx="70" cy="70" r={radius} 
                    stroke="currentColor" strokeWidth="12" fill="transparent" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={strokeDashoffset} 
                    strokeLinecap="round"
                    className={`${analysisData.score >= 80 ? 'text-green-500' : analysisData.score >= 60 ? 'text-yellow-500' : 'text-red-500'} transition-all duration-1000 ease-out`} 
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center mt-1">
                  <span className="text-4xl font-black text-slate-800">{analysisData.score}</span>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">/ 100</span>
                </div>
              </div>
              
              {/* Progress Indicator */}
              {!loadingHistory && previousInterview && (
                <div className={`mt-4 flex items-center text-sm font-bold ${progressDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {progressDifference >= 0 ? (
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                  ) : (
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                  )}
                  {Math.abs(progressDifference)} points since last interview
                </div>
              )}
            </div>

            {/* AI Summary Text & Compliment */}
            <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <h3 className="text-lg font-bold text-slate-800">Interviewer's Verdict</h3>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-slate-600 leading-relaxed">
                  {analysisData.summary}
                </p>
                {/* The Encouraging Compliment */}
                {analysisData.compliment && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start mt-4 shadow-sm">
                    <span className="text-2xl mr-3" role="img" aria-label="lightbulb">💡</span>
                    <p className="text-blue-800 font-medium text-sm italic">
                      "{analysisData.compliment}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* MIDDLE ROW: Strengths, Weaknesses, Filler Words */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Strengths */}
            <div className="bg-green-50/70 rounded-2xl border border-green-200 p-6 shadow-sm">
              <h4 className="font-bold text-green-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Your Strengths
              </h4>
              <ul className="space-y-3">
                {analysisData.strengths && analysisData.strengths.map((str, i) => (
                  <li key={i} className="text-sm text-green-700 flex items-start leading-snug">
                    <span className="mr-2 mt-0.5">•</span> {str}
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="bg-red-50/70 rounded-2xl border border-red-200 p-6 shadow-sm">
              <h4 className="font-bold text-red-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                Areas to Improve
              </h4>
              <ul className="space-y-3">
                {analysisData.weaknesses && analysisData.weaknesses.map((weak, i) => (
                  <li key={i} className="text-sm text-red-700 flex items-start leading-snug">
                    <span className="mr-2 mt-0.5">•</span> {weak}
                  </li>
                ))}
              </ul>
            </div>

            {/* Filler Words & Suggestions Stack */}
            <div className="space-y-6">
              {/* Filler Words */}
              <div className="bg-yellow-50/70 rounded-2xl border border-yellow-200 p-6 shadow-sm">
                <h4 className="font-bold text-yellow-800 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>
                  Repeated Filler Words
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysisData.repeatedWords && analysisData.repeatedWords.length > 0 ? (
                    analysisData.repeatedWords.map((word, i) => (
                      <span key={i} className="bg-yellow-200/60 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        "{word}"
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-yellow-700 font-medium">Excellent speaking! No major filler words detected.</span>
                  )}
                </div>
              </div>

              {/* Actionable Suggestions */}
              {analysisData.suggestions && analysisData.suggestions.length > 0 && (
                <div className="bg-indigo-50/70 rounded-2xl border border-indigo-200 p-6 shadow-sm">
                   <h4 className="font-bold text-indigo-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    Action Plan
                  </h4>
                  <ul className="space-y-3">
                    {analysisData.suggestions.map((sug, i) => (
                      <li key={i} className="text-sm text-indigo-700 flex items-start leading-snug">
                        <span className="mr-2 mt-0.5 font-bold">→</span> {sug}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

          </div>

          {/* BOTTOM ROW: Detailed Q&A Timeline Breakdown */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
            <div className="bg-slate-50 border-b border-slate-200 p-6">
               <h3 className="text-lg font-bold text-slate-800">Complete Q&A Timeline</h3>
               <p className="text-sm text-slate-500 mt-1">Review exactly what was asked and how you responded.</p>
            </div>
            <div className="p-0 divide-y divide-slate-100">
              {analysisData.qaPairs && analysisData.qaPairs.map((pair, index) => (
                <div key={index} className="p-6 md:p-8 hover:bg-slate-50 transition-colors flex flex-col md:flex-row gap-6">
                  {/* Number Circle */}
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                    Q{index + 1}
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    {/* The Question */}
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Interviewer Asked</span>
                      <p className="text-slate-800 font-semibold text-lg">{pair.question}</p>
                    </div>
                    
                    {/* The Answer */}
                    <div className="bg-white rounded-xl p-5 border border-slate-200 relative shadow-sm">
                      <span className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2 flex items-center">
                         <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                         Your Response
                      </span>
                      <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{pair.answer}</p>
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