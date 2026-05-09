import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from './assets/image_7.png';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.state?.mode !== 'register');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        if (isLogin) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          navigate('/dashboard'); 
        } else {
          setIsLogin(true);
          setFormData({ ...formData, password: '' });
          alert("Account created! Please log in.");
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle Ambient Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="bg-slate-900/60 backdrop-blur-xl max-w-md w-full rounded-2xl shadow-2xl border border-slate-800 p-8 z-10">
        <div className="flex justify-center mb-8 relative">
          <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 rounded-full"></div>
          <img src={logo} alt="Logo" className="w-12 h-12 relative z-10 drop-shadow-lg" />
        </div>
        
        <h2 className="text-2xl font-semibold text-center text-slate-50 mb-8 tracking-tight">
          {isLogin ? 'Welcome back' : 'Create your account'}
        </h2>

        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm font-medium mb-6 text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
              <input 
                type="text" required 
                className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-50 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Username"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
            <input 
              type="email" required 
              className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-50 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
              onChange={e => setFormData({...formData, email: e.target.value})}
              placeholder="you@company.com"
            />
          </div>
          <div> 
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
            <input 
              type="password" required 
              className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-50 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
              onChange={e => setFormData({...formData, password: e.target.value})}
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] transition-all mt-4 border border-indigo-500/50"
          >
            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>

        <p className="text-center text-slate-400 mt-8 text-sm font-medium">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-indigo-400 hover:text-indigo-300 hover:underline font-semibold transition-colors">
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}