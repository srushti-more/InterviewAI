import { useState } from 'react';

export default function UploadSection() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  
  // 1. New state to hold the AI's strategy
  const [aiStrategy, setAiStrategy] = useState(null); 

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setStatusMessage(null);
    } else {
      alert('Please upload a valid PDF file.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !jobDescription) {
      alert('Please provide both a resume and a job description.');
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);
    setAiStrategy(null); // Clear old strategies on a new upload

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescription', jobDescription);

    try {
      const response = await fetch('http://localhost:5000/api/upload-resume', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setStatusMessage({ type: 'success', text: data.message });
        // 2. Save the AI's text from the backend into our state!
        setAiStrategy(data.aiFeedback); 
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Something went wrong.' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setStatusMessage({ type: 'error', text: 'Failed to connect to the server.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 pb-20">
      {/* The Upload Card */}
      <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Start Your AI Interview</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Resume (PDF)</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-blue-300 border-dashed rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-4 text-blue-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 text-center px-4">
                    {file ? <span className="text-blue-600 font-medium">{file.name}</span> : "PDF only (MAX. 5MB)"}
                  </p>
                </div>
                <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Job Description</label>
            <textarea
              rows="4"
              className="block p-3 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Paste the job description or required skills here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            ></textarea>
          </div>

          {statusMessage && (
            <div className={`p-4 rounded-lg text-sm ${statusMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {statusMessage.text}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full text-white font-medium rounded-lg text-sm px-5 py-3 text-center transition-colors flex justify-center items-center ${
              isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Consulting AI...' : 'Upload and Analyze'}
          </button>
        </form>
      </div>

      {/* 3. The New AI Strategy Display Card */}
      {aiStrategy && (
        <div className="mt-8 p-6 bg-slate-800 rounded-xl shadow-lg border border-slate-700 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <span className="text-blue-400 text-xl">🧠</span>
            </div>
            <h3 className="text-xl font-semibold text-white">Interview Strategy Generated</h3>
          </div>
          
          <div className="prose prose-invert max-w-none">
            {/* whitespace-pre-wrap ensures the line breaks and bullet points from the AI format correctly */}
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap font-mono text-sm">
              {aiStrategy}
            </p>
          </div>
          
          <button className="mt-6 w-full text-slate-900 font-semibold bg-emerald-400 hover:bg-emerald-500 rounded-lg text-sm px-5 py-3 transition-colors">
            Enter Interview Room
          </button>
        </div>
      )}
    </div>
  );
}