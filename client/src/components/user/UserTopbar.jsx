import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import API from "../../utils/api";
import { toast } from "react-hot-toast";
import Logo from "../../assets/logo.png"

const Topbar = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, roiRes, summaryRes] = await Promise.all([
          API.get("/users/me"),
          API.get("/user-plans/my-total-roi"),   // ✅ ROI (same as dashboard)
          API.get("/withdrawals/summary"),       // ✅ Direct + Level
        ]);

        setUser(profileRes.data);

        // ✅ GET VALUES
        const roi = Number(roiRes.data.roi || 0);
        const direct = Number(summaryRes.data.directReferral || 0);
        const level = Number(summaryRes.data.level || 0);

        // ✅ TOTAL WALLET
        const totalWallet = roi + direct + level;

        setWallet(totalWallet);

      } catch (err) {
        console.error("Topbar fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    // 🔥 Clear auth data
    localStorage.removeItem("token");
    localStorage.removeItem("role");

    // ✅ Show toast
    toast.success("Logged out successfully 👋");

    // ⏳ Small delay so user sees toast
    setTimeout(() => {
      navigate("/");
    }, 800);
  };

  return (
    <div className="utb-container">

      {/* LEFT */}
      <div className="utb-left">

        <div className="ut-brand">
          <img src={Logo} width={40} alt="logo" />
          <h2 className="utb-app-name">AVG</h2>
        </div>
      </div>

      {/* RIGHT */}
      <div className="utb-right">

        {/* USER INFO */}
        <div className="utb-user-info">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              <p className="utb-username">
                {user?.name || "User"}
              </p>
              <p className="utb-referral">
                Referral Code: {user?.user_code || "N/A"}
              </p>

              <p className="utb-wallet">
                Wallet Balance: ${wallet.toFixed(2)}
              </p>
            </>
          )}
        </div>

        <button
          className="utb-toggle"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>

      </div>
    </div>
  );
};

export default Topbar;