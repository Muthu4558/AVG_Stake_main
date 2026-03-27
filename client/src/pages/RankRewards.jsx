import React, { useState } from 'react';


const RankRewards = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedReward, setSelectedReward] = useState(null);
  const [popupMessage, setPopupMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);

  // Sample data based on the image
  const [rewardsData, setRewardsData] = useState([
    {
      sno: 1,
      username: 'AGILANVASUDEVAN AVG26949',
      phoneNo: '-',
      reward: '$kochi, kerala cruise ship for 3 days.',
      status: 'Pending',
      createdAt: '29/1/2026, 10:00:01 am'
    },
    {
      sno: 2,
      username: 'RAJESH KUMAR AVG12345',
      phoneNo: '+919876543210',
      reward: '$500 Cash Bonus',
      status: 'Approved',
      createdAt: '28/1/2026, 2:30:15 pm'
    },
    {
      sno: 3,
      username: 'PRIYA SHARMA AVG67890',
      phoneNo: '+919876543211',
      reward: 'Gold Coin 10g',
      status: 'Pending',
      createdAt: '27/1/2026, 11:45:30 am'
    },
    {
      sno: 4,
      username: 'SURESH BABU AVG54321',
      phoneNo: '+919876543212',
      reward: 'Shopping Voucher $200',
      status: 'Rejected',
      createdAt: '26/1/2026, 4:20:00 pm'
    },
    {
      sno: 5,
      username: 'DEEPA VENKAT AVG98765',
      phoneNo: '+919876543213',
      reward: 'Weekend Getaway Package',
      status: 'Approved',
      createdAt: '25/1/2026, 9:15:45 am'
    },
    {
      sno: 6,
      username: 'ARUN KUMAR AVG24680',
      phoneNo: '+919876543214',
      reward: '$300 Amazon Gift Card',
      status: 'Pending',
      createdAt: '24/1/2026, 1:10:20 pm'
    },
    {
      sno: 7,
      username: 'KAVITA RANI AVG13579',
      phoneNo: '+919876543215',
      reward: 'Smart Watch',
      status: 'Approved',
      createdAt: '23/1/2026, 3:55:10 pm'
    },
    {
      sno: 8,
      username: 'VIKRAM SINGH AVG11223',
      phoneNo: '+919876543216',
      reward: '$1000 Travel Voucher',
      status: 'Pending',
      createdAt: '22/1/2026, 5:30:00 pm'
    },
    {
      sno: 9,
      username: 'ANITHA MURUGAN AVG44556',
      phoneNo: '+919876543217',
      reward: 'Diamond Necklace',
      status: 'Rejected',
      createdAt: '21/1/2026, 10:25:30 am'
    },
    {
      sno: 10,
      username: 'PRAKASH RAJ AVG77889',
      phoneNo: '+919876543218',
      reward: '$250 Cash Bonus',
      status: 'Approved',
      createdAt: '20/1/2026, 2:40:15 pm'
    },
    {
      sno: 11,
      username: 'LAKSHMI PRASAD AVG99001',
      phoneNo: '+919876543219',
      reward: 'Mobile Phone',
      status: 'Pending',
      createdAt: '19/1/2026, 11:20:45 am'
    },
    {
      sno: 12,
      username: 'MANOJ KUMAR AVG22334',
      phoneNo: '+919876543220',
      reward: 'Laptop Bag',
      status: 'Approved',
      createdAt: '18/1/2026, 4:35:20 pm'
    }
  ]);

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

  const handleApprove = (reward) => {
    const updatedData = rewardsData.map(item => 
      item.sno === reward.sno ? { ...item, status: 'Approved' } : item
    );
    setRewardsData(updatedData);
    showPopupMessage(`Reward for ${reward.username} approved successfully`);
  };

  const handleReject = (reward) => {
    const updatedData = rewardsData.map(item => 
      item.sno === reward.sno ? { ...item, status: 'Rejected' } : item
    );
    setRewardsData(updatedData);
    showPopupMessage(`Reward for ${reward.username} rejected`);
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

  // Filter data based on search
  const filteredData = rewardsData.filter(item =>
    item.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.reward.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  // Handlers
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
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Get status badge class
  const getStatusClass = (status) => {
    switch(status.toLowerCase()) {
      case 'approved': return 'approved';
      case 'pending': return 'pending';
      case 'rejected': return 'rejected';
      default: return 'pending';
    }
  };

  // Render modal
  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div className="rr-modal-overlay">
        <div className="rr-modal">
          <div className="rr-modal-header">
            <h3>{modalType === 'delete' ? 'Confirm Delete' : modalType === 'edit' ? 'Edit Reward' : 'View Details'}</h3>
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
                <div className="rr-form-group">
                  <label>Status:</label>
                  <select defaultValue={selectedReward?.status}>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
            )}
            {modalType === 'view' && selectedReward && (
              <div className="rr-view-details">
                {Object.entries(selectedReward).map(([key, value]) => (
                  <div key={key} className="rr-detail-row">
                    <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong>
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

  // Render popup
  const renderPopup = () => {
    if (!showPopup) return null;
    return (
      <div className="rr-popup">
        {popupMessage}
      </div>
    );
  };

  return (
    <div className="rr-container">
      {/* Header with title and search */}
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

      {/* Table */}
      <div className="rr-table-responsive">
        <table className="rr-table">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>USERNAME</th>
              <th>PHONE NO</th>
              <th>REWARD</th>
              <th>STATUS</th>
              <th>CREATED AT</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((reward) => (
                <tr key={reward.sno}>
                  <td>{reward.sno}</td>
                  <td>{reward.username}</td>
                  <td>{reward.phoneNo}</td>
                  <td className="rr-reward-cell">{reward.reward}</td>
                  <td>
                    <span className={`rr-status-badge ${getStatusClass(reward.status)}`}>
                      {reward.status}
                    </span>
                  </td>
                  <td>{reward.createdAt}</td>
                  <td>
                    <div className="rr-actions-dropdown">
                      <button className="rr-action-btn">⋮</button>
                      <div className="rr-actions-menu">
                        <button onClick={() => handleView(reward)}>👁️ View</button>
                        <button onClick={() => handleEdit(reward)}>✏️ Edit</button>
                        {reward.status === 'Pending' && (
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

      {/* Footer with rows selector and pagination */}
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
          <button
            className="rr-page-btn"
            onClick={handlePrevious}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              className={`rr-page-btn ${currentPage === i + 1 ? 'rr-active' : ''}`}
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          
          <button
            className="rr-page-btn"
            onClick={handleNext}
            disabled={currentPage === totalPages || totalPages === 0}
          >
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