import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Import the logo image
import logo from './assets/image_7.png'; 

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [jobDesc, setJobDesc] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pastInterviews, setPastInterviews] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch past interviews from your real database
    const fetchHistory = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/interviews');
        const data = await response.json();
        setPastInterviews(data);
      } catch (error) {
        console.error("Failed to load interview history:", error);
      }
    };
    fetchHistory();
  }, []);

  const handleUpload = async () => {
    if (!file || !jobDesc) {
      alert("Please provide both a resume and a job description.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescription', jobDesc);

    try {
      // REAL BACKEND CALL
      const response = await fetch('http://localhost:5000/api/upload-resume', {
        method: 'POST',
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

  // Function to smoothly scroll to the past interviews section
  const scrollToPastInterviews = () => {
    const element = document.getElementById("past-interviews-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      
      {/* Sidebar matching the design */}
      <div className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col fixed h-full z-10">
        {/* Header with Logo */}
        <h1 className="text-xl font-bold text-blue-600 mb-10 flex items-center">
          <img src={logo} alt="InterviewAI Logo" className="w-8 h-8 mr-2" />
          InterviewPro
        </h1>
        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-full flex items-center space-x-3 bg-blue-50 text-blue-700 px-4 py-3 rounded-lg font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            <span>Dashboard</span>
          </button>
          {/* Sidebar Past Interviews Button -> Scrolls to Table */}
          <button 
            onClick={scrollToPastInterviews}
            className="w-full flex items-center space-x-3 text-slate-500 hover:bg-slate-100 px-4 py-3 rounded-lg font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            <span>Past Interviews</span>
          </button>
        </nav>
      </div>

      {/* Main Content Area - Added margin-left to account for fixed sidebar */}
      <div className="flex-1 p-10 overflow-y-auto ml-64">
        
        <h2 className="text-3xl font-bold mb-8 text-slate-800" id="past-interviews-section">My Interviews</h2>
        
        {/* Dynamic Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-10">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Job Role</th>
                <th className="px-6 py-4 font-medium">Score</th>
                <th className="px-6 py-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pastInterviews.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-400">
                    No interviews completed yet. Start your first session below!
                  </td>
                </tr>
              ) : (
                pastInterviews.map((interview) => (
                  <tr key={interview._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(interview.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 font-medium">{interview.jobRole}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${interview.score >= 80 ? 'bg-green-100 text-green-700' : interview.score >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {interview.score}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {/* RESTORED ONCLICK HANDLER: Passes the specific interview data to the feedback page */}
                      <button 
                        onClick={() => navigate('/feedback', { state: { analysisData: interview } })}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                      >
                        View Report
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Start New Session Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-4xl">
          <h3 className="text-xl font-bold mb-6">Start New Session</h3>
          
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            {/* File Upload Box */}
            <div className="flex-1 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-8 bg-slate-50 hover:bg-slate-100 transition-colors relative">
              <svg className="w-10 h-10 text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
              <span className="text-slate-600 font-medium mb-1">Upload Resume</span>
              <span className="text-slate-400 text-sm mb-4">PDF format only</span>
              <input 
                type="file" 
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {file && <span className="text-blue-600 text-sm font-bold mt-2 truncate w-full text-center px-4">{file.name}</span>}
            </div>

            {/* Job Description Box */}
            <div className="flex-1">
              <textarea 
                placeholder="Paste the target Job Description here..."
                className="w-full h-full min-h-[160px] p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
              />
            </div>
          </div>

          <button 
            onClick={handleUpload}
            disabled={isLoading || !file || !jobDesc}
            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${
              isLoading || !file || !jobDesc ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 transform hover:-translate-y-0.5'
            }`}
          >
            {isLoading ? 'ANALYZING PROFILE & PREPARING AI...' : 'BEGIN INTERVIEW'}
          </button>
        </div>
      </div>
    </div>
  );
}