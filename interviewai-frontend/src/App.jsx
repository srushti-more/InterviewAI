import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/LandingPage';
import Auth from './pages/Auth';
import Dashboard from './pages/DashboardPage';
import InterviewRoom from './pages/InterviewRoom';
import Feedback from './pages/FeedbackPage'; // Assuming you have this from earlier

// A simple security guard component to protect private routes
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/auth" />;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        
        {/* Protected Routes - Only accessible if logged in */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/interview" element={<PrivateRoute><InterviewRoom /></PrivateRoute>} />
        <Route path="/feedback/:id" element={<PrivateRoute><Feedback /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}