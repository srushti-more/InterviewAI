import { useState } from 'react';

export default function UploadSection() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setStatusMessage(null); // Clear previous messages
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

    // 1. Prepare the data for sending
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescription', jobDescription);

    try {
      // 2. Send the POST request to your Node.js server
      const response = await fetch('http://localhost:5000/api/upload-resume', {
        method: 'POST',
        body: formData, // Notice we do NOT set 'Content-Type'. The browser handles it for files automatically!
      });

      const data = await response.json();

      // 3. Handle the response
      if (response.ok) {
        setStatusMessage({ type: 'success', text: data.message });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Something went wrong.' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setStatusMessage({ type: 'error', text: 'Failed to connect to the server. Is the backend running?' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100 mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Start Your AI Interview</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Resume (PDF)
          </label>
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

        {/* Job Description Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Job Description
          </label>
          <textarea
            rows="5"
            className="block p-3 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 resize-none"
            placeholder="Paste the job description or required skills here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          ></textarea>
        </div>

        {/* Status Message Display */}
        {statusMessage && (
          <div className={`p-4 rounded-lg text-sm ${statusMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {statusMessage.text}
          </div>
        )}

        {/* Submit Button with Loading State */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full text-white font-medium rounded-lg text-sm px-5 py-3 text-center transition-colors flex justify-center items-center ${
            isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300'
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing File...
            </>
          ) : (
            'Upload and Analyze'
          )}
        </button>
      </form>
    </div>
  );
}