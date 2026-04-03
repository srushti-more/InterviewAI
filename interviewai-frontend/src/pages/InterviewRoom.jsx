import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function InterviewRoom() {
  const navigate = useNavigate();
  
  // Catch the data sent over from the Dashboard
  const location = useLocation();
  
  // Extract the feedback, or use a default fallback if someone navigates here directly without using the dashboard
  const initialAiMessage = location.state?.aiFeedback 
    || "Hello! I have reviewed your resume. Let me know when you are ready to begin the interview.";

  const [isRecording, setIsRecording] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  
  // Set the very first transcript message to whatever Gemini generated!
  const [transcript, setTranscript] = useState([
    { speaker: 'AI', text: initialAiMessage }
  ]);

  // Refs to hold the audio stream and recorder without triggering re-renders
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      // 1. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 2. Create the MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // 3. Push data chunks as they become available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // 4. Handle what happens when we stop recording and send to backend
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log("Audio captured successfully! Blob size:", audioBlob.size);
        
        // Prepare the audio file to be sent to the backend
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        try {
          // Send HTTP POST request to your Express server
          const response = await fetch('http://localhost:5000/api/process-audio', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();
          console.log("Server Response:", data);

          // Update transcript to show successful upload (Placeholder until Whisper is wired up)
          setTranscript(prev => {
            const updatedTranscript = [...prev];
            updatedTranscript[updatedTranscript.length - 1] = { 
              speaker: 'Candidate', 
              text: '[Audio successfully sent to backend! Awaiting AI response...]' 
            };
            return updatedTranscript;
          });

          // Simulate AI finishing its processing after a few seconds
          setTimeout(() => {
             setIsAiSpeaking(false);
             setTranscript(prev => [...prev, { speaker: 'AI', text: 'Audio received! We will wire up OpenAI Whisper to transcribe this next.' }]);
          }, 2500);

        } catch (error) {
          console.error("Error uploading audio to backend:", error);
          setTranscript(prev => [...prev, { speaker: 'System', text: 'Error connecting to the server.' }]);
          setIsAiSpeaking(false);
        }

        // Cleanup the microphone stream so the red recording dot goes away
        stream.getTracks().forEach(track => track.stop());
      };

      // 5. Start the engine
      mediaRecorder.start();
      setIsRecording(true);

    } catch (err) {
      console.error("Microphone access denied or failed:", err);
      alert("Please allow microphone access to use the interview room.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop(); // This triggers the onstop event above
      setIsRecording(false);
      setIsAiSpeaking(true); // Switch visual state to AI processing
      
      // Add a placeholder to the transcript while we wait for the server
      setTranscript(prev => [...prev, { speaker: 'Candidate', text: '[Processing audio...]' }]);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleEndInterview = () => {
    // Logic to compile the final transcript and trigger the final Gemini evaluation will go here
    navigate('/feedback');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col p-6 font-sans">
      
      {/* Header Bar */}
      <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl shadow-md mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-white font-semibold">Live Session</span>
        </div>
        <span className="text-slate-300 font-medium bg-slate-700 px-4 py-1 rounded-full">
          Target Role: Software Engineer
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-grow">
        
        {/* Left Column: The Audio Visualizer Stage */}
        <div className="flex-1 bg-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 shadow-inner border border-slate-700 relative overflow-hidden">
          
          <h2 className="text-slate-400 text-lg mb-8 absolute top-8">Audio Interface</h2>
          
          {/* Animated Visualizer Circle */}
          <div className={`w-64 h-64 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${
            isRecording ? 'bg-blue-500/20 shadow-blue-500/50' : 
            isAiSpeaking ? 'bg-teal-500/20 shadow-teal-500/50' : 'bg-slate-700'
          }`}>
            <div className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-300 ${
               isRecording ? 'bg-blue-600 animate-pulse' : 
               isAiSpeaking ? 'bg-teal-500 animate-bounce' : 'bg-slate-600'
            }`}>
              <span className="text-white text-xl font-bold tracking-wider">
                {isRecording ? 'Listening...' : isAiSpeaking ? 'AI Speaking...' : 'Ready'}
              </span>
            </div>
          </div>

          {/* Core Controls */}
          <div className="absolute bottom-8 flex space-x-4">
            <button 
              onClick={toggleRecording}
              disabled={isAiSpeaking}
              className={`px-8 py-3 rounded-full font-bold text-white transition-colors flex items-center space-x-2 ${
                isRecording ? 'bg-red-500 hover:bg-red-600' : 
                isAiSpeaking ? 'bg-slate-600 cursor-not-allowed opacity-50' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <span>{isRecording ? 'Stop Recording' : 'Start Speaking'}</span>
            </button>
            
            <button 
              onClick={handleEndInterview}
              className="px-8 py-3 rounded-full font-bold text-white bg-slate-700 hover:bg-slate-600 transition-colors border border-slate-500"
            >
              End Interview
            </button>
          </div>
        </div>

        {/* Right Column: Live Transcript */}
        <div className="w-full lg:w-1/3 bg-white rounded-2xl flex flex-col shadow-xl overflow-hidden border border-slate-200">
          <div className="bg-slate-100 p-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-800 flex items-center">
              <svg className="w-5 h-5 mr-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Live Transcript
            </h3>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50">
            {transcript.map((entry, index) => (
              <div key={index} className={`flex flex-col ${entry.speaker === 'Candidate' || entry.speaker === 'System' ? 'items-end' : 'items-start'}`}>
                <span className="text-xs font-semibold text-slate-400 mb-1 ml-1 uppercase tracking-wider">
                  {entry.speaker}
                </span>
                <div className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-sm whitespace-pre-wrap ${
                  entry.speaker === 'Candidate' 
                    ? 'bg-blue-600 text-white rounded-tr-sm' 
                    : entry.speaker === 'System'
                    ? 'bg-red-500 text-white rounded-tr-sm'
                    : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'
                }`}>
                  {entry.text}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}