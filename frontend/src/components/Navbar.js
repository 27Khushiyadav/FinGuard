import React from "react";
import logo from "../assets/logo.png";

function Navbar({ handleLogout }) {
  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark px-4"
      style={{
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(10px)"
      }}
    >
      <a className="navbar-brand d-flex align-items-center" href="#">
        <img
          src={logo}
          alt="logo"
          width="40"
          height="40"
          className="me-2"
        />
        Audit Risk Platform
      </a>

      <div className="ms-auto">
        <button
          className="btn btn-outline-light"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
