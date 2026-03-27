import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/user/UserSidebar";
import Topbar from "../components/user/UserTopbar";

const UserDeposit = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [selectedRow, setSelectedRow] = useState(null);

    // ✅ REPLACED STATIC DATA WITH STATE
    const [data, setData] = useState([]);

    // ✅ FETCH DATA FROM DB
    const fetchDeposits = async () => {
        try {
            const token = localStorage.getItem("token");

            const res = await axios.get(
                "http://localhost:5000/api/user-plans/deposits",
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            // ✅ FORMAT DATA TO MATCH YOUR EXISTING UI
            const formatted = (res.data || []).map((item) => ({
                id: item.id,
                from: item.from_user || "User",
                fromId: item.from_id || "-",

                // ✅ FIXED: NO DB FIELD, ALWAYS ADMIN
                to: "Admin",
                toId: "SYSTEM",

                hash: item.hash || "N/A",
                plan: item.plan_name,
                amount: `$${item.amount}`,
                date: item.created_at
                    ? new Date(item.created_at).toLocaleString()
                    : "-"
            }));

            setData(formatted);

        } catch (err) {
            console.error("Deposit fetch error:", err);
        }
    };

    useEffect(() => {
        fetchDeposits();
    }, []);

    // ✅ SEARCH FILTER (LOGIC ONLY)
    const filteredData = data.filter(item =>
        item.from.toLowerCase().includes(search.toLowerCase()) ||
        item.plan.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="usrDeposit__layoutWrapper">

            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <div className="main">

                <Topbar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

                <div className="usrDeposit__contentArea">

                    <div className="usrFirstContent">
                        <h2 className="usrDeposit__title">Deposit List</h2>

                    {/* SEARCH */}
                    <div className="usrDeposit__searchBox">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    </div>

                    {/* TABLE */}
                    <div className="usrDeposit__tableWrapper">
                        <table className="usrDeposit__table">
                            <thead>
                                <tr>
                                    <th>S.NO</th>
                                    <th>FROM USER</th>
                                    <th>TO USER</th>
                                    <th>TRANSACTION HASH</th>
                                    <th>PLAN NAME</th>
                                    <th>AMOUNT</th>
                                    <th>CREATED AT</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredData.length > 0 ? (
                                    filteredData.map((item, index) => (
                                        <tr key={item.id}>
                                            <td>{index + 1}</td>

                                            <td>
                                                <p>{item.from}</p>
                                                <span>{item.fromId}</span>
                                            </td>

                                            <td>
                                                <p>{item.to}</p>
                                                <span>{item.toId}</span>
                                            </td>

                                            <td className="usrDeposit__hash">{item.hash}</td>

                                            <td>{item.plan}</td>

                                            <td className="usrDeposit__amount">{item.amount}</td>

                                            <td>{item.date}</td>

                                            <td className="usrDeposit__actionCell">

                                                <button
                                                    className="usrDeposit__actionBtn"
                                                    onClick={() =>
                                                        setActiveDropdown(
                                                            activeDropdown === item.id ? null : item.id
                                                        )
                                                    }
                                                >
                                                    ⋮
                                                </button>

                                                {activeDropdown === item.id && (
                                                    <div className="usrDeposit__dropdown">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedRow(item);
                                                                setActiveDropdown(null);
                                                            }}
                                                        >
                                                            👁 View
                                                        </button>
                                                    </div>
                                                )}

                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: "center" }}>
                                            No deposits found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* MODAL */}
                    {selectedRow && (
                        <div className="usrDeposit__modalOverlay">
                            <div className="usrDeposit__modalBox">

                                <div className="usrDeposit__modalHeader">
                                    <h3>Transaction Details</h3>
                                    <button
                                        onClick={() => setSelectedRow(null)}
                                        className="usrDeposit__modalClose"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="usrDeposit__modalGrid">

                                    <div>
                                        <label>From User</label>
                                        <p>{selectedRow.from} ({selectedRow.fromId})</p>
                                    </div>

                                    <div>
                                        <label>To User</label>
                                        <p>{selectedRow.to} ({selectedRow.toId})</p>
                                    </div>

                                    <div>
                                        <label>Plan</label>
                                        <p>{selectedRow.plan}</p>
                                    </div>

                                    <div>
                                        <label>Amount</label>
                                        <p className="usrDeposit__highlightAmount">
                                            {selectedRow.amount}
                                        </p>
                                    </div>

                                    <div className="full">
                                        <label>Transaction Hash</label>
                                        <p className="usrDeposit__hash">
                                            {selectedRow.hash}
                                        </p>
                                    </div>

                                    <div className="full">
                                        <label>Created At</label>
                                        <p>{selectedRow.date}</p>
                                    </div>

                                </div>

                                <div className="usrDeposit__modalFooter">
                                    <button
                                        onClick={() => setSelectedRow(null)}
                                        className="usrDeposit__modalBtn"
                                    >
                                        Close
                                    </button>
                                </div>

                            </div>
                        </div>
                    )}

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
        </div>
    );
};

export default UserDeposit;