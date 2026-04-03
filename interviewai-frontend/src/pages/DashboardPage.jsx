import UploadSection from '../components/UploadSection';

export default function DashboardPage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            InterviewAI Dashboard
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            Upload your resume and job description to prepare your AI logic.
          </p>
        </div>
        
        {/* Your perfectly working upload logic lives here now! */}
        <UploadSection />
      </div>
    </div>
  );
}