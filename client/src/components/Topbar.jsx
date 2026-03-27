import React from "react";
import { useNavigate } from "react-router-dom";
import icon from "../assets/icon.png";
import { toast } from "react-hot-toast";

const Topbar = () => {
  const navigate = useNavigate();

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
    <div className="topbar">

      {/* LEFT SIDE */}
      <div className="topbar-left">
        {/* <img src={icon} alt="logo" />
        <span className="brand-name">AVG Admin</span> */}
      </div>

      {/* RIGHT SIDE */}
      <div className="admin-info">
        <span className="admin-name">Admin</span>
        <span className="wallet">Wallet Balance: ₹0.00</span>
      </div>

      <div>
        {/* ✅ Logout Button */}
        <button
          onClick={handleLogout}
          style={{
            // marginLeft: "15px",
            padding: "6px 12px",
            background: "#ff4d4f",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

    </div>
  );
};

export default Topbar;




// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import API from "../utils/api";
// import icon from "../assets/icon.png";

// const Topbar = () => {
//   const navigate = useNavigate();
//   const [wallet, setWallet] = useState(0);

//   const handleLogout = () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("role");
//     navigate("/");
//   };

//   useEffect(() => {
//     const fetchWallet = async () => {
//       try {
//         const res = await API.get("/users/admin/wallet");

//         setWallet(res.data.total || 0);

//       } catch (err) {
//         console.error("Admin wallet error:", err);
//       }
//     };

//     fetchWallet();
//   }, []);

//   return (
//     <div className="topbar">

//       {/* LEFT */}
//       <div className="topbar-left">
//         {/* <img src={icon} alt="logo" />
//         <span className="brand-name">AVG Admin</span> */}
//       </div>

//       {/* RIGHT */}
//       <div className="admin-info">
//         <span className="admin-name">Admin</span>
//         <span className="wallet">
//           Wallet Balance: ₹{Number(wallet).toFixed(2)}
//         </span>
//       </div>

//       <div>
//         <button
//           onClick={handleLogout}
//           style={{
//             padding: "6px 12px",
//             background: "#ff4d4f",
//             color: "#fff",
//             border: "none",
//             borderRadius: "5px",
//             cursor: "pointer",
//           }}
//         >
//           Logout
//         </button>
//       </div>

//     </div>
//   );
// };

// export default Topbar;