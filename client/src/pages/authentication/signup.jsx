import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/api";
import { Link } from "react-router-dom";

// src/pages/Signup.jsx
export default function Signup() {
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = authService.getAuthToken();
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const userProfile = await authService.getUserProfile();
        
        // Only role 3 (Account Manager) can access this page
        if (userProfile.role !== 3) {
          navigate('/dashboard');
          return;
        }
        
        setUserRole(userProfile);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        authService.setAuthToken(null);
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = () => {
    authService.setAuthToken(null);
    navigate('/login');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    
    // Clear messages when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Password matching validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Other validations
    if (
      !formData.name ||
      !formData.username ||
      !formData.email ||
      !formData.phone ||
      !formData.address ||
      !formData.password
    ) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      const { token, error } = await authService.signup({
        name: formData.name,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        password: formData.password,
      });

      if (error) {
        setError(error.msg || "Signup failed");
        return;
      }

      if (token) {
        setError("");
        alert("Staff account created successfully!");
        // Reset form
        setFormData({
          name: "",
          username: "",
          email: "",
          phone: "",
          address: "",
          password: "",
          confirmPassword: "",
        });
      }
    } catch (err) {
      console.error("Signup error:", err);
      
      // Extract error message from server response
      if (err.response?.data?.msg) {
        setError(err.response.data.msg);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("An error occurred during signup");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!userRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <a href="/dashboard" className="text-2xl font-bold text-gray-900">BAFCI</a>
              <div className="ml-8 flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  <p className="font-medium">Account Manager</p>
                  <p className="text-xs">Welcome, {userRole.name}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center py-10 px-4">
        <div className="bg-white p-10 rounded-md shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Create Staff Account</h2>
          <p className="text-gray-600 mb-6 text-sm">
            Use this form to create new staff accounts. Staff cannot self-register.
          </p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Username</label>
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Phone Number</label>
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Address</label>
              <input
                type="text"
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Password</label>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                minLength="6"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                minLength="6"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full mt-6 bg-green-900 text-white font-semibold py-2 rounded hover:bg-green-800 transition cursor-pointer ${
                isLoading ? "opacity-75" : ""
              }`}
            >
              {isLoading ? "Creating Account..." : "Create Staff Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
