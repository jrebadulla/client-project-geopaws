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
  const [activeTab, setActiveTab] = useState("Stray");

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
    if (activeTab === "Stray")
      return (
        report.report_type === "Stray" &&
        report.status !== "In Progress" &&
        report.status !== "Resolved"
      );

    if (activeTab === "In Progress" || activeTab === "Resolved") {
      return report.status === activeTab && report.report_type === "Stray";
    }
    return false;
  });

  const strayCount = reportData.filter(
    (r) =>
      r.report_type === "Stray" &&
      r.status !== "In Progress" &&
      r.status !== "Resolved"
  ).length;

  const inProgressCount = reportData.filter(
    (r) => r.status === "In Progress" && r.report_type === "Stray"
  ).length;
  const resolvedCount = reportData.filter(
    (r) => r.status === "Resolved" && r.report_type === "Stray"
  ).length;
  const columns = [
    {
      title: "Reported by",
      dataIndex: "name",
      key: "name",
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
          Stray: "blue",
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
            setUpdatedStatus(record.status);
            setIsModalVisible(true);
          }}
        >
          {record.status === "Resolved" ? "View Details" : "View & Resolve"}
        </Button>
      ),
    },
  ];

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
            <TabPane tab={`Stray (${strayCount})`} key="Stray" />

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

                <Title level={5}>Reporter Information ℹ️</Title>
                <Descriptions
                  column={1}
                  bordered
                  size="small"
                  labelStyle={{ fontWeight: 600 }}
                >
                  <Descriptions.Item label="Full Name">
                    {selectedReport.name}
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
                        selectedReport.status === "Stray"
                          ? "blue"
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
        </Content>
      </Layout>
    </Layout>
  );
};

export default PetFound;
