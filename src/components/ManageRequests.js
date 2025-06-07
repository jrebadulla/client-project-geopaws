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
  Pagination,
  Layout,
} from "antd";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import Sidebar from "./Sidebar";
import HeaderBar from "./HeaderBar";
import { Content } from "antd/es/layout/layout";
import { Input } from "antd";
const { TextArea } = Input;

const STATUS_BADGE = {
  Approved: "success",
  Disapproved: "error",
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
  const [petDetails, setPetDetails] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [isApproving, setIsApproving] = useState(false);
  const [isDisapproving, setIsDisapproving] = useState(false);
  const [disapproveReason, setDisapproveReason] = useState("");
  const pendingCount = requestData.filter((r) => r.status === "Pending").length;
  const approvedCount = requestData.filter(
    (r) => r.status === "Approved"
  ).length;
  const disapproveCount = requestData.filter(
    (r) => r.status === "Disapproved"
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

  const fetchPetDetails = async (petId) => {
    try {
      if (!petId) return;
      const petRef = doc(db, "pet", petId);
      const petSnapshot = await getDocs(collection(db, "pet"));
      const found = petSnapshot.docs.find((doc) => doc.id === petId);
      if (found) {
        setPetDetails(found.data());
      } else {
        setPetDetails(null);
      }
    } catch (error) {
      console.error("Error fetching pet details:", error);
      setPetDetails(null);
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
        } else if (newStatus === "Disapproved") {
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

  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const renderSimpleTable = () => {
    if (filteredData.length === 0) {
      return <div>No {activeTab} requests found</div>;
    }

    return (
      <div style={{ overflowX: "auto", maxHeight: "500px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th
                style={{
                  ...tableHeaderStyle,
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                }}
              >
                Name
              </th>
              <th
                style={{
                  ...tableHeaderStyle,
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                }}
              >
                Email
              </th>
              <th
                style={{
                  ...tableHeaderStyle,
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                }}
              >
                Phone
              </th>
              <th
                style={{
                  ...tableHeaderStyle,
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                }}
              >
                Pet Type
              </th>
              <th
                style={{
                  ...tableHeaderStyle,
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                }}
              >
                Status
              </th>
              <th
                style={{
                  ...tableHeaderStyle,
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item) => (
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
                        : item.status === "Disapproved"
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
                      fetchPetDetails(item.petId);
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
                    // Show Disapprove button only if status is Pending
                    selectedRequest?.status === "Pending" && (
                      <Button
                        key="disapprove"
                        type="primary"
                        danger
                        loading={isDisapproving}
                        onClick={() => {
                          let reason = "";

                          Modal.confirm({
                            title: "Confirm Disapproval",
                            content: (
                              <div>
                                <p>
                                  Please provide a reason for disapproving{" "}
                                  <strong>{selectedRequest?.name}</strong>'s
                                  request.
                                </p>
                                <TextArea
                                  rows={4}
                                  placeholder="Enter reason here..."
                                  onChange={(e) => {
                                    reason = e.target.value;
                                  }}
                                />
                              </div>
                            ),
                            okText: "Submit Disapproval",
                            okType: "danger",
                            cancelText: "Cancel",
                            onOk: async () => {
                              if (!reason.trim()) {
                                message.warning("Please enter a reason.");
                                throw new Error("No reason provided");
                              }

                              setIsDisapproving(true);
                              try {
                                // Save reason to Firestore (add to request_form as 'disapprove_reason')
                                const requestRef = doc(
                                  db,
                                  "request_form",
                                  selectedRequest.id
                                );
                                await updateDoc(requestRef, {
                                  status: "Disapproved",
                                  disapprove_reason: reason.trim(),
                                });

                                // Update pet status
                                if (selectedRequest.petId) {
                                  const petRef = doc(
                                    db,
                                    "pet",
                                    selectedRequest.petId
                                  );
                                  await updateDoc(petRef, {
                                    status: "Available",
                                  });
                                }

                                message.success("Request disapproved.");
                                setIsModalOpen(false);
                                fetchRequests();
                              } catch (err) {
                                message.error("Disapproval failed.");
                              } finally {
                                setIsDisapproving(false);
                              }
                            },
                          });
                        }}
                      >
                        Disapprove
                      </Button>
                    ),

                    // Show Approve button if status is Pending OR Disapproved
                    (selectedRequest?.status === "Pending" ||
                      selectedRequest?.status === "Disapproved") && (
                      <Button
                        key="approve"
                        type="primary"
                        onClick={() => {
                          Modal.confirm({
                            title: "Confirm Approval",
                            content: (
                              <p>
                                Are you sure you want to{" "}
                                <strong>approve</strong> this adoption request
                                for <strong>{selectedRequest?.name}</strong>,
                                who wants to adopt a{" "}
                                <strong>{selectedRequest?.pettype}</strong>?
                              </p>
                            ),
                            okText: "Yes, Approve",
                            cancelText: "Cancel",
                            onOk: async () => {
                              setIsApproving(true);
                              try {
                                await handleStatusChange(
                                  selectedRequest.id,
                                  "Approved",
                                  selectedRequest.petId
                                );
                                setIsModalOpen(false);
                              } catch (err) {
                                message.error("Approval failed.");
                              } finally {
                                setIsApproving(false);
                              }
                            },
                          });
                        }}
                        style={{ marginLeft: 8 }}
                      >
                        Approve
                      </Button>
                    ),
                  ]}
                >
                  {selectedRequest ? (
                    <div>
                      <Image
                        src={petDetails?.images || petDetails?.photoUrl || ""}
                        alt="Pet Request"
                        width="100%"
                        height={250}
                        style={{
                          objectFit: "cover",
                          borderRadius: 8,
                          marginBottom: 16,
                        }}
                        preview={!!petDetails?.images}
                      />
                      <Typography.Title level={5} style={{ marginTop: 16 }}>
                        Pet Information
                      </Typography.Title>
                      <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="Name">
                          {petDetails?.pet_name || "N/A"}
                        </Descriptions.Item>

                        <Descriptions.Item label="Type">
                          {selectedRequest.pettype || "N/A"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Breed">
                          {selectedRequest.pet_breed || "N/A"}
                        </Descriptions.Item>
                        {petDetails && (
                          <Descriptions.Item label="Gender">
                            {petDetails.sex}
                          </Descriptions.Item>
                        )}

                        <Descriptions.Item label="Age">
                          {selectedRequest.age || "N/A"}
                        </Descriptions.Item>
                        {petDetails && (
                          <Descriptions.Item label="Size">
                            {petDetails.size || "N/A"}
                          </Descriptions.Item>
                        )}
                        <Descriptions.Item label="Color">
                          {selectedRequest.pet_color || "N/A"}
                        </Descriptions.Item>
                        {petDetails && (
                          <Descriptions.Item label="Arrival date">
                            {new Date(
                              petDetails.arrivaldate
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </Descriptions.Item>
                        )}
                      </Descriptions>
                      <Typography.Title level={5}>
                        Adopter Information
                      </Typography.Title>
                      {userDetails && (
                        <>
                          <Typography.Title
                            level={5}
                            style={{ marginTop: 16, textAlign: "left" }}
                          >
                            Adopter Valid ID
                          </Typography.Title>
                          <Descriptions bordered column={1}>
                            <Descriptions.Item label="Full Name">
                              {selectedRequest.name}
                            </Descriptions.Item>
                            <Descriptions.Item label="Age">
                              {selectedRequest.age}
                            </Descriptions.Item>
                            <Descriptions.Item label="Address">
                              {selectedRequest.address}
                            </Descriptions.Item>
                            <Descriptions.Item label="Email">
                              {selectedRequest.email}
                            </Descriptions.Item>
                            <Descriptions.Item label="Contact">
                              {selectedRequest.phone}
                            </Descriptions.Item>
                          </Descriptions>
                          <Typography.Title level={5} style={{ marginTop: 16 }}>
                            Valid ID
                          </Typography.Title>
                          <div style={{ textAlign: "left", marginTop: 16 }}>
                            <Image
                              src={userDetails.images3}
                              alt="Uploaded ID or Profile"
                              style={{
                                width: "100%",
                                maxWidth: 400,
                                height: 200,
                                borderRadius: 8,
                                marginBottom: 10,
                              }}
                            />
                          </div>
                        </>
                      )}

                      <Typography.Title level={5} style={{ marginTop: 16 }}>
                        Adoption Application Form
                      </Typography.Title>
                      <Typography.Title level={5} style={{ marginTop: 16 }}>
                        Household Information
                      </Typography.Title>
                      <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="Do you own or  rent your home?">
                          {selectedRequest.ownership}
                        </Descriptions.Item>
                        <Descriptions.Item label="Type of Residence">
                          {selectedRequest.residence}
                        </Descriptions.Item>
                        <Descriptions.Item label="How many adults live in your home?">
                          {selectedRequest.adults}
                        </Descriptions.Item>
                        <Descriptions.Item label="How many children (and their age)?">
                          {selectedRequest.children}
                        </Descriptions.Item>
                      </Descriptions>

                      <Typography.Title level={5} style={{ marginTop: 16 }}>
                        Pet Preference
                      </Typography.Title>
                      <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="Which pet are interested in adopting">
                          {selectedRequest.pet_interested}
                        </Descriptions.Item>
                        <Descriptions.Item label="Preferred age of pet">
                          {selectedRequest.age}
                        </Descriptions.Item>
                        <Descriptions.Item label="Preferred size">
                          {selectedRequest.pet_size}
                        </Descriptions.Item>
                        <Descriptions.Item label="Financial Responsibility">
                          {selectedRequest.financialresponsibility}
                        </Descriptions.Item>
                      </Descriptions>

                      <Typography.Title level={5} style={{ marginTop: 16 }}>
                        Care & Commitment
                      </Typography.Title>
                      <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="Do you currently have pets?">
                          {selectedRequest.currentpets}
                        </Descriptions.Item>
                        <Descriptions.Item label="Have you had pets int the past?">
                          {selectedRequest.pastpets || "N/A"}
                        </Descriptions.Item>
                        <Descriptions.Item label="How many hours per day will the prt left alone?">
                          {selectedRequest.hoursalone}
                        </Descriptions.Item>
                        <Descriptions.Item label="Where will the pet stay when your are not at home">
                          {selectedRequest.petstaywhenaway || "N/A"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Where will the pet sleep at night?">
                          {selectedRequest.pet_sleep_location || "N/A"}
                        </Descriptions.Item>
                      </Descriptions>

                      <Typography.Title level={5} style={{ marginTop: 16 }}>
                        Reference
                      </Typography.Title>
                      <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="Vaterinarian name">
                          {selectedRequest.vetname || "N/A"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Vaterinarian phone">
                          {selectedRequest.vetphone || "N/A"}
                        </Descriptions.Item>

                        <Descriptions.Item label="Personal reference name">
                          {selectedRequest.personal_reference}
                        </Descriptions.Item>
                        <Descriptions.Item label="Personal reference phone">
                          {selectedRequest.personal_refnumber}
                        </Descriptions.Item>
                      </Descriptions>

                      {selectedRequest?.status === "Disapproved" && (
                        <>
                          <Typography.Title
                            level={5}
                            style={{
                              color: "red",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <span role="img" aria-label="disapproved">
                              ❌
                            </span>
                            Disapproved Reason
                          </Typography.Title>

                          <Descriptions
                            column={1}
                            size="small"
                            contentStyle={{ color: "red", fontStyle: "italic" }}
                          >
                            <Descriptions.Item>
                              {selectedRequest.disapprove_reason ||
                                "No reason provided."}
                            </Descriptions.Item>
                          </Descriptions>
                        </>
                      )}
                    </div>
                  ) : (
                    <p>No request selected.</p>
                  )}
                </Modal>
              </tr>
            ))}
          </tbody>
        </table>
        <div
          style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}
        >
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={filteredData.length}
            onChange={(page) => setCurrentPage(page)}
            showSizeChanger={false}
          />
        </div>
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
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout>
        <HeaderBar userName={adminName} />
        <Content
          style={{
            margin: "20px",
            background: "#fff",
            borderRadius: "8px",
            marginTop: "70px",
          }}
        >
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
                {
                  key: "Disapproved",
                  label: `Disapproved (${disapproveCount})`,
                },
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
        </Content>
      </Layout>
    </Layout>
  );
}

export default ManageRequests;
