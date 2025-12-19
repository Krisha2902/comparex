import { useState } from "react";
import Navbar from "../components/Navbar";

export default function LoginSignup() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gradient-to-b from-[#f3f9fd] to-[#eaf6ff] flex items-center justify-center px-4">

        <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">

          {/* TITLE */}
          <h2 className="text-2xl font-semibold text-blue-600 text-center mb-2">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>

          <p className="text-sm text-slate-500 text-center mb-6">
            {isLogin
              ? "Login to continue using ValueVue"
              : "Sign up to track prices and save products"}
          </p>

          {/* FORM */}
          <form className="space-y-4">

            {!isLogin && (
              <input
                type="text"
                placeholder="Full Name"
                className="w-full border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
              />
            )}

            <input
              type="email"
              placeholder="Email Address"
              className="w-full border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
            />

            {!isLogin && (
              <input
                type="password"
                placeholder="Confirm Password"
                className="w-full border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
              />
            )}

            {/* BUTTON */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              {isLogin ? "Login" : "Sign Up"}
            </button>
          </form>

          {/* TOGGLE */}
          <div className="text-center text-sm text-slate-600 mt-6">
            {isLogin ? (
              <>
                Don’t have an account?{" "}
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-blue-600 hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setIsLogin(true)}
                  className="text-blue-600 hover:underline"
                >
                  Login
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
