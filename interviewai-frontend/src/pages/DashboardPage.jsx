import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const navigate = useNavigate();
  
  // State to hold our form inputs
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  
  // State to handle UI changes (loading and the final AI response)
  const [isLoading, setIsLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);

  // 1. Handle the file upload to your Node.js backend
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!resumeFile || !jobDescription) {
      alert("Please provide both a resume and a job description.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('jobDescription', jobDescription);

    try {
      const response = await fetch('http://localhost:5000/api/upload-resume', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        // We successfully got the strategy from Gemini! Save it to state.
        setAiFeedback(data.aiFeedback);
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle navigating to the Interview Room
  const handleEnterRoom = () => {
    navigate('/interview', { 
      state: { 
        // We pass the aiFeedback we just saved in state over to the new page
        aiFeedback: aiFeedback 
      } 
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            InterviewAI Dashboard
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Upload your resume and job description to prepare your AI logic.
          </p>
        </div>
        
        {/* The Upload Form */}
        <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200">
          <form onSubmit={handleUpload} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Target Job Description</label>
              <textarea 
                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500"
                rows="4"
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Upload Resume (PDF)</label>
              <input 
                type="file" 
                accept=".pdf"
                onChange={(e) => setResumeFile(e.target.files[0])}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-white font-bold ${isLoading ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isLoading ? 'Analyzing Resume...' : 'Generate Interview Strategy'}
            </button>
          </form>
        </div>

        {/* The AI Feedback Section (Only shows if aiFeedback exists, like in your screenshot!) */}
        {aiFeedback && (
          <div className="bg-slate-900 rounded-xl p-8 shadow-xl border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">Interview Strategy Generated</h2>
            <div className="text-slate-300 mb-6 text-sm leading-relaxed whitespace-pre-wrap">
              {aiFeedback}
            </div>
            
            {/* The exact button from your screenshot */}
            <button 
              onClick={handleEnterRoom}
              className="bg-transparent text-white border-2 border-white px-6 py-2 rounded-lg font-semibold hover:bg-white hover:text-slate-900 transition-colors"
            >
              Enter Interview Room
            </button>
          </div>
        )}

      </div>
    </div>
  );
}