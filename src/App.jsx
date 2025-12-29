import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ScrollToTop from './components/ScrollToTop';

// Pages Imports
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Login from './pages/Login'; 
import AdminLogin from './pages/AdminLogin';
import Contact from './pages/Contact';
import About from './pages/About';

// ✅ NEW PAGES IMPORTS (Ye add kiye hain)
import Leaderboard from './pages/Leaderboard';
import Blog from './pages/Blog';
import { Privacy, Terms } from './pages/Legal';

function App() {
  return (
    <Router>
      <ScrollToTop />
      
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<About />} />
        
        {/* ✅ NEW FOOTER & NAVBAR ROUTES (Ye connect kiye hain) */}
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />

        {/* LOGIN ROUTES */}
        <Route path="/login" element={<Login />} />
        
        {/* ADMIN & PROTECTED */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>

      {/* TOASTER CONFIGURATION */}
      <Toaster 
        position="top-center" 
        reverseOrder={false}
        toastOptions={{
          style: {
            background: '#1a1a1a', 
            color: '#fff',
            border: '1px solid #333',
            padding: '16px',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#00ff41', 
              secondary: 'black',
            },
          },
        }} 
      />
    </Router>
  );
}

export default App;