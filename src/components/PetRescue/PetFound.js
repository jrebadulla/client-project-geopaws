import {
  Button,
  Card,
  Descriptions,
  Divider,
  message,
  Modal,
  Table,
  Tabs,
  Typography,
  Image,
  Tag,
  Select,
  Space,
  Layout,
} from "antd";
import React, { useState, useEffect } from "react";
import HeaderBar from "../HeaderBar";
import Sidebar from "../Sidebar";
import TabPane from "antd/es/tabs/TabPane";

import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

import { db } from "../../firebase";
import { Content } from "antd/es/layout/layout";
const { Title } = Typography;
const { Option } = Select;

const PetFound = ({ adminName }) => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [updatedStatus, setUpdatedStatus] = useState("In Progress");
  const [activeTab, setActiveTab] = useState("pending");

  const fetchReports = async () => {
    try {
      const reportCollection = collection(db, "animal_reports");
      const snapshot = await getDocs(reportCollection);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReportData(data);
    } catch (error) {
      console.error("Error fetching reports:", error);
      message.error("Failed to fetch report data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredData = reportData.filter((report) => {
    if (activeTab === "pending") return report.status === "pending";
    if (activeTab === "In Progress") return report.status === "In Progress";
    if (activeTab === "Resolved") return report.status === "Resolved";
    return false;
  });

  const strayCount = reportData.filter((r) => r.status === "pending").length;
  const inProgressCount = reportData.filter(
    (r) => r.status === "In Progress"
  ).length;
  const resolvedCount = reportData.filter(
    (r) => r.status === "Resolved"
  ).length;

  const columns = [
    {
      title: "Type",
      dataIndex: "animalType",
      key: "animalType",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (text) => {
        const colorMap = {
          pending: "yellow",
          Resolved: "green",
          "In Progress": "blue",
          default: "gray",
        };

        const color = colorMap[text] || colorMap.default;

        return <Tag color={color}>{text || "For Rescue"}</Tag>;
      },
    },

    {
      title: <div style={{ whiteSpace: "nowrap" }}>Date Reported</div>,
      dataIndex: "reportDate",
      key: "reportDate",
      width: 160,
      render: (value) =>
        value?.toDate ? value.toDate().toLocaleString() : value || "N/A",
    },

    {
      title: "Photo",
      dataIndex: "imageUrls",
      key: "imageUrls",
      render: (url) => (
        <img
          src={url}
          alt="Pet"
          style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 4 }}
        />
      ),
    },

    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          type="primary"
          onClick={() => {
            setSelectedReport(record);
            setUpdatedStatus(record.status);
            setIsModalVisible(true);
          }}
        >
          {record.status === "Resolved" ? "View Details" : "View & Resolve"}
        </Button>
      ),
    },
  ];

  const formatTime = (hour, minute) => {
    const date = new Date();
    date.setHours(hour);
    date.setMinutes(minute);

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout>
        <HeaderBar userName={adminName || "Admin"} />
        <Content
          style={{
            margin: "20px",
            background: "#fff",
            borderRadius: "8px",
            marginTop: "70px",
          }}
        >
          <Card
            bordered
            style={{
              marginBottom: "20px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
          >
            <Title level={3} style={{ textAlign: "center" }}>
              Pet Found
            </Title>
          </Card>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key)}
            centered
          >
            <TabPane tab={`pending (${strayCount})`} key="pending" />

            <TabPane
              tab={`In Progress (${inProgressCount})`}
              key="In Progress"
            />
            <TabPane tab={`Resolved (${resolvedCount})`} key="Resolved" />
          </Tabs>

          <Table
            dataSource={filteredData}
            columns={columns}
            loading={loading}
            rowKey="id"
            scroll={{ x: "max-content", y: 400 }}
            pagination={{ pageSize: 10 }}
          />

          <Modal
            title={
              selectedReport ? (
                <Title level={5}>
                  Review Missing {selectedReport.petType || "Pet"}
                </Title>
              ) : (
                <Title level={5}>Loading...</Title>
              )
            }
            visible={isModalVisible}
            centered
            width={600}
            bodyStyle={{
              height: "400px",
              overflowY: "auto",
            }}
            onCancel={() => setIsModalVisible(false)}
            footer={
              selectedReport?.status === "Resolved" ? (
                <Button onClick={() => setIsModalVisible(false)}>Close</Button>
              ) : (
                <Space>
                  <Button onClick={() => setIsModalVisible(false)}>
                    Cancel
                  </Button>

                  {/* <Select
                          value={updatedStatus}
                          onChange={(value) => setUpdatedStatus(value)}
                          style={{ width: 160 }}
                          disabled={selectedReport?.status === "Resolved"}
                        >
                          {selectedReport?.status === "pending" && (
                            <Option value="In Progress">In Progress</Option>
                          )}
                          {selectedReport?.status === "In Progress" && (
                            <Option value="Resolved">Resolved</Option>
                          )}
                        </Select> */}

                  {/* <Button
                          type="primary"
                          onClick={() => {
                            Modal.confirm({
                              title: `Are you sure you want to mark this report as "${updatedStatus}"?`,
                              content: (
                                <div>
                                  <p>
                                    <strong>Description:</strong>{" "}
                                    {selectedReport?.description || "No description"}
                                  </p>
                                  <p>
                                    <strong>Reported by:</strong>{" "}
                                    {selectedReport?.name}
                                  </p>
                                  <p>
                                    <strong>Location Found:</strong>{" "}
                                    {selectedReport?.location}
                                  </p>
                                </div>
                              ),
                              okText: `Yes, mark as ${updatedStatus}`,
                              cancelText: "Cancel",
                              onOk: async () => {
                                try {
                                  const reportRef = doc(
                                    db,
                                    "pet_reports",
                                    selectedReport.id
                                  );
                                  await updateDoc(reportRef, {
                                    status: updatedStatus,
                                  });
                                  message.success(
                                    `Report marked as "${updatedStatus}"`
                                  );
                                  setIsModalVisible(false);
                                  fetchReports();
                                } catch (error) {
                                  message.error("Failed to update report.");
                                }
                              },
                            });
                          }}
                        >
                          Update Status
                        </Button> */}
                  <Button
                    type="primary"
                    onClick={() => {
                      let nextStatus = null;

                      if (selectedReport?.status === "pending") {
                        nextStatus = "In Progress";
                      } else if (selectedReport?.status === "In Progress") {
                        nextStatus = "Resolved";
                      }

                      if (!nextStatus) return;

                      Modal.confirm({
                        title: `Are you sure you want to mark this report as "${nextStatus}"?`,
                        content: (
                          <div>
                            <p>
                              <strong>Description:</strong>{" "}
                              {selectedReport?.description || "No description"}
                            </p>
                            <p>
                              <strong>Reported by:</strong>{" "}
                              {selectedReport?.name}
                            </p>
                            <p>
                              <strong>Location Found:</strong>{" "}
                              {selectedReport?.location}
                            </p>
                          </div>
                        ),
                        okText: `Yes, mark as ${nextStatus}`,
                        cancelText: "Cancel",
                        onOk: async () => {
                          try {
                            const reportRef = doc(
                              db,
                              "pet_reports",
                              selectedReport.id
                            );
                            await updateDoc(reportRef, {
                              status: nextStatus,
                              updatedAt: new Date(),
                            });
                            message.success(`Report marked as "${nextStatus}"`);
                            setIsModalVisible(false);
                            fetchReports();
                          } catch (error) {
                            message.error("Failed to update report.");
                          }
                        },
                      });
                    }}
                  >
                    {selectedReport?.status === "pending"
                      ? "Mark as In Progress"
                      : selectedReport?.status === "In Progress"
                      ? "Mark as Resolved"
                      : "Status Updated"}
                  </Button>
                </Space>
              )
            }
          >
            {selectedReport && (
              <div>
                <Image
                  src={selectedReport.imageUrls}
                  alt="Reported Pet"
                  width="100%"
                  height={250}
                  style={{
                    objectFit: "cover",
                    borderRadius: 8,
                    marginBottom: 16,
                  }}
                  preview={true}
                />

                <Title level={5}>Pet Information</Title>

                <Descriptions
                  column={1}
                  bordered
                  size="small"
                  labelStyle={{ fontWeight: 600 }}
                >
                  {/* <Descriptions.Item label="Full Name">
                          {selectedReport.name}
                        </Descriptions.Item>
                        <Descriptions.Item label="Email">
                          {selectedReport.email}
                        </Descriptions.Item>
                        <Descriptions.Item label="Phone">
                          {selectedReport.phone}
                        </Descriptions.Item> */}
                  <Descriptions.Item label="Number of Stray Animal Seen">
                    {selectedReport.numberOfAnimals}
                  </Descriptions.Item>
                  <Descriptions.Item label="Breed">
                    {selectedReport.breed}
                  </Descriptions.Item>
                  <Descriptions.Item label="Color Markings">
                    {selectedReport.colorMarkings}
                  </Descriptions.Item>
                  <Descriptions.Item label="Gender">
                    {selectedReport.gender}
                  </Descriptions.Item>
                  {/* <Descriptions.Item label="Age">
                    {selectedReport.age}
                  </Descriptions.Item> */}
                  <Descriptions.Item label="Size">
                    {selectedReport.size}
                  </Descriptions.Item>
                </Descriptions>

                <Divider />
                <Title level={5}>Location Details</Title>
                <Descriptions
                  column={1}
                  bordered
                  size="small"
                  labelStyle={{ fontWeight: 600 }}
                >
                  <Descriptions.Item label="Date and Time Seen Missing">
                    {selectedReport.reportDate?.toDate().toLocaleString()}
                  </Descriptions.Item>
                  <Descriptions.Item label="Location Last Seen">
                    City of San Pedro, Laguna
                  </Descriptions.Item>

                  <Descriptions.Item label="Barangay">
                    {"Pacita 1"}
                  </Descriptions.Item>
                  {/* <Descriptions.Item label="Circumstances">
                    {selectedReport.circumstances}
                  </Descriptions.Item> */}
                </Descriptions>

                {/* <Divider />
                <Title level={5}> Behavior Observed</Title>
                <Descriptions
                  column={1}
                  bordered
                  size="small"
                  labelStyle={{ fontWeight: 600 }}
                >
              
                  <Descriptions.Item label="Medical Conditions/Special Needs">
                    {selectedReport.medicalConditions}
                  </Descriptions.Item>
                </Descriptions> */}

                <Divider />

                <Title level={5}>behaviorObserved</Title>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {Array.isArray(selectedReport.behaviorObserved) &&
                    selectedReport.behaviorObserved.map((behavior, index) => (
                      <Tag key={index} color="blue">
                        {behavior}
                      </Tag>
                    ))}
                </div>

                <Divider />

                <Title level={5}>Status</Title>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {selectedReport.status &&
                    selectedReport.status
                      .split(",")
                      .map((item) => (
                        <Tag
                          color={
                            selectedReport.status === "pending"
                              ? "yellow"
                              : selectedReport.status === "Resolved"
                              ? "green"
                              : selectedReport.status === "In Progress"
                              ? "blue"
                              : "default"
                          }
                        >
                          {selectedReport.status}
                        </Tag>
                      ))}
                </div>

                <Divider />

                <Title level={5}>Type of Animal</Title>
                <div style={{ display: "flex", gap: 8 }}>
                  {selectedReport.animalType &&
                    selectedReport.animalType.split(",").map((item) => (
                      <Tag key={item.trim()} color="purple">
                        {item.trim()}
                      </Tag>
                    ))}
                </div>
              </div>
            )}
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default PetFound;
