// src/components/Navbar.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import { Edit3, BarChart3, LogOut, User, Mail, Menu, X } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [location.pathname]); // Re-check on route change

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp > currentTime) {
          setIsAuthenticated(true);
          setEmail(decoded.email || decoded.username || 'User');
        } else {
          // Token expired
          handleLogout(false);
        }
      } catch (err) {
        console.error('Token decoding failed:', err);
        handleLogout(false);
      }
    } else {
      setIsAuthenticated(false);
    }
  };

  const handleLogout = (redirect = true) => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    setIsAuthenticated(false);
    setEmail('');
    setMobileMenuOpen(false);
    if (redirect) {
      navigate('/login');
    }
  };

  const isDripDashboard = location.pathname === '/drip-dashboard';
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow-lg border-b-4 border-gradient-to-r from-purple-600 to-pink-600">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Link 
            to={isAuthenticated ? "/campaigns" : "/login"}
            className="flex items-center gap-3 text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hover:scale-105 transition-transform"
          >
            <Mail size={40} className="text-purple-600" />
            <span className="hidden sm:inline">Email Marketing</span>
            <span className="sm:hidden">EMP</span>
          </Link>

          {isAuthenticated ? (
            <>
              <div className="hidden lg:flex items-center gap-6">
                <div className="flex items-center gap-6">
                  <Link 
                    to="/campaigns" 
                    className={`text-lg font-semibold transition-all ${
                      isActive('/campaigns') 
                        ? 'text-purple-600 border-b-4 border-purple-600 pb-1' 
                        : 'text-gray-700 hover:text-purple-600'
                    }`}
                  >
                    📧 Campaigns
                  </Link>
                  <Link 
                    to="/create" 
                    className={`text-lg font-semibold transition-all ${
                      isActive('/create') 
                        ? 'text-purple-600 border-b-4 border-purple-600 pb-1' 
                        : 'text-gray-700 hover:text-purple-600'
                    }`}
                  >
                    ✨ Create
                  </Link>
                  <Link 
                    to="/drip-builder" 
                    className={`text-lg font-semibold transition-all ${
                      isActive('/drip-builder') 
                        ? 'text-purple-600 border-b-4 border-purple-600 pb-1' 
                        : 'text-gray-700 hover:text-purple-600'
                    }`}
                  >
                    🚀 Drip Builder
                  </Link>
                </div>

                <div className="flex items-center gap-4">
                  <Link
                    to="/templates"
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-bold rounded-xl hover:scale-105 transition-all shadow-lg"
                  >
                    <Edit3 size={24} />
                    Templates
                  </Link>

                  {!isDripDashboard && (
                    <button
                      onClick={() => navigate("/drip-dashboard")}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg font-bold rounded-xl hover:scale-105 transition-all shadow-lg"
                    >
                      <BarChart3 size={24} />
                      Dashboard
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4 ml-4 pl-4 border-l-2 border-gray-300">
                  <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
                    <User size={20} className="text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">{email}</span>
                  </div>
                  <button
                    onClick={() => handleLogout(true)}
                    className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition font-medium"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-gray-700 hover:text-purple-600 transition"
              >
                {mobileMenuOpen ? <X size={32} /> : <Menu size={32} />}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link 
                to="/login" 
                className="text-lg text-gray-700 hover:text-purple-600 font-semibold transition"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:scale-105 transition font-semibold"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {isAuthenticated && mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t-2 border-gray-200 pt-4 space-y-4 animate-fadeIn">
            <Link 
              to="/campaigns" 
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-lg font-semibold transition ${
                isActive('/campaigns') 
                  ? 'bg-purple-100 text-purple-600' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              📧 Campaigns
            </Link>
            <Link 
              to="/create" 
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-lg font-semibold transition ${
                isActive('/create') 
                  ? 'bg-purple-100 text-purple-600' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              ✨ Create Campaign
            </Link>
            <Link 
              to="/drip-builder" 
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-lg font-semibold transition ${
                isActive('/drip-builder') 
                  ? 'bg-purple-100 text-purple-600' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              🚀 Drip Builder
            </Link>
            <Link 
              to="/templates" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:scale-105 transition text-center"
            >
              <Edit3 size={20} className="inline mr-2" />
              Templates
            </Link>
            {!isDripDashboard && (
              <button
                onClick={() => { navigate("/drip-dashboard"); setMobileMenuOpen(false); }}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:scale-105 transition text-center"
              >
                <BarChart3 size={20} className="inline mr-2" />
                Dashboard
              </button>
            )}

            <div className="mt-6 pt-4 border-t-2 border-gray-200">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg mb-3">
                <User size={20} className="text-purple-600" />
                <span className="text-sm font-medium text-gray-700">{email}</span>
              </div>
              <button
                onClick={() => handleLogout(true)}
                className="w-full flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-3 rounded-lg hover:bg-red-600 transition font-bold"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;