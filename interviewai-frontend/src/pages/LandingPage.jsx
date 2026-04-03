import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-5xl font-extrabold text-gray-900 mb-6 tracking-tight text-center">
        Welcome to InterviewAI
      </h1>
      <p className="text-xl text-gray-600 mb-10 max-w-2xl text-center">
        Master your placement process with real-time, AI-driven mock interviews.
      </p>
      
      {/* This button uses the Router to instantly switch to your Dashboard */}
      <Link 
        to="/dashboard" 
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors shadow-lg"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}