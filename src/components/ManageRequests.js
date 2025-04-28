import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  Table,
  Button,
  Typography,
  Modal,
  Badge,
  message,
  Card,
  Space,
  Descriptions,
  Image,
  Tabs, Input,
} from "antd";
import Sidebar from "./Sidebar";
import HeaderBar from "./HeaderBar"; // Import the reusable HeaderBar component

const { Text, Title } = Typography;
const { TabPane } = Tabs;

const ManageRequests = ({ adminName }) => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [petDetails, setPetDetails] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [declineReason, setDeclineReason] = useState("");

  // Fetch requests from Firestore
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const requestsCollection = collection(db, "request");
        const requestsSnapshot = await getDocs(requestsCollection);
        const requestsList = requestsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRequests(requestsList);
        setFilteredRequests(requestsList);
      } catch (error) {
        console.error("Error fetching requests:", error);
        message.error("Failed to load requests.");
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  // Handle Tab Change
  const handleTabChange = (key) => {
    setActiveTab(key);
    if (key === "All") {
      setFilteredRequests(requests);
    } else if (key === "Archived") {
      setFilteredRequests(requests.filter((req) => req.status === "Archived"));
    } else {
      setFilteredRequests(requests.filter((req) => req.status === key));
    }
  };  

  // Fetch additional details and open modal
  const handleView = async (request) => {
    try {
      setSelectedRequest(request);

      // Fetch pet details
      const petDoc = await getDoc(doc(db, "pet", request.petId));
      setPetDetails(petDoc.exists() ? petDoc.data() : null);

      // Fetch user details
      const userDoc = await getDoc(doc(db, "users", request.uid));
      setUserDetails(userDoc.exists() ? userDoc.data() : null);

      setIsModalVisible(true);
    } catch (error) {
      console.error("Error fetching details:", error);
      message.error("Failed to load additional details.");
    }
  };

  // Close modal
  const handleClose = () => {
    setIsModalVisible(false);
    setSelectedRequest(null);
    setPetDetails(null);
    setUserDetails(null);
  };

  // Archive a request instead of deleting
  const handleArchive = async (requestId) => {
    try {
      const requestRef = doc(db, "request", requestId);
      await updateDoc(requestRef, { status: "Archived" });
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === requestId ? { ...req, status: "Archived" } : req
        )
      );
      message.success("Request archived successfully!");
    } catch (error) {
      console.error("Error archiving request:", error);
      message.error("Failed to archive request.");
    }
  };


  // Update request status
  const updateStatus = async (status) => {
    try {
      if (selectedRequest) {
        const requestRef = doc(db, "request", selectedRequest.id);
        await updateDoc(requestRef, { status });
        setRequests((prevRequests) =>
          prevRequests.map((req) =>
            req.id === selectedRequest.id ? { ...req, status } : req
          )
        );
        message.success(`Request ${status.toLowerCase()} successfully!`);
        handleClose();
      }
    } catch (error) {
      console.error("Error updating status:", error);
      message.error("Failed to update status.");
    }
  };

  const handleApprove = () => updateStatus("Approved");
  const handleDecline = () => {
    Modal.confirm({
      title: "Decline Request",
      content: (
        <div>
          <p>Please provide a reason for declining this request:</p>
          <Input.TextArea
            rows={4}
            placeholder="Enter decline reason"
            onChange={(e) => setDeclineReason(e.target.value)}
          />
        </div>
      ),
      onOk: async () => {
        if (!declineReason.trim()) {
          message.error("Decline reason is required!");
          return;
        }
        try {
          const requestRef = doc(db, "request", selectedRequest.id);
          await updateDoc(requestRef, { status: "Declined", declineReason });
          setRequests((prevRequests) =>
            prevRequests.map((req) =>
              req.id === selectedRequest.id
                ? { ...req, status: "Declined", declineReason }
                : req
            )
          );
          message.success("Request declined successfully!");
          handleClose();
        } catch (error) {
          console.error("Error declining request:", error);
          message.error("Failed to update status.");
        } finally {
          setDeclineReason("");
        }
      },
      onCancel: () => {
        setDeclineReason("");
      },
      okText: "Submit",
      cancelText: "Cancel",
    });
  };

  // Table columns
  const columns = [
    { title: "Full Name", dataIndex: "fullname", key: "fullname" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Badge
          status={
            status === "Approved"
              ? "success"
              : status === "Declined"
              ? "error"
              : "processing"
          }
          text={status}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleView(record)}>
            View
          </Button>
          {record.status !== "Archived" && (
            <Button type="link" danger onClick={() => handleArchive(record.id)}>
              Archive
            </Button>
          )}
        </Space>
      ),
    },    
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flexGrow: 1 }}>
        <HeaderBar userName={adminName || "Admin"} />
        <div style={{ padding: "20px" }}>
          <Card bordered style={{ marginBottom: "20px" }}>
            <Title level={3} style={{ textAlign: "center" }}>
              Manage Requests
            </Title>
          </Card>

          {/* Tabs */}
          <Tabs defaultActiveKey="All" onChange={handleTabChange} centered>
            <TabPane tab="All" key="All" />
            <TabPane tab="Approved" key="Approved" />
            <TabPane tab="Declined" key="Declined" />
            <TabPane tab="Archived" key="Archived" />
          </Tabs>

          {/* Table */}
          <Card>
            <Table
              dataSource={filteredRequests}
              columns={columns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 5 }}
              bordered
            />
          </Card>

          {/* Modal */}
          <Modal
            title={null}
            visible={isModalVisible}
            onCancel={handleClose}
            footer={[
              <Button key="close" onClick={handleClose}>
                Close
              </Button>,
              selectedRequest?.status === "Pending" && (
                <>
                  <Button key="approve" type="primary" onClick={handleApprove}>
                    Approve
                  </Button>
                  <Button key="decline" type="danger" onClick={handleDecline}>
                    Decline
                  </Button>
                </>
              ),
            ]}
            centered
            width={700}
          >
            {selectedRequest && (
              <Card style={{ textAlign: "center", borderRadius: "12px" }}>
                <Image
                  src={
                    userDetails?.profile_image ||
                    "https://via.placeholder.com/100?text=No+Image"
                  }
                  alt="User Profile"
                  width={100}
                  height={100}
                  style={{
                    borderRadius: "50%",
                    objectFit: "cover",
                    marginBottom: "20px",
                  }}
                />
                <Title level={4}>{selectedRequest.fullname}</Title>
                <Space direction="vertical" style={{ marginBottom: "20px" }}>
                  <Badge
                    status={
                      selectedRequest.status === "Approved"
                        ? "success"
                        : selectedRequest.status === "Declined"
                        ? "error"
                        : "processing"
                    }
                    text={
                      <Text type="secondary" style={{ fontSize: "16px" }}>
                        {selectedRequest.status}
                      </Text>
                    }
                  />
                  {selectedRequest.status === "Declined" && selectedRequest.declineReason && (
                    <Text type="danger" style={{ fontSize: "14px" }}>
                      Reason: {selectedRequest.declineReason}
                    </Text>
                  )}
                </Space>

                <Descriptions bordered column={1} style={{ marginTop: "20px" }}>
                  <Descriptions.Item label="Email">
                    {userDetails?.email || "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Contact">
                    {userDetails?.contact || "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Valid IDs">
                    {userDetails?.valid_ids || "No valid IDs"}
                  </Descriptions.Item>
                  {petDetails && (
                    <>
                      <Descriptions.Item label="Pet Name">
                        {petDetails.pet_name}
                      </Descriptions.Item>
                      <Descriptions.Item label="Type">
                        {petDetails.type}
                      </Descriptions.Item>
                      <Descriptions.Item label="Age">
                        {petDetails.age}
                      </Descriptions.Item>
                    </>
                  )}
                </Descriptions>
              </Card>
            )}
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default ManageRequests;
