import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function InterviewRoom() {
  const navigate = useNavigate();
  
  // Catch the data sent over from the Dashboard
  const location = useLocation();
  
  // Extract the feedback, or use a default fallback
  const initialAiMessage = location.state?.aiFeedback 
    || "Hello! I have reviewed your resume. I will be your interviewer today. Let's begin with your first question.";

  const [isRecording, setIsRecording] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [hasStarted, setHasStarted] = useState(false); // Handles browser autoplay block
  const [questionCount, setQuestionCount] = useState(1); // Tracks number of questions
  const MAX_QUESTIONS = 8; // Ends interview after this many questions
  
  // Set the very first transcript message
  const [transcript, setTranscript] = useState([
    { speaker: 'AI', text: initialAiMessage }
  ]);

  // Refs to hold the audio stream and recorder without triggering re-renders
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // NEW FREE BROWSER VOICE FUNCTION
  const playAiVoice = (textToSpeak, onComplete = null) => {
    setIsAiSpeaking(true);
    
    // Check if the browser supports speech synthesis
    if (!('speechSynthesis' in window)) {
      console.error("Sorry, your browser doesn't support text-to-speech!");
      setIsAiSpeaking(false);
      if (onComplete) onComplete();
      return;
    }

    // Cancel any ongoing speech so they don't overlap
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    // Optional: You can try to find a better-sounding voice on the user's system
    const voices = window.speechSynthesis.getVoices();
    // Try to grab an English female or natural-sounding voice if available
    const preferredVoice = voices.find(v => v.lang.includes('en') && v.name.includes('Female')) || voices[0];
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // You can adjust speed and pitch here (1 is default)
    utterance.rate = 1.0; 
    utterance.pitch = 1.0;

    // What to do when the voice finishes speaking
    utterance.onend = () => {
      setIsAiSpeaking(false);
      if (onComplete) onComplete();
    };

    // What to do if it breaks
    utterance.onerror = (e) => {
      console.error("Speech playback error:", e);
      setIsAiSpeaking(false);
      if (onComplete) onComplete();
    };

    // Speak!
    window.speechSynthesis.speak(utterance);
  };

  // Called when user clicks "Start Interview" to bypass browser audio restrictions
  const beginInterviewSession = () => {
    setHasStarted(true);
    playAiVoice("Hello! I have reviewed your resume. Whenever you are ready, press start speaking to answer my first question.");
  };

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

          if (response.ok) {
            // Update the transcript with the REAL conversation!
            setTranscript(prev => {
              const updatedTranscript = [...prev];
              // Replace the 'Processing...' placeholder with what Whisper heard
              updatedTranscript[updatedTranscript.length - 1] = { 
                speaker: 'Candidate', 
                text: data.candidateTranscript 
              };
              // Add Gemini's generated response to the chat
              updatedTranscript.push({ 
                speaker: 'AI', 
                text: data.aiResponse 
              });
              return updatedTranscript;
            });
            
            // Check if we reached the max questions limit!
            if (questionCount >= MAX_QUESTIONS) {
              const closingMessage = "Thank you for your time today. We have collected all your answers, and we will get back to you soon with the results.";
              setTranscript(prev => [...prev, { speaker: 'AI', text: closingMessage }]);
              
              // Play final message, then navigate away
              playAiVoice(closingMessage, () => {
                navigate('/feedback'); // Redirects after AI finishes speaking
              });
            } else {
              // Increase question count and play the next question
              setQuestionCount(prev => prev + 1);
              playAiVoice(data.spokenQuestion); 
            }

          } else {
            throw new Error(data.error);
          }

        } catch (error) {
          console.error("Error uploading audio to backend:", error);
          setTranscript(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { speaker: 'System', text: `Error: ${error.message}` };
            return updated;
          });
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

  const handleEndInterview = async () => {
    setIsAiSpeaking(true); // Show loading state
    
    // Create a temporary loading message in the transcript
    setTranscript(prev => [...prev, { speaker: 'System', text: 'Compiling interview data and generating strict feedback report. Please wait...' }]);

    try {
      const response = await fetch('http://localhost:5000/api/analyze-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcript })
      });

      const analysisData = await response.json();

      if (response.ok) {
        // Navigate to feedback page AND pass the massive data object we just generated!
        navigate('/feedback', { state: { analysisData } });
      } else {
        throw new Error(analysisData.error);
      }
    } catch (error) {
      console.error("Error analyzing interview:", error);
      alert("Failed to generate feedback. See console.");
      setIsAiSpeaking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col p-6 font-sans">
      
      {/* Header Bar */}
      <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl shadow-md mb-6 relative z-30">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-white font-semibold">Live Session (Question {questionCount}/{MAX_QUESTIONS})</span>
        </div>
        <span className="text-slate-300 font-medium bg-slate-700 px-4 py-1 rounded-full">
          Target Role: Software Engineer
        </span>
      </div>

      {/* PARENT CONTAINER: Added 'relative' here */}
      <div className="flex flex-col lg:flex-row gap-6 flex-grow relative">
        
        {/* Left Column: The Audio Visualizer Stage */}
        <div className="flex-1 bg-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 shadow-inner border border-slate-700 relative overflow-hidden">
          
          {/* Start Interview Overlay */}
          {!hasStarted ? (
            <div className="absolute inset-0 z-30 bg-slate-800/90 flex flex-col items-center justify-center backdrop-blur-sm">
              <h2 className="text-white text-2xl font-bold mb-4">Ready to Begin?</h2>
              <button 
                onClick={beginInterviewSession}
                className="px-8 py-4 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-full text-xl shadow-lg transition-transform transform hover:scale-105"
              >
                Start Interview
              </button>
            </div>
          ) : null}

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
          <div className="absolute bottom-8 flex space-x-4 z-20">
            <button 
              onClick={toggleRecording}
              disabled={isAiSpeaking || !hasStarted}
              className={`px-8 py-3 rounded-full font-bold text-white transition-colors flex items-center space-x-2 ${
                isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 
                isAiSpeaking || !hasStarted ? 'bg-slate-600 cursor-not-allowed opacity-50' : 'bg-blue-600 hover:bg-blue-700'
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

        {/* Right Column: Live Transcript Overlay - Updated classes here! */}
        <div className="w-96 absolute right-8 top-8 bottom-8 bg-white/95 backdrop-blur-md rounded-2xl flex flex-col shadow-2xl overflow-hidden border border-slate-200 z-20 hidden lg:flex">
          <div className="bg-slate-100/90 p-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-800 flex items-center">
              <svg className="w-5 h-5 mr-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Live Transcript
            </h3>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-transparent">
            {transcript.map((entry, index) => (
              <div key={index} className={`flex flex-col ${entry.speaker === 'Candidate' || entry.speaker === 'System' ? 'items-end' : 'items-start'}`}>
                <span className="text-xs font-semibold text-slate-500 mb-1 ml-1 uppercase tracking-wider">
                  {entry.speaker}
                </span>
                <div className={`max-w-[90%] rounded-2xl px-5 py-3 shadow-sm whitespace-pre-wrap text-sm ${
                  entry.speaker === 'Candidate' 
                    ? 'bg-blue-600 text-white rounded-tr-sm' 
                    : entry.speaker === 'System'
                    ? 'bg-red-500 text-white rounded-tr-sm'
                    : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-md'
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