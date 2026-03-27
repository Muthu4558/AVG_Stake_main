import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/user/UserSidebar";
import Topbar from "../components/user/UserTopbar";

const UserROI = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [data, setData] = useState([]);

    // ✅ FETCH ROI HISTORY
    const fetchROI = async () => {
        try {
            const token = localStorage.getItem("token");

            const res = await axios.get(
                "http://localhost:5000/api/user-plans/roi-history",
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            // ✅ FORMAT DATA (IMPORTANT FIX)
            const formatted = (res.data || []).map((item) => ({
                id: item.id,
                from: item.from_user || "Admin",
                fromId: item.from_id || "SYSTEM",
                to: item.to_user || "",
                toId: item.to_id || "",
                type: "Daily ROI Income",
                amount: `$${Number(item.amount).toFixed(2)}`,
                date: new Date(item.created_at).toLocaleString(),
            }));

            setData(formatted);

        } catch (err) {
            console.error("ROI fetch error:", err);
        }
    };

    useEffect(() => {
        fetchROI();
    }, []);

    // ✅ SAFE SEARCH FILTER (FIXED)
    const filteredData = data.filter((item) =>
        (item.type || "").toLowerCase().includes(search.toLowerCase()) ||
        (item.amount || "").toLowerCase().includes(search.toLowerCase()) ||
        (item.from || "").toLowerCase().includes(search.toLowerCase()) ||
        (item.to || "").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="uroiLayout">

            <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

            <div className="main">
                <Topbar isOpen={isOpen} setIsOpen={setIsOpen} />

                <div className="uroiContent">

                    <div className="utxFirstContent">
                        <h2 className="uroiTitle">My ROI Income</h2>

                    <div className="uroiSearch">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    </div>

                    <div className="uroiTableWrapper">
                        <table className="uroiTable">
                            <thead>
                                <tr>
                                    <th>S.NO</th>
                                    <th>FROM USER</th>
                                    <th>TO USER</th>
                                    <th>TYPE</th>
                                    <th>AMOUNT</th>
                                    <th>CREATED AT</th>
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

                                            <td className="uroiType">{item.type}</td>

                                            <td className="uroiAmount">{item.amount}</td>

                                            <td>{item.date}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6">No ROI data found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

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

export default UserROI;