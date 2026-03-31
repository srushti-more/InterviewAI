import UploadSection from './components/UploadSection';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            InterviewAI
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            Master your placement process with real-time, AI-driven mock interviews.
          </p>
        </div>
        
        <UploadSection />
      </div>
    </div>
  );
}

export default App;