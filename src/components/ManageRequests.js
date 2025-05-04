import React, { useEffect, useState } from "react";
import {
  Typography,
  Badge,
  message,
  Card,
  Tabs,
  Spin,
  Button,
  Modal,
  Descriptions,
  Tag,
  Image,
} from "antd";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import Sidebar from "./Sidebar";
import HeaderBar from "./HeaderBar";

const STATUS_BADGE = {
  Approved: "success",
  Disapprove: "error",
  Pending: "processing",
};

function ManageRequests({ adminName = "Admin" }) {
  const [requestData, setRequestData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Pending");
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [userDetails, setUserDetails] = useState(null);

  const pendingCount = requestData.filter((r) => r.status === "Pending").length;
  const approvedCount = requestData.filter(
    (r) => r.status === "Approved"
  ).length;
  const disapproveCount = requestData.filter(
    (r) => r.status === "Disapprove"
  ).length;

  const fetchRequests = async () => {
    try {
      const requestCollection = collection(db, "request_form");
      const requestSnapshot = await getDocs(requestCollection);
      const requestList = requestSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          status: data.status || "Pending",
        };
      });
      console.log("Fetched data:", requestList);
      setRequestData(requestList);
    } catch (error) {
      console.error("Error fetching request_form:", error);
      setError(error.message);
      message.error("Failed to fetch request data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (uid) => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const user = usersSnapshot.docs.find((doc) => doc.data().uid === uid);
      if (user) {
        setUserDetails(user.data());
      } else {
        setUserDetails(null);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setUserDetails(null);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusChange = async (id, newStatus, petId) => {
    try {
      const requestRef = doc(db, "request_form", id);
      await updateDoc(requestRef, { status: newStatus });

      if (petId) {
        const petRef = doc(db, "pet", petId);

        if (newStatus === "Approved") {
          await updateDoc(petRef, { status: "Adopted" });
        } else if (newStatus === "Disapprove") {
          await updateDoc(petRef, { status: "Available" });
        }
      }

      message.success(`Request ${newStatus.toLowerCase()} successfully.`);
      fetchRequests();
    } catch (error) {
      message.error(`Error: ${error.message}`);
    }
  };

  const filteredData = Array.isArray(requestData)
    ? requestData.filter((item) => item.status === activeTab)
    : [];

  const renderSimpleTable = () => {
    if (filteredData.length === 0) {
      return <div>No {activeTab} requests found</div>;
    }

    return (
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Name</th>
              <th style={tableHeaderStyle}>Email</th>
              <th style={tableHeaderStyle}>Phone</th>
              <th style={tableHeaderStyle}>Pet Type</th>
              <th style={tableHeaderStyle}>Status</th>
              <th style={tableHeaderStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <tr key={item.id}>
                <td style={tableCellStyle}>{item.name || "N/A"}</td>
                <td style={tableCellStyle}>{item.email || "N/A"}</td>
                <td style={tableCellStyle}>{item.phone || "N/A"}</td>
                <td style={tableCellStyle}>{item.pettype || "N/A"}</td>

                <td style={tableCellStyle}>
                  <Tag
                    color={
                      item.status === "Approved"
                        ? "green"
                        : item.status === "Disapprove"
                        ? "red"
                        : "gold"
                    }
                  >
                    {item.status}
                  </Tag>
                </td>

                <td style={tableCellStyle}>
                  <Button
                    type="primary"
                    onClick={() => {
                      setSelectedRequest(item);
                      fetchUserDetails(item.user_id);
                      setIsModalOpen(true);
                    }}
                  >
                    Review Request
                  </Button>
                </td>
                <Modal
                  title="Review Pet Adoption Request"
                  centered
                  width={600}
                  bodyStyle={{
                    height: "450px",
                    overflowY: "auto",
                  }}
                  visible={isModalOpen}
                  onCancel={() => setIsModalOpen(false)}
                  footer={[
                    <Button
                      key="disapprove"
                      danger
                      onClick={() => {
                        Modal.confirm({
                          title: "Confirm Disapproval",
                          content: (
                            <p>
                              Are you sure you want to{" "}
                              <strong>disapprove</strong> this adoption request
                              for <strong>{selectedRequest?.name}</strong>, who
                              wants to adopt a{" "}
                              <strong>{selectedRequest?.pettype}</strong>?
                            </p>
                          ),
                          okText: "Yes, Disapprove",
                          okType: "danger",
                          cancelText: "Cancel",
                          onOk: () => {
                            handleStatusChange(
                              selectedRequest.id,
                              "Disapprove",
                              selectedRequest.petId 
                            );
                            setIsModalOpen(false);
                          },
                        });
                      }}
                    >
                      Disapprove
                    </Button>,

                    <Button
                      key="approve"
                      type="primary"
                      onClick={() => {
                        Modal.confirm({
                          title: "Confirm Approval",
                          content: (
                            <p>
                              Are you sure you want to <strong>approve</strong>{" "}
                              this adoption request for{" "}
                              <strong>{selectedRequest?.name}</strong>, who
                              wants to adopt a{" "}
                              <strong>{selectedRequest?.pettype}</strong>?
                            </p>
                          ),
                          okText: "Yes, Approve",
                          cancelText: "Cancel",
                          onOk: () => {
                            handleStatusChange(
                              selectedRequest.id,
                              "Approved",
                              selectedRequest.petId
                            );
                            setIsModalOpen(false);
                          },
                        });
                      }}
                    >
                      Approve
                    </Button>,
                  ]}
                >
                  {userDetails && (
                    <>
                      <Typography.Title
                        level={5}
                        style={{ marginTop: 16, textAlign: "center" }}
                      >
                        Adopter Valid ID
                      </Typography.Title>
                      <div style={{ textAlign: "center", marginTop: 16 }}>
                        <Image
                          src={userDetails.images3}
                          alt="Uploaded ID or Profile"
                          style={{
                            width: "100%",
                            maxWidth: 400,
                            height: 200,
                            borderRadius: 8,
                          }}
                        />
                      </div>
                    </>
                  )}

                  {selectedRequest ? (
                    <div >
                      <Typography.Title level={5}>
                        Adopter Information ℹ️
                      </Typography.Title>
                      <Descriptions bordered column={1}>
                        <Descriptions.Item label="Name">
                          {selectedRequest.name}
                        </Descriptions.Item>
                        <Descriptions.Item label="Date of Birth">
                          {selectedRequest.dateofbirth}
                        </Descriptions.Item>
                        <Descriptions.Item label="Adults in Household">
                          {selectedRequest.adults}
                        </Descriptions.Item>
                        <Descriptions.Item label="Children in Household">
                          {selectedRequest.children}
                        </Descriptions.Item>
                        <Descriptions.Item label="Age Group">
                          {selectedRequest.age}
                        </Descriptions.Item>
                      </Descriptions>

                      <Typography.Title level={5} style={{ marginTop: 16 }}>
                        Contact Details 📞
                      </Typography.Title>
                      <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="Email">
                          {selectedRequest.email}
                        </Descriptions.Item>
                        <Descriptions.Item label="Phone">
                          {selectedRequest.phone}
                        </Descriptions.Item>
                        <Descriptions.Item label="Address">
                          {selectedRequest.address}
                        </Descriptions.Item>
                      </Descriptions>

                      <Typography.Title level={5} style={{ marginTop: 16 }}>
                        Living Situation 🏠
                      </Typography.Title>
                      <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="Residence Type">
                          {selectedRequest.residence}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ownership">
                          {selectedRequest.ownership}
                        </Descriptions.Item>
                        <Descriptions.Item label="Hours Alone">
                          {selectedRequest.hoursalone}
                        </Descriptions.Item>
                        <Descriptions.Item label="Financial Responsibility">
                          {selectedRequest.financialresponsibility}
                        </Descriptions.Item>
                      </Descriptions>

                      <Typography.Title level={5} style={{ marginTop: 16 }}>
                        Pet Ownership History 🐾
                      </Typography.Title>
                      <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="Current Pets">
                          {selectedRequest.currentpets}
                        </Descriptions.Item>
                        <Descriptions.Item label="Current Pet Details">
                          {selectedRequest.currentpetdetails || "N/A"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Past Pets">
                          {selectedRequest.pastpets}
                        </Descriptions.Item>
                        <Descriptions.Item label="Past Pet Details">
                          {selectedRequest.pastpetdetails || "N/A"}
                        </Descriptions.Item>
                      </Descriptions>

                      <Typography.Title level={5} style={{ marginTop: 16 }}>
                        Pet Preferences 🐈🐕
                      </Typography.Title>
                      <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="Pet Type">
                          {selectedRequest.pettype}
                        </Descriptions.Item>
                        <Descriptions.Item label="Pet Size">
                          {selectedRequest.size}
                        </Descriptions.Item>
                        <Descriptions.Item label="Pet Stay When Away">
                          {selectedRequest.petstaywhenaway}
                        </Descriptions.Item>
                        <Descriptions.Item label="Pet Other When Away">
                          {selectedRequest.petOtherWhenAway}
                        </Descriptions.Item>
                      </Descriptions>

                      <Typography.Title level={5} style={{ marginTop: 16 }}>
                        Allergies & Lifestyle ❤️
                      </Typography.Title>
                      <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="Allergies">
                          {selectedRequest.allergies}
                        </Descriptions.Item>
                        <Descriptions.Item label="Allergy Explanation">
                          {selectedRequest.explanationallergies || "N/A"}
                        </Descriptions.Item>
                      </Descriptions>

                      <Typography.Title level={5} style={{ marginTop: 16 }}>
                        Other Details ➕
                      </Typography.Title>
                      <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="Status">
                          {selectedRequest.status}
                        </Descriptions.Item>
                        <Descriptions.Item label="Submitted On">
                          {selectedRequest.timestamp?.seconds
                            ? new Date(
                                selectedRequest.timestamp.seconds * 1000
                              ).toLocaleString()
                            : "N/A"}
                        </Descriptions.Item>
                      </Descriptions>
                    </div>
                  ) : (
                    <p>No request selected.</p>
                  )}
                </Modal>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const tableHeaderStyle = {
    padding: "12px 16px",
    backgroundColor: "#fafafa",
    borderBottom: "1px solid #f0f0f0",
    textAlign: "left",
  };

  const tableCellStyle = {
    padding: "12px 16px",
    borderBottom: "1px solid #f0f0f0",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flexGrow: 1 }}>
        <HeaderBar userName={adminName} />
        <div style={{ padding: 20 }}>
          <Card bordered style={{ marginBottom: 20 }}>
            <Typography.Title level={3} style={{ textAlign: "center" }}>
              Pet Adoption Requests
            </Typography.Title>
          </Card>

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            centered
            items={[
              { key: "Pending", label: `Pending (${pendingCount})` },
              { key: "Approved", label: `Approved (${approvedCount})` },
              { key: "Disapprove", label: `Disapprove (${disapproveCount})` },
            ]}
          />

          <Card>
            {loading ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <Spin tip="Loading requests..." />
              </div>
            ) : (
              renderSimpleTable()
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ManageRequests;
