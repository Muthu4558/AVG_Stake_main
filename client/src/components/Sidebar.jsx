import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import icon from "../assets/icon.png";

const Sidebar = () => {

  const navigate = useNavigate();
  const location = useLocation();

  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const toggleSidebar = () => {
    setMobileOpen(!mobileOpen);
  };

  const go = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* HAMBURGER */}
      {!mobileOpen && (
        <div className="hamburger" onClick={() => setMobileOpen(true)}>
          ☰
        </div>
      )}

      {/* SIDEBAR */}
      <div className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>

        {/* CLOSE BUTTON RIGHT */}
        <div className="sidebar-close" onClick={() => setMobileOpen(false)}>
          ✕
        </div>

        {/* LOGO */}
        <div className="logo">
          <img src={icon} alt="AVG" />
          <span className="brand-name">AVG</span>
        </div>

        {/* MAIN */}
        <p className="section-label">MAIN</p>

        <div
          className={`menu-item ${isActive("/dashboard") ? "active-gradient" : ""}`}
          onClick={() => go("/dashboard")}
        >
          Dashboard
        </div>

        {/* MANAGEMENT */}
        <p className="section-label">MANAGEMENT</p>

        <div className="menu-item" onClick={() => toggleMenu("user")}>
          User Management ▾
        </div>

        {openMenu === "user" && (
          <div className="submenu">
            <div
              className={`submenu-item ${isActive("/dashboard/users") ? "active-gradient" : ""}`}
              onClick={() => go("/dashboard/users")}
            >
              Users
            </div>

            <div
              className={`submenu-item ${isActive("/dashboard/referral") ? "active-gradient" : ""}`}
              onClick={() => go("/dashboard/referral")}
            >
              Referral
            </div>

            <div
              className={`submenu-item ${isActive("/dashboard/bank") ? "active-gradient" : ""}`}
              onClick={() => go("/dashboard/bank")}
            >
              Bank
            </div>
          </div>
        )}

        <div
          className={`menu-item ${isActive("/dashboard/plans") ? "active-gradient" : ""}`}
          onClick={() => go("/dashboard/plans")}
        >
          Plans
        </div>

        <div
          className={`menu-item ${isActive("/dashboard/activeplans") ? "active-gradient" : ""}`}
          onClick={() => go("/dashboard/activeplans")}
        >
          Active Plans
        </div>

        {/* HISTORY */}
        <p className="section-label">HISTORY</p>

        <div className="menu-item" onClick={() => toggleMenu("transactions")}>
          Transactions ▾
        </div>

        {openMenu === "transactions" && (
          <div className="submenu">
            <div
              className={`submenu-item ${isActive("/dashboard/deposit") ? "active-gradient" : ""}`}
              onClick={() => go("/dashboard/deposit")}
            >
              Deposit
            </div>

            <div
              className={`submenu-item ${isActive("/dashboard/withdraw") ? "active-gradient" : ""}`}
              onClick={() => go("/dashboard/withdraw")}
            >
              Withdraw
            </div>

            <div
              className={`submenu-item ${isActive("/dashboard/all") ? "active-gradient" : ""}`}
              onClick={() => go("/dashboard/all")}
            >
              All Transactions
            </div>
          </div>
        )}

        <div className="menu-item" onClick={() => toggleMenu("earnings")}>
          Earnings ▾
        </div>

        {openMenu === "earnings" && (
          <div className="submenu">
            <div
              className={`submenu-item ${isActive("/dashboard/roi") ? "active-gradient" : ""}`}
              onClick={() => go("/dashboard/roi")}
            >
              ROI
            </div>

            <div
              className={`submenu-item ${isActive("/dashboard/direct") ? "active-gradient" : ""}`}
              onClick={() => go("/dashboard/direct")}
            >
              Direct
            </div>

            <div
              className={`submenu-item ${isActive("/dashboard/level") ? "active-gradient" : ""}`}
              onClick={() => go("/dashboard/level")}
            >
              Level
            </div>
          </div>
        )}

        <div
          className={`menu-item ${isActive("/dashboard/rewards") ? "active-gradient" : ""}`}
          onClick={() => go("/dashboard/rewards")}
        >
          Reward
        </div>

        {/* CONFIGURATION */}
        <p className="section-label">CONFIGURATION</p>

        <div className="menu-item" onClick={() => toggleMenu("config")}>
          Configuration ▾
        </div>

        {openMenu === "config" && (
          <div className="submenu">
            <div
              className={`submenu-item ${isActive("/dashboard/config-level") ? "active-gradient" : ""}`}
              onClick={() => go("/dashboard/config-level")}
            >
              Level
            </div>

            <div
              className={`submenu-item ${isActive("/dashboard/config-unlock") ? "active-gradient" : ""}`}
              onClick={() => go("/dashboard/config-unlock")}
            >
              Level Unlock
            </div>

            <div
              className={`submenu-item ${isActive("/dashboard/config-rank") ? "active-gradient" : ""}`}
              onClick={() => go("/dashboard/config-rank")}
            >
              Rank
            </div>
          </div>
        )}

        {/* ACCOUNT */}
        <p className="section-label">ACCOUNT</p>

        <div className="menu-item" onClick={() => toggleMenu("account")}>
          Account ▾
        </div>

        {openMenu === "account" && (
          <div className="submenu">
            <div
              className={`submenu-item ${isActive("/dashboard/profile") ? "active-gradient" : ""}`}
              onClick={() => go("/dashboard/profile")}
            >
              My Profile
            </div>

            <div
              className={`submenu-item ${isActive("/dashboard/support") ? "active-gradient" : ""}`}
              onClick={() => go("/dashboard/support")}
            >
              Support Ticket
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default Sidebar;