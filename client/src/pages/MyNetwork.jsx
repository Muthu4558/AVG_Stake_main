import React, { useState, useEffect } from "react";
import Sidebar from "../components/user/UserSidebar";
import Topbar from "../components/user/UserTopbar";
import axios from "axios";
import toast from "react-hot-toast";

/* ================= TREE NODE ================= */
const TreeNode = ({ node }) => {
  const [open, setOpen] = useState(true);

  if (!node) return null;

  return (
    <div className="treeNode">

      <div className="treeCard" onClick={() => setOpen(!open)}>
        <div className="treeAvatar">
          {(node.name || "U")[0]}
        </div>

        <div className="treeInfo">
          <h4>{node.name || "-"} {node.lastname || "-"}</h4>
          <p>{node.id || "-"}</p>
        </div>

        <div className="treeWallet">
          ₹{node.wallet || 0}
        </div>

        {node.children?.length > 0 && (
          <div className={`treeToggle ${open ? "open" : ""}`}>
            ▼
          </div>
        )}
      </div>

      {node.children && open && (
        <div className="treeChildren">
          {node.children.map((child, i) => (
            <TreeNode key={i} node={child} />
          ))}
        </div>
      )}
    </div>
  );
};

/* ================= MAIN ================= */
const MyNetwork = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState(null);
  const [zoom, setZoom] = useState(1);

  const API = "http://localhost:5000/api/users";

  // ================= FETCH =================
  const fetchNetwork = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API}/my-network`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setData(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load network");
    }
  };

  useEffect(() => {
    fetchNetwork();
  }, []);

  // ================= ZOOM FUNCTIONS =================
  const zoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.2, 2));
  };

  const zoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.2, 0.5));
  };

  const resetZoom = () => {
    setZoom(1);
  };

  // ================= MOUSE WHEEL ZOOM =================
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        if (e.deltaY < 0) zoomIn();
        else zoomOut();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <div className="treeLayout">

      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className="treeMain">
        <Topbar isOpen={isOpen} setIsOpen={setIsOpen} />

        <div className="treeContent">
          <h2 className="treeTitle">Referral Tree</h2>

          {/* ZOOM CONTROLS */}
          <div className="zoomControls">
            <button onClick={zoomOut}>-</button>
            <span>{Math.round(zoom * 100)}%</span>
            <button onClick={zoomIn}>+</button>
            <button onClick={resetZoom}>Reset</button>
          </div>

          <div
            className="treeWrapper"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top center",
              transition: "0.3s ease",
            }}
          >
            {data ? (
              <TreeNode node={data} />
            ) : (
              <p style={{ textAlign: "center" }}>Loading network...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyNetwork;