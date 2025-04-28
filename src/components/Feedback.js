import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Table, Typography, Card, Row, Col, Pagination, Spin, message } from "antd";
import Sidebar from "./Sidebar";

const { Title } = Typography;

const ManageFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Fetch feedbacks and users from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch Feedbacks
        const feedbackCollection = collection(db, "feedback");
        const feedbackSnapshot = await getDocs(feedbackCollection);
        const feedbackList = feedbackSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFeedbacks(feedbackList);

        // Fetch Users
        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);
        const usersData = {};
        usersSnapshot.forEach((doc) => {
          usersData[doc.id] = doc.data();
        });
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching data:", error);
        message.error("Failed to load feedbacks. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle Page Change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Table Columns
  const columns = [
    {
      title: "Name",
      dataIndex: "uid",
      key: "userName",
      render: (uid) => {
        const user = users[uid];
        return user ? `${user.firstname} ${user.lastname}` : "Unknown User";
      },
    },
    {
      title: "Feedback",
      dataIndex: "feedback",
      key: "feedback",
    }
  ];

  // Paginate the data
  const paginatedData = feedbacks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div style={{ flexGrow: 1, padding: "20px" }}>
        <Card bordered style={{ marginBottom: "20px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}>
          <Title level={3} style={{ textAlign: "center", marginBottom: "0" }}>
            Manage Feedback
          </Title>
        </Card>

        {/* Table */}
        <Card>
          {loading ? (
            <Spin size="large" style={{ display: "block", margin: "auto" }} />
          ) : (
            <>
              <Table
                dataSource={paginatedData}
                columns={columns}
                rowKey="id"
                pagination={false}
                bordered
              />
              {/* Pagination */}
              <Row justify="center" style={{ marginTop: "20px" }}>
                <Col>
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={feedbacks.length}
                    onChange={handlePageChange}
                    showSizeChanger={false}
                  />
                </Col>
              </Row>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ManageFeedback;
