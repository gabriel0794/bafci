import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../../services/api";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
  
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }
  
    setIsLoading(true);
  
    try {
      const response = await authService.login({
        email: formData.email,
        password: formData.password,
      });
  
      if (response.token) {
        authService.setAuthToken(response.token);
        navigate("/dashboard");
      } else {
        setError(response.error || "Login failed. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      
      if (err.response?.status === 400) {
        const errorMsg = err.response.data?.error || err.response.data?.message;
        setError(errorMsg || "Invalid email or password");
      } else if (err.message === "Network Error") {
        setError("Cannot connect to the server. Please check your connection.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="bg-green-900 text-white p-10 rounded-md shadow-md w-96">
        <h1 className="text-4xl font-bold mb-8">Login</h1>
        {error && (
          <div className="bg-red-600 text-white p-3 rounded mb-4 text-sm flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
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
              className={`w-full px-3 py-2 rounded bg-white text-gray-900 focus:outline-none border ${
                error && error !== "Invalid email or password"
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              required
              disabled={isLoading}
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
                error && error !== "Invalid email or password"
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              required
              disabled={isLoading}
            />
            {error === "Invalid email or password" && (
              <p className="mt-1 text-sm text-red-300">
                <Link to="/forgot-password" className="hover:underline">
                  Forgot your password?
                </Link>
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full mt-5 bg-white text-green-900 font-semibold py-2 rounded hover:bg-gray-100 transition cursor-pointer flex justify-center items-center ${
              isLoading ? "opacity-75" : ""
            }`}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-900"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <div className="mt-4 text-sm text-center">
          <p className="text-gray-300">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-white hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
