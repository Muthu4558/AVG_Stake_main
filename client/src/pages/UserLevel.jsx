import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/user/UserSidebar";
import Topbar from "../components/user/UserTopbar";

const UserDirect = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchLevelIncome = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(
          "http://localhost:5000/api/users/my-level-income",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setData(res.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchLevelIncome();
  }, []);

  const filteredData = data.filter((item) =>
    item.to.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="udiLayout">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className="main">
        <Topbar isOpen={isOpen} setIsOpen={setIsOpen} />

        <div className="udiContent">
          <div className="utxFirstContent">
            <h2 className="udiTitle">My Level Income</h2>

          <div className="udiSearch">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          </div>

          <div className="udiTableWrapper">
            <table className="udiTable">
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
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="udiEmpty">
                      No available options
                    </td>
                  </tr>
                ) : (
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

                      <td className="udiType">{item.type}</td>

                      <td className="udiAmount">{item.amount}</td>

                      <td>
                        {new Date(item.date).toLocaleString()}
                      </td>
                    </tr>
                  ))
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

export default UserDirect;