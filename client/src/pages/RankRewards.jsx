import React, { useState, useEffect } from 'react';
import API from "../utils/api";

const RankRewards = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  // 🔥 REAL DATA
  const [rewardsData, setRewardsData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedReward, setSelectedReward] = useState(null);
  const [popupMessage, setPopupMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);

  // ✅ FETCH FROM BACKEND
  const fetchRewards = async () => {
    try {
      setLoading(true);

      const res = await API.get("/ranks/admin");

      // 👉 map backend data → existing UI format
      const formatted = res.data.map((item, index) => ({
        sno: index + 1,
        userId: item.userId,
        rewardName: item.reward,
        target_amount: item.target_amount,
        progress: item.progress,

        username: item.username,
        phoneNo: item.phone || "-",

        reward: `${item.reward} (₹${item.progress} / ₹${item.target_amount})`,

        status: item.status || "pending", // ✅ FROM BACKEND

        createdAt: "-"
      }));

      setRewardsData(formatted);

    } catch (err) {
      console.error("Fetch rewards error:", err);
      setRewardsData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  // Show popup message
  const showPopupMessage = (message) => {
    setPopupMessage(message);
    setShowPopup(true);
    setTimeout(() => {
      setShowPopup(false);
    }, 3000);
  };

  // Action handlers
  const handleView = (reward) => {
    setSelectedReward(reward);
    setModalType('view');
    setShowModal(true);
  };

  const handleEdit = (reward) => {
    setSelectedReward(reward);
    setModalType('edit');
    setShowModal(true);
  };

  const handleDelete = (reward) => {
    setSelectedReward(reward);
    setModalType('delete');
    setShowModal(true);
  };

  const handleApprove = async (reward) => {
    try {
      await API.post("/ranks/status", {
        userId: reward.userId,
        reward: reward.rewardName,
        target_amount: reward.target_amount,
        progress: reward.progress,
        status: "approved"
      });

      fetchRewards(); // refresh from DB

    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (reward) => {
    try {
      await API.post("/ranks/status", {
        userId: reward.userId,
        reward: reward.rewardName,
        target_amount: reward.target_amount,
        progress: reward.progress,
        status: "rejected"
      });

      fetchRewards();

    } catch (err) {
      console.error(err);
    }
  };

  // Modal confirm handler
  const handleModalConfirm = () => {
    if (modalType === 'delete' && selectedReward) {
      const updatedData = rewardsData.filter(item => item.sno !== selectedReward.sno);
      setRewardsData(updatedData);
      showPopupMessage(`Reward for ${selectedReward.username} deleted successfully`);
    } else if (modalType === 'edit' && selectedReward) {
      showPopupMessage(`Reward for ${selectedReward.username} updated successfully`);
    }
    setShowModal(false);
    setSelectedReward(null);
  };

  // Filter data
  const filteredData = rewardsData.filter(item =>
    item.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.reward.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'approved';
      case 'pending': return 'pending';
      case 'rejected': return 'rejected';
      default: return 'pending';
    }
  };

  // Modal
  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div className="rr-modal-overlay">
        <div className="rr-modal">
          <div className="rr-modal-header">
            <h3>
              {modalType === 'delete'
                ? 'Confirm Delete'
                : modalType === 'edit'
                  ? 'Edit Reward'
                  : 'View Details'}
            </h3>
            <button className="rr-modal-close" onClick={() => setShowModal(false)}>×</button>
          </div>

          <div className="rr-modal-body">
            {modalType === 'delete' && (
              <p>Are you sure you want to delete the reward for {selectedReward?.username}?</p>
            )}

            {modalType === 'edit' && (
              <div className="rr-edit-form">
                <div className="rr-form-group">
                  <label>Username:</label>
                  <input type="text" defaultValue={selectedReward?.username} />
                </div>
                <div className="rr-form-group">
                  <label>Phone No:</label>
                  <input type="text" defaultValue={selectedReward?.phoneNo} />
                </div>
                <div className="rr-form-group">
                  <label>Reward:</label>
                  <input type="text" defaultValue={selectedReward?.reward} />
                </div>
              </div>
            )}

            {modalType === 'view' && selectedReward && (
              <div className="rr-view-details">
                {Object.entries(selectedReward).map(([key, value]) => (
                  <div key={key} className="rr-detail-row">
                    <strong>{key}:</strong>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rr-modal-footer">
            <button className="rr-modal-btn cancel" onClick={() => setShowModal(false)}>Cancel</button>
            {(modalType === 'delete' || modalType === 'edit') && (
              <button className="rr-modal-btn confirm" onClick={handleModalConfirm}>
                {modalType === 'delete' ? 'Delete' : 'Save'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPopup = () => {
    if (!showPopup) return null;
    return <div className="rr-popup">{popupMessage}</div>;
  };

  return (
    <div className="rr-container">

      <div className="rr-header">
        <h1 className="rr-title">Rank Rewards</h1>

        <div className="rr-search-box">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      <div className="rr-table-responsive">
        <table className="rr-table">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>USERNAME</th>
              <th>PHONE NO</th>
              <th>REWARD</th>
              <th>STATUS</th>
              {/* <th>CREATED AT</th> */}
              <th>ACTIONS</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="rr-no-data">Loading...</td>
              </tr>
            ) : currentItems.length > 0 ? (
              currentItems.map((reward) => (
                <tr key={reward.sno}>
                  <td>{reward.sno}</td>
                  <td>{reward.username}</td>
                  <td>{reward.phoneNo}</td>
                  <td className="rr-reward-cell">{reward.reward}</td>
                  <td>
                    <span className={`rr-status-badge ${getStatusClass(reward.status)}`}>
                      {reward.status.charAt(0).toUpperCase() + reward.status.slice(1)}
                    </span>
                  </td>
                  {/* <td>{reward.createdAt}</td> */}

                  <td>
                    <div className="rr-actions-dropdown">
                      <button className="rr-action-btn">⋮</button>
                      <div className="rr-actions-menu">
                        <button onClick={() => handleView(reward)}>👁️ View</button>
                        <button onClick={() => handleEdit(reward)}>✏️ Edit</button>

                        {reward.status === 'pending' && (
                          <>
                            <button onClick={() => handleApprove(reward)}>✅ Approve</button>
                            <button onClick={() => handleReject(reward)}>❌ Reject</button>
                          </>
                        )}

                        <button onClick={() => handleDelete(reward)}>🗑️ Delete</button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="rr-no-data">No rewards found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rr-table-footer">
        <div className="rr-rows-selector">
          <span>Rows per page:</span>
          <select value={rowsPerPage} onChange={handleRowsPerPageChange}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>

          <span className="rr-rows-info">
            {filteredData.length > 0
              ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredData.length)} of ${filteredData.length}`
              : '0-0 of 0'}
          </span>
        </div>

        <div className="rr-pagination">
          <button onClick={handlePrevious} disabled={currentPage === 1}>Previous</button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              className={currentPage === i + 1 ? 'rr-active' : ''}
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </button>
          ))}

          <button onClick={handleNext} disabled={currentPage === totalPages || totalPages === 0}>
            Next
          </button>
        </div>
      </div>

      {renderModal()}
      {renderPopup()}
    </div>
  );
};

export default RankRewards;