import "./App.css";
import { NavLink, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import Login from "./pages/Login.jsx";
import Users from "./pages/Users.jsx";

function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">BeautyPlug</p>
          <h1 className="brand-title">Beauty services admin</h1>
        </div>
        <nav className="nav-bar">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/contact">Contact</NavLink>
          <NavLink to="/users">Users</NavLink>
          <NavLink to="/login">Login</NavLink>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/users" element={<Users />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </div>
  );
}

export default App;
