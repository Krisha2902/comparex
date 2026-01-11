import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function LoginSignup({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(false); // Start with signup first
  // Get the intended destination from location state
  const from = location.state?.from || "/";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [identifier, setIdentifier] = useState(""); // Can be email or phone
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!isLogin) {
        // Signup flow
        if (password !== confirmPassword) {
          alert("Passwords do not match!");
          setLoading(false);
          return;
        }

        if (!name || !email || !phone || !password) {
          alert("Please fill all fields!");
          setLoading(false);
          return;
        }

        const res = await fetch("http://localhost:5000/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, phone, password }),
        });

        let data;
        try {
          data = await res.json();
        } catch (jsonError) {
          throw new Error(`Server error: ${res.status} ${res.statusText}`);
        }

        if (res.ok) {
          alert("Signup successful! Please login.");
          // Clear form and switch to login
          setName("");
          setPhone("");
          setPassword("");
          setConfirmPassword("");
          setIsLogin(true);
        } else {
          alert(data.message || data.error || "Signup failed");
        }
      } else {
        // Login flow
        if (!identifier || !password) {
          alert("Please fill all fields!");
          setLoading(false);
          return;
        }

        const res = await fetch("http://localhost:5000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, password }),
        });

        let data;
        try {
          data = await res.json();
        } catch (jsonError) {
          throw new Error(`Server error: ${res.status} ${res.statusText}`);
        }

        if (res.ok && data.token) {
          localStorage.setItem("token", data.token);
          if (data.user) {
            localStorage.setItem("userEmail", data.user.email);
            localStorage.setItem("userName", data.user.name);
          }
          if (onLogin) onLogin();
          // Redirect to intended destination or home page
          navigate(from, { replace: true });
        } else {
          alert(data.message || data.error || "Login failed");
        }
      }
    } catch (error) {
      console.error("Error details:", error);
      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        alert("Cannot connect to server. Please make sure the backend server is running on http://localhost:5000");
      } else {
        alert(error.message || "Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

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
          <form onSubmit={handleSubmit} className="space-y-4">

            {!isLogin ? (
              <>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number (e.g. 9876543210)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </>
            ) : (
              <input
                type="text"
                placeholder="Email or Phone Number"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            )}

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
              required
            />

            {!isLogin && (
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            )}

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
            </button>
          </form>

          {/* TOGGLE */}
          <div className="text-center text-sm text-slate-600 mt-6">
            {isLogin ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => {
                    setIsLogin(false);
                    setIdentifier("");
                    setPassword("");
                  }}
                  className="text-blue-600 hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setIsLogin(true);
                    setName("");
                    setEmail("");
                    setPhone("");
                    setConfirmPassword("");
                  }}
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
