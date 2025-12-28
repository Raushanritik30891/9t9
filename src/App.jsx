import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ScrollToTop from './components/ScrollToTop';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Login from './pages/Login'; 
import AdminLogin from './pages/AdminLogin';
import Contact from './pages/Contact';
import About from './pages/About';

function App() {
  return (
    <Router>
      <ScrollToTop />
      
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<About />} />
        
        {/* LOGIN ROUTES */}
        <Route path="/login" element={<Login />} />
        
        {/* ADMIN & PROTECTED */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>

      {/* ✅ UPDATED TOASTER: Ab Success Green aur Error Red dikhega */}
      <Toaster 
        position="top-center" 
        reverseOrder={false}
        toastOptions={{
          // Default Dark Theme Style
          style: {
            background: '#1a1a1a', // Black/Dark Grey
            color: '#fff',
            border: '1px solid #333',
            padding: '16px',
            fontSize: '14px',
          },
          // Success messages ke liye specific style
          success: {
            iconTheme: {
              primary: '#00ff41', // Brand Green
              secondary: 'black',
            },
          },
        }} 
      />
    </Router>
  );
}

export default App;