import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
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
  Tabs,
  Input,
} from "antd";
import Sidebar from "./Sidebar";
import HeaderBar from "./HeaderBar";

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
  const [declineModalVisible, setDeclineModalVisible] = useState(false);

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
        setFilteredRequests(
          requestsList.filter((req) => req.status === "Pending")
        );
        setActiveTab("Pending");
      } catch (error) {
        console.error("Error fetching requests:", error);
        message.error("Failed to load requests.");
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

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

  const handleView = async (request) => {
    try {
      setSelectedRequest(request);
      setIsModalVisible(true);

      const petDoc = await getDoc(doc(db, "pet", request.petId));
      setPetDetails(petDoc.exists() ? petDoc.data() : null);

      const userDoc = await getDoc(doc(db, "users", request.uid));
      setUserDetails(userDoc.exists() ? userDoc.data() : null);
    } catch (error) {
      console.error("Error fetching details:", error);
      message.error("Failed to load additional details.");
    }
  };

  const handleClose = () => {
    setIsModalVisible(false);
    setSelectedRequest(null);
    setPetDetails(null);
    setUserDetails(null);
  };

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
    setDeclineModalVisible(true);
  };

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
              : status === "Disapprove"
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
              Pet Adoption Request
            </Title>
          </Card>

          <Tabs activeKey={activeTab} onChange={handleTabChange} centered>
            <TabPane tab="Pending" key="Pending" />
            <TabPane tab="Approved" key="Approved" />
            <TabPane tab="Disapprove" key="Disapprove" />
          </Tabs>

          <Card>
            <Table
              dataSource={filteredRequests}
              columns={columns}
              rowKey="id"
              loading={loading}
              pagination={false}
              bordered
            />
          </Card>

          <Modal
            title={null}
            visible={isModalVisible}
            onCancel={handleClose}
            bodyStyle={{
              height: "450px", 
              overflowY: "auto", 
            }}
            footer={[
              selectedRequest?.status === "Pending" && (
                <>
                  <Button key="approve" type="primary" onClick={handleApprove}>
                    Approve
                  </Button>
                  <Button danger type="primary" onClick={handleDecline}>
                    Disapprove
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
                        : selectedRequest.status === "Disapprove"
                        ? "error"
                        : "processing"
                    }
                    text={
                      <Text type="secondary" style={{ fontSize: "16px" }}>
                        {selectedRequest.status}
                      </Text>
                    }
                  />
                  {selectedRequest.status === "Disapprove" &&
                    selectedRequest.declineReason && (
                      <Text type="danger" style={{ fontSize: "14px" }}>
                        Reason: {selectedRequest.declineReason}
                      </Text>
                    )}
                </Space>

                <Descriptions bordered column={1} style={{ marginTop: "10px" }}>
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
          <Modal
            title="Disapprove Request"
            visible={declineModalVisible}
            onOk={async () => {
              try {
                const requestRef = doc(db, "request", selectedRequest.id);
                await updateDoc(requestRef, {
                  status: "Disapprove",
                  declineReason, 
                });
                setRequests((prevRequests) =>
                  prevRequests.map((req) =>
                    req.id === selectedRequest.id
                      ? { ...req, status: "Disapprove", declineReason }
                      : req
                  )
                );
                message.success("Request Disapproved successfully!");
                handleClose();
              } catch (error) {
                console.error("Error declining request:", error);
                message.error("Failed to update status.");
              } finally {
                setDeclineModalVisible(false);
                setDeclineReason("");
              }
            }}
            onCancel={() => {
              setDeclineModalVisible(false);
              setDeclineReason("");
            }}
            okText="Submit"
            cancelText="Cancel"
            centered
          >
            <Input.TextArea
              rows={4}
              placeholder="Remarks (optional)"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
            />
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default ManageRequests;
