import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/signup.css"; // Import CSS styles

const UserForm = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    dateOfJoining: "",
    profileImage: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: type === "checkbox" ? (checked ? "admin" : "employee") : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:5000/api/auth/signup", user);
      alert(`${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Created!`);
      navigate("/");
    } catch (error) {
      alert("Error creating user: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit} className="user-form">
        <h2>Create User</h2>
        <input type="text" name="name" placeholder="Name" onChange={handleChange} required />
        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} required />

        <label className="checkbox-label">
          <input type="checkbox" checked={user.role === "admin"} onChange={handleChange} />
          Admin
        </label>

        {user.role === "employee" && (
          <>
            <input type="date" name="dateOfJoining" onChange={handleChange} required />
            <input type="text" name="profileImage" placeholder="Profile Image URL" onChange={handleChange} />
          </>
        )}

        <button type="submit">Create User</button>
      </form>
    </div>
  );
};

export default UserForm;
