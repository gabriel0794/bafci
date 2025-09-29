// src/pages/Login.jsx
import { useState } from "react";
import { Link } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ username, password });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="bg-green-900 text-white p-10 rounded-md shadow-md w-96">
        <h1 className="text-4xl font-bold mb-8">Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="username"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 rounded bg-white text-gray-900 focus:outline-none border border-gray-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded bg-white text-gray-900 focus:outline-none border border-gray-300"
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
            Don’t have an account?{" "}
            <Link to="/signup" className="font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
