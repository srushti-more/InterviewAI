import { useLocation, useNavigate } from 'react-router-dom';

export default function Feedback() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract the data we passed from the Interview Room
  const { analysisData } = location.state || {};

  // Fallback if someone navigates here directly without doing an interview
  if (!analysisData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-slate-700 mb-4">No Feedback Data Found</h2>
        <button onClick={() => navigate('/dashboard')} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Circular Score SVG Logic
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (analysisData.score / 100) * circumference;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 p-6 hidden md:flex flex-col">
        <h1 className="text-xl font-bold text-blue-600 mb-10 flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
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

      {/* Main Content */}
      <div className="flex-1 p-6 lg:p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-8">
          
          <div className="flex justify-between items-end border-b border-slate-200 pb-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-800">Interview Summary & Scorecard</h2>
              <p className="text-slate-500 mt-2">Deep analysis of your recent mock interview.</p>
            </div>
            <button onClick={() => navigate('/dashboard')} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2 px-6 rounded-lg transition-colors shadow-sm">
              Start New Session
            </button>
          </div>

          {/* Top Row: Score & Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Radial Score Gauge */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col items-center justify-center">
              <h3 className="text-lg font-bold text-slate-700 mb-6 w-full text-center">Overall Rating</h3>
              <div className="relative w-48 h-48 flex items-center justify-center">
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
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-slate-800">{analysisData.score}</span>
                  <span className="text-sm font-medium text-slate-400 uppercase tracking-wider mt-1">/ 100</span>
                </div>
              </div>
            </div>

            {/* AI Summary Text */}
            <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col">
              <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Interviewer's Final Verdict
              </h3>
              <div className="flex-1 bg-slate-50 rounded-xl p-6 border border-slate-100">
                <p className="text-slate-600 leading-relaxed">
                  {analysisData.summary}
                </p>
              </div>
            </div>
          </div>

          {/* Middle Row: Strengths, Weaknesses, Filler Words */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Strengths */}
            <div className="bg-green-50/50 rounded-2xl border border-green-100 p-6">
              <h4 className="font-bold text-green-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Key Strengths
              </h4>
              <ul className="space-y-3">
                {analysisData.strengths.map((str, i) => (
                  <li key={i} className="text-sm text-green-700 flex items-start">
                    <span className="mr-2 mt-0.5">•</span> {str}
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="bg-red-50/50 rounded-2xl border border-red-100 p-6">
              <h4 className="font-bold text-red-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                Areas for Improvement
              </h4>
              <ul className="space-y-3">
                {analysisData.weaknesses.map((weak, i) => (
                  <li key={i} className="text-sm text-red-700 flex items-start">
                    <span className="mr-2 mt-0.5">•</span> {weak}
                  </li>
                ))}
              </ul>
            </div>

            {/* Filler Words */}
            <div className="bg-yellow-50/50 rounded-2xl border border-yellow-100 p-6">
              <h4 className="font-bold text-yellow-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>
                Overused / Filler Words
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysisData.repeatedWords.length > 0 ? (
                  analysisData.repeatedWords.map((word, i) => (
                    <span key={i} className="bg-yellow-200/50 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      {word}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-yellow-700">Excellent! No severe filler words detected.</span>
                )}
              </div>
            </div>

          </div>

          {/* Bottom Row: Detailed Q&A Breakdown */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 p-6">
               <h3 className="text-lg font-bold text-slate-700">Question & Answer Timeline</h3>
            </div>
            <div className="p-0">
              {analysisData.qaPairs.map((pair, index) => (
                <div key={index} className="border-b border-slate-100 last:border-0 p-6 hover:bg-slate-50 transition-colors flex gap-6">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0 mt-1">
                    {index + 1}
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Interviewer Asked</span>
                      <p className="text-slate-800 font-medium">{pair.question}</p>
                    </div>
                    <div className="bg-slate-100 rounded-lg p-4 border border-slate-200 relative">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Your Answer</span>
                      <p className="text-slate-600 text-sm leading-relaxed">{pair.answer}</p>
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