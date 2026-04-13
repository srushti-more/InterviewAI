import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [jobDesc, setJobDesc] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

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
      const response = await fetch('http://localhost:5000/api/upload-resume', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Automatically navigate to the room. The user never sees the strategy.
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

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      
      {/* Sidebar matching the design */}
      <div className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col">
        <h1 className="text-xl font-bold text-blue-600 mb-10 flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
          InterviewPro
        </h1>
        <nav className="flex-1 space-y-2">
          <button className="w-full flex items-center space-x-3 bg-blue-50 text-blue-700 px-4 py-3 rounded-lg font-medium transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            <span>Dashboard</span>
          </button>
          <button className="w-full flex items-center space-x-3 text-slate-500 hover:bg-slate-100 px-4 py-3 rounded-lg font-medium transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            <span>Past Interviews</span>
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-10 overflow-y-auto">
        <h2 className="text-3xl font-bold mb-8 text-slate-800">My Interviews</h2>
        
        {/* Static Placeholder Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-10">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Job Role</th>
                <th className="px-6 py-4 font-medium">Score</th>
                <th className="px-6 py-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-slate-600">Oct 24, 2024</td>
                <td className="px-6 py-4 font-medium">Senior Android Developer</td>
                <td className="px-6 py-4"><span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">85</span></td>
                <td className="px-6 py-4 text-right text-slate-400">•••</td>
              </tr>
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