import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './assets/image_7.png'; 

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [jobDesc, setJobDesc] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pastInterviews, setPastInterviews] = useState([]);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!token) {
      navigate('/auth');
      return;
    }

    const fetchHistory = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/interviews', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.status === 401) handleLogout(); 
        const data = await response.json();
        setPastInterviews(data);
      } catch (error) {
        console.error("Failed to load interview history:", error);
      }
    };
    fetchHistory();
  }, [navigate, token]);

  const handleUpload = async () => {
    if (!file || !jobDesc) return alert("Please provide resume and job description.");
    setIsLoading(true);
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescription', jobDesc);

    try {
      const response = await fetch('http://localhost:5000/api/upload-resume', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        navigate('/interview', { state: { aiFeedback: data.aiFeedback } });
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const scrollToPastInterviews = () => {
    document.getElementById("past-interviews-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex font-sans bg-slate-950 text-slate-50 selection:bg-indigo-500/30">
      
      {/* Sidebar Navigation */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col fixed h-full z-10">
        <h1 className="text-xl font-bold text-slate-50 mb-10 flex items-center tracking-tight">
          <img src={logo} alt="Logo" className="w-8 h-8 mr-3 drop-shadow-md" />
          InterviewAI
        </h1>
        <nav className="flex-1 space-y-2">
          {/* Active Menu Item */}
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="w-full flex items-center space-x-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-4 py-2.5 rounded-xl font-medium transition-all shadow-[inset_0_0_12px_rgba(99,102,241,0.05)]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            <span>Dashboard</span>
          </button>
          {/* Inactive Menu Item */}
          <button onClick={scrollToPastInterviews} className="w-full flex items-center space-x-3 text-slate-400 hover:text-slate-50 hover:bg-slate-800/50 px-4 py-2.5 rounded-xl font-medium transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            <span>Past Interviews</span>
          </button>
        </nav>
        
        {/* Logout Button */}
        <div className="border-t border-slate-800 pt-6 mt-auto">
          <div className="text-slate-400 text-xs font-medium mb-3 px-2 uppercase tracking-wider">Account</div>
          <div className="text-slate-300 text-sm mb-4 px-2 truncate font-semibold">{user.name}</div>
          <button onClick={handleLogout} className="w-full flex items-center space-x-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 px-4 py-2.5 rounded-xl font-medium transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10 overflow-y-auto ml-64">
        <h2 className="text-3xl font-semibold text-slate-50 mb-2 tracking-tight">Welcome back, {user.name}</h2>
        <p className="text-slate-400 mb-10 text-lg">Initialize your next AI interview session below.</p>
        
        {/* Elevated Surface Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 max-w-5xl mb-16 relative overflow-hidden">
          {/* Subtle top inner glow */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>

          <h3 className="text-xl font-semibold mb-6 text-slate-50 flex items-center">
             <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center mr-3 border border-indigo-500/30">
               <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
             </div>
             Configure Session
          </h3>
          
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            {/* Upload Area */}
            <div className="flex-1 border border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center p-8 bg-slate-950/50 hover:bg-slate-900 hover:border-indigo-500/50 transition-all relative group">
              <svg className="w-10 h-10 text-slate-600 group-hover:text-indigo-400 transition-colors mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
              <span className="text-slate-300 font-medium mb-1">Upload Resume</span>
              <span className="text-slate-500 text-xs mb-4">PDF format only</span>
              <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              {file && <span className="bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg text-indigo-300 text-sm font-medium mt-2 truncate w-full text-center">{file.name}</span>}
            </div>

            {/* Job Description Area */}
            <div className="flex-1 rounded-xl overflow-hidden bg-slate-950/50 border border-slate-800">
              <textarea 
                placeholder="Paste the target Job Description..." 
                className="w-full h-full min-h-[160px] p-5 bg-transparent focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none text-slate-300 placeholder-slate-600 transition-all text-sm leading-relaxed" 
                value={jobDesc} 
                onChange={(e) => setJobDesc(e.target.value)} 
              />
            </div>
          </div>

          <button onClick={handleUpload} disabled={isLoading || !file || !jobDesc} className={`w-full py-4 rounded-xl font-semibold text-white transition-all tracking-wide text-sm ${isLoading || !file || !jobDesc ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' : 'bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:-translate-y-0.5'}`}>
            {isLoading ? 'ANALYZING CONTEXT...' : 'INITIALIZE INTERVIEW'}
          </button>
        </div>

        <div className="flex items-center justify-between mb-6" id="past-interviews-section">
          <h2 className="text-xl font-semibold text-slate-50 tracking-tight">Interview History</h2>
        </div>
        
        {/* Data Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-10 max-w-5xl shadow-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-xs font-semibold">
              <tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">Role Context</th><th className="px-6 py-4">Performance Score</th><th className="px-6 py-4 text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 bg-slate-900/50">
              {pastInterviews.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-16 text-center text-slate-500">No session history found. Initialize your first interview above.</td></tr>
              ) : (
                pastInterviews.map((interview) => (
                  <tr key={interview._id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4 text-slate-400">{new Date(interview.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-6 py-4 font-medium text-slate-200">{interview.jobRole}</td>
                    <td className="px-6 py-4">
                      {/* Semantic Score Badges */}
                      <span className={`px-3 py-1 rounded-md text-xs font-semibold tracking-wide ${
                        interview.score === 0 ? 'bg-slate-800 text-slate-400 border border-slate-700' : 
                        interview.score >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                        interview.score >= 60 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                        'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {interview.score === 0 ? 'INCOMPLETE' : `${interview.score} / 100`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {/* Ghost Button */}
                      <button onClick={() => navigate(`/feedback/${interview._id}`, { state: { analysisData: interview } })} className="bg-transparent border border-slate-700 text-slate-300 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-indigo-500/10 px-4 py-2 rounded-lg text-xs font-semibold transition-all">
                        View Analytics
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}