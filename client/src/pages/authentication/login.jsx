import { useState } from "react";
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/api';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const { token, error } = await authService.login(formData);

      if (error) {
        setError(error.msg || 'Login failed');
        return;
      }

      if (token) {
        authService.setAuthToken(token);
        navigate('/dashboard'); // Redirect to dashboard after successful login
      }
    } catch (err) {
      setError('An error occurred during login');
      console.error('Login error:', err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="bg-green-900 text-white p-10 rounded-md shadow-md w-96">
        <h1 className="text-4xl font-bold mb-8">Login</h1>
        {error && (
          <div className="bg-red-600 text-white p-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded bg-white text-gray-900 focus:outline-none border border-gray-300"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded bg-white text-gray-900 focus:outline-none border border-gray-300"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full mt-5 bg-white text-green-900 font-semibold py-2 rounded hover:bg-gray-100 transition cursor-pointer"
          >
            Login
          </button>
        </form>

        <div className="mt-4 text-sm">
          <a href="#" className="block text-gray-200 hover:underline">
            Forgot Password?
          </a>
          <p className="mt-2">
            Don't have an account?{" "}
            <Link to="/signup" className="font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}