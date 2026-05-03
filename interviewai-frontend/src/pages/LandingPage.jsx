import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './assets/image_7.png'; 

const taglines = [
  "Turn interview anxiety into unstoppable confidence.",
  "The ultimate AI prep for ambitious students & professionals.",
  "Compete with yourself. Conquer your next interview.",
  "Elevate your career with real-time AI feedback."
];

export default function Landing() {
  const [taglineIndex, setTaglineIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    setTaglineIndex(Math.floor(Math.random() * taglines.length));
    const interval = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % taglines.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-center p-6 relative overflow-hidden font-sans selection:bg-indigo-500/30">
      
      {/* Ambient Lighting FX */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-600 rounded-full mix-blend-multiply filter blur-[150px] opacity-20 animate-pulse duration-10000 pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-cyan-500 rounded-full mix-blend-multiply filter blur-[150px] opacity-20 animate-pulse duration-[12000ms] pointer-events-none"></div>

      <div className="z-10 flex flex-col items-center max-w-4xl w-full">
        
        {/* Brand Badge */}
        <div className="flex items-center space-x-3 mb-10 bg-slate-900/50 px-6 py-2.5 rounded-full backdrop-blur-xl border border-slate-800 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <img src={logo} alt="Logo" className="w-8 h-8 drop-shadow-lg" />
          <span className="text-xl font-bold text-slate-100 tracking-wider">InterviewAI</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-extrabold text-slate-50 mb-8 leading-tight tracking-tight">
          Master the <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 drop-shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            Interview.
          </span>
        </h1>
        
        {/* Dynamic Tagline */}
        <p className="text-xl md:text-2xl text-slate-400 mb-14 h-16 transition-all duration-700 font-medium max-w-2xl leading-relaxed">
          {taglines[taglineIndex]}
        </p>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 w-full sm:w-auto">
          {/* Primary Action Button */}
          <button 
            onClick={() => navigate('/auth', { state: { mode: 'register' } })}
            className="px-10 py-4 bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] text-white font-semibold rounded-xl text-lg transition-all transform hover:-translate-y-1 w-full sm:w-auto border border-indigo-400/30"
          >
            Get Started Free
          </button>
          
          {/* Secondary Ghost Button */}
          <button 
            onClick={() => navigate('/auth', { state: { mode: 'login' } })}
            className="px-10 py-4 bg-slate-900/50 hover:bg-slate-800 text-slate-200 font-semibold rounded-xl text-lg backdrop-blur-md border border-slate-700 hover:border-slate-600 transition-all w-full sm:w-auto"
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
}