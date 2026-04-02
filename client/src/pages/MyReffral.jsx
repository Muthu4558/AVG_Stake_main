import React, { useState, useEffect } from "react";
import Sidebar from "../components/user/UserSidebar";
import Topbar from "../components/user/UserTopbar";
import axios from "axios";
import toast from "react-hot-toast";

const MyReferral = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [dateRange, setDateRange] = useState("Today");
  const [showFilter, setShowFilter] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    count: "",
  });

  const [data, setData] = useState([]);

  const API = "http://localhost:5000/api/users";

  // ================= FETCH =================
  const fetchReferrals = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API}/my-referrals`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setData(res.data);

    } catch (err) {
      console.error(err);
      toast.error("Failed to load referrals");
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  // ================= FILTER + SEARCH =================
  const filteredData = data.filter((item) => {
    const matchSearch =
      (item.username || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.phone || "").toLowerCase().includes(search.toLowerCase());

    const createdDate = new Date(item.created_at);

    const matchStart =
      !filters.startDate ||
      createdDate >= new Date(filters.startDate);

    const matchEnd =
      !filters.endDate ||
      createdDate <= new Date(filters.endDate);

    return matchSearch && matchStart && matchEnd;
  });

  // ================= DATE FORMAT =================
  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="refLayout">

      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className="main">
        <Topbar isOpen={isOpen} setIsOpen={setIsOpen} />

        <div className="refContent">

          {/* HEADER */}
          <div className="refHeader">
            <h2>My Referrals</h2>

            <div className="refActions">

              {/* DATE RANGE */}
              <div className="refDropdown">
                <div
                  className="refDropdownHeader"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {dateRange}
                  <span>▾</span>
                </div>

                {dropdownOpen && (
                  <div className="refDropdownMenu">
                    {["Today", "Last 7 Days", "1 Month", "3 Months"].map((item) => (
                      <div
                        key={item}
                        className={`refDropdownItem ${dateRange === item ? "active" : ""}`}
                        onClick={() => {
                          setDateRange(item);
                          setDropdownOpen(false);
                        }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                className="refBtn outline"
                onClick={() => setShowFilter(true)}
              >
                Filter
              </button>

            </div>
          </div>

          {/* SEARCH */}
          <div className="refSearch">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* TABLE */}
          <div className="refTableWrapper">
            <table className="refTable">
              <thead>
                <tr>
                  <th>S.NO</th>
                  <th>USERNAME</th>
                  <th>LASTNAME</th>
                  <th>PHONE NUMBER</th>
                  <th>LEVEL</th>
                  <th>CREATED AT</th>
                </tr>
              </thead>

              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="refEmpty">
                      No available options
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span>{item.username}</span>
                          <small style={{ color: "#aaa" }}>{item.user_code}</small>
                        </div>
                      </td>
                      <td>{item.lastname}</td>
                      <td>{item.phone}</td>
                      <td>Level 1</td> {/* Static for now */}
                      <td>{formatDate(item.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* FOOTER */}
          <div className="usrDeposit__footer">
            <div className="usrDeposit__rows">
              Rows:
              <select>
                <option>10</option>
                <option>25</option>
              </select>
            </div>

            <div className="usrDeposit__pagination">
              <button>{"< Prev"}</button>
              <button className="active">1</button>
              <button>{"Next >"}</button>
            </div>
          </div>

        </div>
      </div>

      {/* FILTER MODAL */}
      {showFilter && (
        <div className="refModalOverlay">
          <div className="refModal">

            <div className="refModalHeader">
              <h3>Filter Referrals</h3>
              <button onClick={() => setShowFilter(false)}>✕</button>
            </div>

            <div className="refModalBody">

              <div className="refField">
                <label>Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters({ ...filters, startDate: e.target.value })
                  }
                />
              </div>

              <div className="refField">
                <label>End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters({ ...filters, endDate: e.target.value })
                  }
                />
              </div>

              <div className="refField">
                <label>Direct Referral Count</label>
                <input
                  type="number"
                  placeholder="Enter count"
                  value={filters.count}
                  onChange={(e) =>
                    setFilters({ ...filters, count: e.target.value })
                  }
                />
              </div>

            </div>

            <div className="refModalFooter">
              <button
                className="refCancel"
                onClick={() => setShowFilter(false)}
              >
                Cancel
              </button>

              <button
                className="refApply"
                onClick={() => setShowFilter(false)}
              >
                Apply Filter
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default MyReferral;