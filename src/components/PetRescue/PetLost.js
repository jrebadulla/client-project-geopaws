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
} from "antd";
import React, { useState, useEffect } from "react";
import HeaderBar from "../HeaderBar";
import Sidebar from "../Sidebar";
import TabPane from "antd/es/tabs/TabPane";

import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

import { db } from "../../firebase";
const { Title } = Typography;
const { Option } = Select;

const PetLost = ({ adminName }) => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [updatedStatus, setUpdatedStatus] = useState("In Progress");
  const [activeTab, setActiveTab] = useState("All");

  const fetchReports = async () => {
    try {
      const reportCollection = collection(db, "reports");
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
    if (activeTab === "Missing") return report.report_type === "Missing";
    if (activeTab === "In Progress" || activeTab === "Resolved") {
      return report.status === activeTab && report.report_type === "Missing";
    }
    return false;
  });

  const missingCount = reportData.filter(
    (r) => r.report_type === "Missing"
  ).length;

  const inProgressCount = reportData.filter(
    (r) => r.status === "In Progress" && r.report_type === "Missing"
  ).length;
  const resolvedCount = reportData.filter(
    (r) => r.status === "Resolved" && r.report_type === "Missing"
  ).length;

  const columns = [
    {
      title: "Name",
      dataIndex: "fullName",
      key: "fullName",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Location Found",
      dataIndex: "location",
      key: "location",
    },
    {
      title: "Type",
      dataIndex: ["typeOfAnimal", "dog"],
      key: "typeOfAnimal",
      render: (_, record) => {
        const type = record.typeOfAnimal;
        if (type?.dog) return "Dog";
        if (type?.cat) return "Cat";
        return "Other";
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (text) => {
        const colorMap = {
          Missing: "red",
          Resolved: "green",
          "In Progress": "gold",
          default: "gray",
        };

        const color = colorMap[text] || colorMap.default;

        return <Tag color={color}>{text || "For Rescue"}</Tag>;
      },
    },

    {
      title: "Date Spotted",
      dataIndex: "dateTimeSpotted",
      key: "dateTimeSpotted",
    },
    {
      title: "Photo",
      dataIndex: "photoUrl",
      key: "photoUrl",
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
            setUpdatedStatus(record.status); // sync dropdown with actual status
            setIsModalVisible(true);
          }}
        >
          {record.status === "Resolved" ? "View Details" : "View & Resolve"}
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flexGrow: 1 }}>
        <HeaderBar userName={adminName || "Admin"} />
        <div style={{ padding: "20px" }}>
          <Card
            bordered
            style={{
              marginBottom: "20px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
          >
            <Title level={3} style={{ textAlign: "center" }}>
              Pet Lost
            </Title>
          </Card>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key)}
            centered
          >
            <TabPane tab={`Missing (${missingCount})`} key="Missing" />
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
            bordered
            pagination={false}
          />

          <Modal
            title={<Title level={4}>Review Report Details</Title>}
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

                  <Select
                    value={updatedStatus}
                    onChange={(value) => setUpdatedStatus(value)}
                    style={{ width: 160 }}
                    placeholder="Select Status to Update"
                  >
                    <Option value="In Progress">In Progress</Option>
                    <Option value="Resolved">Resolved</Option>
                  </Select>

                  <Button
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
                              {selectedReport?.fullName}
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
                              "reports",
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
                  </Button>
                </Space>
              )
            }
          >
            {selectedReport && (
              <div>
                <Image
                  src={selectedReport.photoUrl}
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

                <Descriptions
                  column={1}
                  bordered
                  size="small"
                  labelStyle={{ fontWeight: 600 }}
                >
                  <Descriptions.Item label="Full Name">
                    {selectedReport.fullName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">
                    {selectedReport.email}
                  </Descriptions.Item>
                  <Descriptions.Item label="Phone">
                    {selectedReport.phone}
                  </Descriptions.Item>
                  <Descriptions.Item label="Location Found">
                    {selectedReport.location}
                  </Descriptions.Item>
                  <Descriptions.Item label="Date/Time Spotted">
                    {selectedReport.dateTimeSpotted}
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag
                      color={
                        selectedReport.status === "Missing"
                          ? "red"
                          : selectedReport.status === "Resolved"
                          ? "green"
                          : selectedReport.status === "In Progress"
                          ? "gold"
                          : "default"
                      }
                    >
                      {selectedReport.status}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Description">
                    {selectedReport.description}
                  </Descriptions.Item>
                  <Descriptions.Item label="Animal Still There">
                    {selectedReport.animalStillThere}
                  </Descriptions.Item>
                  <Descriptions.Item label="Can Secure Animal">
                    {selectedReport.canSecureAnimal}
                  </Descriptions.Item>
                  <Descriptions.Item label="Immediate Danger">
                    {selectedReport.immediateDanger}
                  </Descriptions.Item>
                  <Descriptions.Item label="Condition">
                    {selectedReport.condition || "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Remarks">
                    {selectedReport.remarks || "None"}
                  </Descriptions.Item>
                </Descriptions>

                <Divider />

                <Title level={5}>Behavior Observed</Title>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {selectedReport.behaviorObserved &&
                    Object.entries(selectedReport.behaviorObserved)
                      .filter(([_, value]) => value)
                      .map(([key]) => (
                        <Tag key={key} color="blue">
                          {key}
                        </Tag>
                      ))}
                </div>

                <Divider />

                <Title level={5}>Type of Animal</Title>
                <div style={{ display: "flex", gap: 8 }}>
                  {selectedReport.typeOfAnimal &&
                    Object.entries(selectedReport.typeOfAnimal)
                      .filter(([_, value]) => value)
                      .map(([key]) => (
                        <Tag key={key} color="purple">
                          {key}
                        </Tag>
                      ))}
                </div>
              </div>
            )}
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default PetLost;
