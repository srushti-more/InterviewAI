import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import roomBg from './assets/image_8.png';
import logo from './assets/image_7.png';

export default function InterviewRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const initialAiMessage = location.state?.aiFeedback 
    || "Hello! I have reviewed your resume. I will be your interviewer today. Let's begin with your first question.";

  const [isRecording, setIsRecording] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [hasStarted, setHasStarted] = useState(false); 
  const [questionCount, setQuestionCount] = useState(1);
  const MAX_QUESTIONS = 8; 
  
  const [transcript, setTranscript] = useState([
    { speaker: 'AI', text: initialAiMessage }
  ]);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const playAiVoice = (textToSpeak, onComplete = null) => {
    setIsAiSpeaking(true);
    
    if (!('speechSynthesis' in window)) {
      console.error("Browser doesn't support text-to-speech!");
      setIsAiSpeaking(false);
      if (onComplete) onComplete();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en') && v.name.includes('Female')) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.rate = 1.0; 
    utterance.pitch = 1.0;
    utterance.onend = () => { setIsAiSpeaking(false); if (onComplete) onComplete(); };
    utterance.onerror = (e) => { console.error("Speech error:", e); setIsAiSpeaking(false); if (onComplete) onComplete(); };

    window.speechSynthesis.speak(utterance);
  };

  const beginInterviewSession = () => {
    setHasStarted(true);
    playAiVoice(initialAiMessage);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        try {
          const token = localStorage.getItem('token');
          const response = await fetch('http://localhost:5000/api/process-audio', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
          });

          const data = await response.json();

          if (response.ok) {
            setTranscript(prev => {
              const updatedTranscript = [...prev];
              updatedTranscript[updatedTranscript.length - 1] = { speaker: 'Candidate', text: data.candidateTranscript };
              updatedTranscript.push({ speaker: 'AI', text: data.aiResponse });
              return updatedTranscript;
            });
            
            if (questionCount >= MAX_QUESTIONS) {
              const closingMessage = "Thank you for your time today. We have collected all your answers, and we will get back to you soon with the results.";
              setTranscript(prev => [...prev, { speaker: 'AI', text: closingMessage }]);
              playAiVoice(closingMessage, () => handleEndInterview());
            } else {
              setQuestionCount(prev => prev + 1);
              playAiVoice(data.spokenQuestion); 
            }
          } else throw new Error(data.error);
        } catch (error) {
          console.error("Error uploading audio to backend:", error);
          setTranscript(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { speaker: 'System', text: `Error: ${error.message}` };
            return updated;
          });
          setIsAiSpeaking(false);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied or failed:", err);
      alert("Please allow microphone access to use the interview room.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop(); 
      setIsRecording(false);
      setIsAiSpeaking(true); 
      setTranscript(prev => [...prev, { speaker: 'Candidate', text: '[Processing audio...]' }]);
    }
  };

  const toggleRecording = () => isRecording ? stopRecording() : startRecording();

  const handleEndInterview = async () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    
    setIsAiSpeaking(true); 
    setTranscript(prev => [...prev, { speaker: 'System', text: 'Compiling interview data and generating strict feedback report. Please wait...' }]);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/analyze-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ transcript: transcript })
      });

      const analysisData = await response.json();
      if (response.ok) navigate(`/feedback/${analysisData._id}`, { state: { analysisData } });
      else throw new Error(analysisData.error);
    } catch (error) {
      console.error("Error analyzing interview:", error);
      alert("Failed to generate feedback. See console.");
      setIsAiSpeaking(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-6 font-sans relative bg-slate-950 overflow-hidden selection:bg-indigo-500/30 text-slate-50">
      
      {/* Background Graphic overlay */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none mix-blend-screen"
        style={{ backgroundImage: `url(${roomBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      ></div>

      {/* Top Navigation Bar */}
      <div className="flex justify-between items-center bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl shadow-xl border border-slate-800 mb-6 z-30 relative">
        <div className="flex items-center space-x-4">
          <img src={logo} alt="InterviewAI Logo" className="w-8 h-8 mr-1 drop-shadow-lg" />
          <div className="flex items-center space-x-2 bg-slate-800/80 px-4 py-1.5 rounded-full border border-slate-700">
            <div className={`w-2.5 h-2.5 rounded-full ${hasStarted && !isAiSpeaking && !isRecording ? 'bg-indigo-500 animate-pulse' : isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`}></div>
            <span className="text-slate-200 font-semibold text-sm tracking-wide">
              {hasStarted ? `Session Active (Q${questionCount}/${MAX_QUESTIONS})` : 'Waiting to Start'}
            </span>
          </div>
        </div>
        <span className="text-slate-400 font-medium text-sm">
          Target Role: <strong className="text-slate-200">Software Engineer</strong>
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-grow relative z-20">
        
        {/* Left Column: AI Interface */}
        <div className="flex-1 bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-3xl flex flex-col items-center justify-center p-8 relative overflow-hidden shadow-2xl">
          
          {!hasStarted && (
            <div className="absolute inset-0 z-40 bg-slate-950/80 flex flex-col items-center justify-center backdrop-blur-xl rounded-3xl border border-slate-800">
              <div className="w-20 h-20 mb-6 bg-indigo-500/20 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
              </div>
              <h2 className="text-slate-50 text-2xl font-bold mb-8 tracking-tight">Audio Calibrated.</h2>
              <button 
                onClick={beginInterviewSession}
                className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] text-white font-semibold rounded-xl text-lg transition-all transform hover:-translate-y-0.5 border border-indigo-400/30"
              >
                Initialize Session
              </button>
            </div>
          )}

          {/* Futuristic Visualizer */}
          <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Outer Glow Rings */}
            <div className={`absolute inset-0 rounded-full transition-all duration-1000 ${
              isRecording ? 'bg-red-500/20 shadow-[0_0_80px_rgba(239,68,68,0.4)] scale-110' : 
              isAiSpeaking ? 'bg-cyan-500/20 shadow-[0_0_80px_rgba(6,182,212,0.4)] scale-105 animate-pulse' : 
              'bg-indigo-500/5 shadow-[0_0_40px_rgba(99,102,241,0.1)]'
            }`}></div>
            
            {/* Core Orb */}
            <div className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-300 z-10 border ${
               isRecording ? 'bg-slate-900 border-red-500/50' : 
               isAiSpeaking ? 'bg-slate-900 border-cyan-500/50' : 
               'bg-slate-900 border-slate-700'
            }`}>
              <div className={`w-32 h-32 rounded-full blur-xl transition-all duration-300 absolute ${
                isRecording ? 'bg-red-500/40 animate-pulse' : 
                isAiSpeaking ? 'bg-cyan-500/40 animate-ping' : 'bg-transparent'
              }`}></div>
              
              <span className="text-slate-200 text-lg font-semibold tracking-widest relative z-20 uppercase">
                {isRecording ? 'Listening' : isAiSpeaking ? 'AI Active' : 'Standby'}
              </span>
            </div>
          </div>

          <div className="absolute bottom-10 flex space-x-6 z-30 w-full justify-center px-10">
            <button 
              onClick={toggleRecording}
              disabled={isAiSpeaking || !hasStarted}
              className={`flex-1 max-w-[240px] py-4 rounded-xl font-semibold text-white transition-all shadow-lg border flex items-center justify-center space-x-2 ${
                isRecording ? 'bg-red-500/20 hover:bg-red-500/30 border-red-500/50 text-red-100' : 
                isAiSpeaking || !hasStarted ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed' : 
                'bg-indigo-600/20 hover:bg-indigo-600/30 border-indigo-500/50 text-indigo-100'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-400 animate-pulse' : 'bg-indigo-400'}`}></div>
              <span>{isRecording ? 'Stop Recording' : 'Start Speaking'}</span>
            </button>
            
            <button 
              onClick={handleEndInterview}
              className="flex-1 max-w-[240px] py-4 rounded-xl font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
            >
              End Session
            </button>
          </div>
        </div>

        {/* Right Column: Glass Transcript Overlay */}
        <div 
          className={`w-full lg:w-[450px] bg-slate-900/80 backdrop-blur-2xl rounded-3xl flex flex-col shadow-2xl overflow-hidden border border-slate-800 transition-transform duration-700 ease-in-out ${
            hasStarted ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0 pointer-events-none'
          }`}
        >
          <div className="bg-slate-800/50 p-6 border-b border-slate-800">
            <h3 className="font-semibold text-slate-200 flex items-center tracking-tight">
              <svg className="w-5 h-5 mr-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
              Live Diagnostics
            </h3>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {transcript.map((entry, index) => (
              <div key={index} className={`flex flex-col ${entry.speaker === 'Candidate' || entry.speaker === 'System' ? 'items-end' : 'items-start'}`}>
                <span className="text-[11px] font-bold text-slate-500 mb-1.5 mx-1 uppercase tracking-wider">
                  {entry.speaker}
                </span>
                <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-md whitespace-pre-wrap text-sm leading-relaxed border ${
                  entry.speaker === 'Candidate' 
                    ? 'bg-indigo-600/20 text-indigo-100 border-indigo-500/30 rounded-tr-sm' 
                    : entry.speaker === 'System'
                    ? 'bg-slate-800/80 text-slate-300 border-slate-700 rounded-tr-sm italic'
                    : 'bg-slate-800 border-slate-700 text-slate-300 rounded-tl-sm'
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

// import { useState, useRef } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import roomBg from './assets/image_8.png';
// import logo from './assets/image_7.png';

// export default function InterviewRoom() {
//   const navigate = useNavigate();
//   const location = useLocation();
  
//   const initialAiMessage = location.state?.aiFeedback 
//     || "Hello! I have reviewed your resume. I will be your interviewer today. Let's begin with your first question.";

//   const [isRecording, setIsRecording] = useState(false);
//   const [isAiSpeaking, setIsAiSpeaking] = useState(false);
//   const [hasStarted, setHasStarted] = useState(false); 
//   const [questionCount, setQuestionCount] = useState(1);
//   const MAX_QUESTIONS = 8; 
  
//   const [transcript, setTranscript] = useState([
//     { speaker: 'AI', text: initialAiMessage }
//   ]);

//   const mediaRecorderRef = useRef(null);
//   const audioChunksRef = useRef([]);

//   const playAiVoice = (textToSpeak, onComplete = null) => {
//     setIsAiSpeaking(true);
    
//     if (!('speechSynthesis' in window)) {
//       console.error("Browser doesn't support text-to-speech!");
//       setIsAiSpeaking(false);
//       if (onComplete) onComplete();
//       return;
//     }

//     window.speechSynthesis.cancel();
//     const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
//     const voices = window.speechSynthesis.getVoices();
//     const preferredVoice = voices.find(v => v.lang.includes('en') && v.name.includes('Female')) || voices[0];
//     if (preferredVoice) {
//       utterance.voice = preferredVoice;
//     }

//     utterance.rate = 1.0; 
//     utterance.pitch = 1.0;

//     utterance.onend = () => {
//       setIsAiSpeaking(false);
//       if (onComplete) onComplete();
//     };

//     utterance.onerror = (e) => {
//       console.error("Speech error:", e);
//       setIsAiSpeaking(false);
//       if (onComplete) onComplete();
//     };

//     window.speechSynthesis.speak(utterance);
//   };

//   const beginInterviewSession = () => {
//     setHasStarted(true);
//     // FIXED: The AI now directly asks the generated first question instead of giving instructions!
//     playAiVoice(initialAiMessage);
//   };

//   const startRecording = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       const mediaRecorder = new MediaRecorder(stream);
//       mediaRecorderRef.current = mediaRecorder;
//       audioChunksRef.current = [];

//       mediaRecorder.ondataavailable = (event) => {
//         if (event.data.size > 0) {
//           audioChunksRef.current.push(event.data);
//         }
//       };

//       mediaRecorder.onstop = async () => {
//         const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
//         const formData = new FormData();
//         formData.append('audio', audioBlob, 'recording.webm');

//         try {
//           // REAL BACKEND CALL - Send Audio to Server securely
//           const token = localStorage.getItem('token');
//           const response = await fetch('http://localhost:5000/api/process-audio', {
//             method: 'POST',
//             headers: { 'Authorization': `Bearer ${token}` }, // ADDED SECURE TOKEN
//             body: formData,
//           });

//           const data = await response.json();

//           if (response.ok) {
//             setTranscript(prev => {
//               const updatedTranscript = [...prev];
//               updatedTranscript[updatedTranscript.length - 1] = { 
//                 speaker: 'Candidate', 
//                 text: data.candidateTranscript 
//               };
//               updatedTranscript.push({ 
//                 speaker: 'AI', 
//                 text: data.aiResponse 
//               });
//               return updatedTranscript;
//             });
            
//             if (questionCount >= MAX_QUESTIONS) {
//               const closingMessage = "Thank you for your time today. We have collected all your answers, and we will get back to you soon with the results.";
//               setTranscript(prev => [...prev, { speaker: 'AI', text: closingMessage }]);
              
//               playAiVoice(closingMessage, () => {
//                 handleEndInterview(); 
//               });
//             } else {
//               setQuestionCount(prev => prev + 1);
//               playAiVoice(data.spokenQuestion); 
//             }

//           } else {
//             throw new Error(data.error);
//           }
//         } catch (error) {
//           console.error("Error uploading audio to backend:", error);
//           setTranscript(prev => {
//             const updated = [...prev];
//             updated[updated.length - 1] = { speaker: 'System', text: `Error: ${error.message}` };
//             return updated;
//           });
//           setIsAiSpeaking(false);
//         }

//         stream.getTracks().forEach(track => track.stop());
//       };

//       mediaRecorder.start();
//       setIsRecording(true);

//     } catch (err) {
//       console.error("Microphone access denied or failed:", err);
//       alert("Please allow microphone access to use the interview room.");
//     }
//   };

//   const stopRecording = () => {
//     if (mediaRecorderRef.current && isRecording) {
//       mediaRecorderRef.current.stop(); 
//       setIsRecording(false);
//       setIsAiSpeaking(true); 
//       setTranscript(prev => [...prev, { speaker: 'Candidate', text: '[Processing audio...]' }]);
//     }
//   };

//   const toggleRecording = () => {
//     if (isRecording) {
//       stopRecording();
//     } else {
//       startRecording();
//     }
//   };

//   const handleEndInterview = async () => {
//     setIsAiSpeaking(true); 
//     setTranscript(prev => [...prev, { speaker: 'System', text: 'Compiling interview data and generating strict feedback report. Please wait...' }]);

//     try {
//       // REAL BACKEND CALL - Final Analysis securely
//       const token = localStorage.getItem('token');
//       const response = await fetch('http://localhost:5000/api/analyze-interview', {
//         method: 'POST',
//         headers: { 
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}` // ADDED SECURE TOKEN
//         },
//         body: JSON.stringify({ transcript: transcript })
//       });

//       const analysisData = await response.json();

//       if (response.ok) {
//         navigate('/feedback', { state: { analysisData } });
//       } else {
//         throw new Error(analysisData.error);
//       }
//     } catch (error) {
//       console.error("Error analyzing interview:", error);
//       alert("Failed to generate feedback. See console.");
//       setIsAiSpeaking(false);
//     }
//   };

//   return (
//     <div 
//       className="min-h-screen flex flex-col p-6 font-sans relative bg-cover bg-center overflow-hidden"
//       style={{ backgroundImage: `url(${roomBg})` }}
//     >
//       <div className="flex justify-between items-center bg-slate-800/90 backdrop-blur-md p-4 rounded-xl shadow-md mb-6 z-30">
//         <div className="flex items-center space-x-3">
//           <img src={logo} alt="InterviewAI Logo" className="w-8 h-8 mr-1" />
//           <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
//           <span className="text-white font-semibold">Live Session (Question {questionCount}/{MAX_QUESTIONS})</span>
//         </div>
//         <span className="text-slate-300 font-medium bg-slate-700 px-4 py-1 rounded-full">
//           Target Role: Software Engineer
//         </span>
//       </div>

//       <div className="flex flex-col lg:flex-row gap-6 flex-grow relative">
//         <div className="flex-1 rounded-2xl flex flex-col items-center justify-center p-8 relative overflow-hidden">
          
//           {!hasStarted && (
//             <div className="absolute inset-0 z-40 bg-slate-900/80 flex flex-col items-center justify-center backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl">
//               <h2 className="text-white text-3xl font-bold mb-6">Ready to Begin?</h2>
//               <button 
//                 onClick={beginInterviewSession}
//                 className="px-10 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold rounded-full text-xl shadow-xl transition-transform transform hover:scale-105"
//               >
//                 Start Interview
//               </button>
//             </div>
//           )}

//           <div className={`w-64 h-64 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl z-20 ${
//             isRecording ? 'bg-blue-500/20 shadow-blue-500/50' : 
//             isAiSpeaking ? 'bg-teal-500/20 shadow-teal-500/50' : 'bg-slate-800/60 backdrop-blur-sm border border-slate-700'
//           }`}>
//             <div className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-300 ${
//                isRecording ? 'bg-blue-600 animate-pulse' : 
//                isAiSpeaking ? 'bg-teal-500 animate-bounce' : 'bg-slate-700'
//             }`}>
//               <span className="text-white text-xl font-bold tracking-wider drop-shadow-md">
//                 {isRecording ? 'Listening...' : isAiSpeaking ? 'AI Speaking...' : 'Ready'}
//               </span>
//             </div>
//           </div>

//           <div className="absolute bottom-8 flex space-x-4 z-30">
//             <button 
//               onClick={toggleRecording}
//               disabled={isAiSpeaking || !hasStarted}
//               className={`px-8 py-3 rounded-full font-bold text-white transition-colors flex items-center space-x-2 shadow-lg border border-transparent ${
//                 isRecording ? 'bg-red-500 hover:bg-red-600' : 
//                 isAiSpeaking || !hasStarted ? 'bg-slate-700 cursor-not-allowed opacity-50 border-slate-600' : 'bg-blue-600 hover:bg-blue-700'
//               }`}
//             >
//               <span>{isRecording ? 'Stop Recording' : 'Start Speaking'}</span>
//             </button>
            
//             <button 
//               onClick={handleEndInterview}
//               className="px-8 py-3 rounded-full font-bold text-white bg-slate-800/90 hover:bg-slate-700 backdrop-blur-sm transition-colors border border-slate-600 shadow-lg"
//             >
//               End Interview
//             </button>
//           </div>
//         </div>

//         <div 
//           className={`w-[400px] absolute right-4 top-0 bottom-4 bg-white/95 backdrop-blur-md rounded-2xl flex flex-col shadow-2xl overflow-hidden border border-slate-200 z-30 transition-transform duration-700 ease-in-out ${
//             hasStarted ? 'translate-x-0' : 'translate-x-[120%]'
//           }`}
//         >
//           <div className="bg-slate-100/90 p-5 border-b border-slate-200">
//             <h3 className="font-bold text-slate-800 flex items-center text-lg">
//               <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
//               Live Transcript
//             </h3>
//           </div>
          
//           <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-transparent">
//             {transcript.map((entry, index) => (
//               <div key={index} className={`flex flex-col ${entry.speaker === 'Candidate' || entry.speaker === 'System' ? 'items-end' : 'items-start'}`}>
//                 <span className="text-xs font-bold text-slate-500 mb-1 mx-1 uppercase tracking-wider">
//                   {entry.speaker}
//                 </span>
//                 <div className={`max-w-[90%] rounded-2xl px-5 py-3 shadow-sm whitespace-pre-wrap text-sm leading-relaxed ${
//                   entry.speaker === 'Candidate' 
//                     ? 'bg-blue-600 text-white rounded-tr-sm' 
//                     : entry.speaker === 'System'
//                     ? 'bg-slate-800 text-white rounded-tr-sm'
//                     : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-md'
//                 }`}>
//                   {entry.text}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
