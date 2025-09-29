import { Link } from "react-router-dom";

// src/pages/Signup.jsx
export default function Signup() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="bg-green-900 text-white p-10 rounded-md shadow-md w-[460px]">
        <h1 className="text-4xl font-bold mb-8">Sign Up</h1>
        <form onSubmit={null} className="space-y-1">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="Name"
              placeholder="Name"
              className="w-full px-3 py-2 rounded bg-white text-gray-900 focus:outline-none border border-gray-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              placeholder="Email"
              className="w-full px-3 py-2 rounded bg-white text-gray-900 focus:outline-none border border-gray-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input
              type="phone"
              placeholder="Phone Number"
              className="w-full px-3 py-2 rounded bg-white text-gray-900 focus:outline-none border border-gray-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <input
              type="address"
              placeholder="Address"
              className="w-full px-3 py-2 rounded bg-white text-gray-900 focus:outline-none border border-gray-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              placeholder="Password"
              className="w-full px-3 py-2 rounded bg-white text-gray-900 focus:outline-none border border-gray-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full px-3 py-2 rounded bg-white text-gray-900 focus:outline-none border border-gray-300"
            />
          </div>
          <button
            type="submit"
            className="w-full mt-6 bg-white text-green-900 font-semibold py-2 rounded hover:bg-gray-100 transition cursor-pointer"
          >
            Create Account
          </button>
          <p className="mt-4 text-sm">
            Already have an account?{" "}
            <Link to="/" className="font-semibold hover:underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
