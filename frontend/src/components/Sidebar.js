import React from "react";

function Sidebar() {
  return (
    <div className="bg-primary text-white p-3 vh-100">
      <h5 className="mb-4">Dashboard</h5>
      <ul className="nav flex-column">
        <li className="nav-item mb-2">
          <span className="nav-link text-white">Predict Risk</span>
        </li>
        <li className="nav-item mb-2">
          <span className="nav-link text-white">Model Info</span>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
