import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/login.css"
const Login = () => {
  const navigate = useNavigate();

  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    role: "employee",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? "admin" : "employee") : value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const { data } = await axios.post("http://localhost:5000/api/auth/login", credentials);
      localStorage.setItem("token", data.token);
      alert("Login successful!");
      navigate("/dashboard");
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleLogin} className="login-form">
        <h2>Login</h2>
        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} required />

        <label className="checkbox-label">
          <input type="checkbox" checked={credentials.role === "admin"} onChange={handleChange} />
          Admin
        </label>

        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
