import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/api";
import { Link } from "react-router-dom";

// src/pages/Signup.jsx
export default function Signup() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    
    // Clear error when user starts typing
    if (error) {
      setError("");
    }
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
        authService.setAuthToken(token);
        navigate("/login");
      }
    } catch (err) {
      setError("An error occurred during signup");
      console.error("Signup error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="bg-green-900 text-white p-10 rounded-md shadow-md w-[460px]">
        <h1 className="text-4xl font-bold mb-8">Sign Up</h1>
        {error && (
          <div className="bg-red-600 text-white p-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded bg-white text-gray-900 focus:outline-none border border-gray-300"
              required
            />
          </div>
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
            <label className="block text-sm font-medium mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded bg-white text-gray-900 focus:outline-none border border-gray-300"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={formData.address}
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
              className={`w-full px-3 py-2 rounded bg-white text-gray-900 focus:outline-none border ${
                error === "Passwords do not match"
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              required
              minLength="6"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded bg-white text-gray-900 focus:outline-none border ${
                error === "Passwords do not match"
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              required
              minLength="6"
            />
            {error === "Passwords do not match" && (
              <p className="mt-1 text-sm text-red-300">
                Passwords do not match
              </p>
            )}
          </div>
          <button
            type="submit"
            className="w-full mt-6 bg-white text-green-900 font-semibold py-2 rounded hover:bg-gray-100 transition cursor-pointer"
          >
            Create Account
          </button>
          <p className="mt-4 text-sm">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold hover:underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
