import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout, Card, Spin, Typography, Descriptions, Divider, Button, Select, Input, message, Image, Row, Col, Timeline } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import { doc, getDoc, updateDoc, addDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import Sidebar from "./Sidebar";
import HeaderBar from "./HeaderBar";

const { Title, Text } = Typography;
const { Content } = Layout;
const { Option } = Select;

const IncidentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reportDetails, setReportDetails] = useState(null);
  const [incidentHistory, setIncidentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const reportRef = doc(db, "pet_reports", id);
        const reportSnap = await getDoc(reportRef);

        if (reportSnap.exists()) {
          const data = reportSnap.data();
          setReportDetails(data);
          setStatus(data.status || "");
        }

        const historyQuery = query(collection(db, "incident_history"), where("incidentId", "==", id));
        const historySnapshot = await getDocs(historyQuery);
        const historyData = historySnapshot.docs.map((doc) => doc.data());
        setIncidentHistory(historyData);
      } catch (error) {
        console.error("Error fetching incident details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  const handleUpdate = async () => {
    if (!status) {
      message.error("Please select a status.");
      return;
    }

    try {
      const reportRef = doc(db, "pet_reports", id);

      await updateDoc(reportRef, {
        status,
        remarks,
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, "incident_history"), {
        incidentId: id,
        status,
        remarks,
        updatedBy: "Admin",
        updatedAt: serverTimestamp(),
      });

      setReportDetails((prev) => ({ ...prev, status, remarks }));
      setIncidentHistory((prev) => [
        ...prev,
        { status, remarks, updatedBy: "Admin", updatedAt: new Date() },
      ]);

      message.success("Incident updated successfully!");
    } catch (error) {
      console.error("Error updating incident:", error);
      message.error("Failed to update the incident.");
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout>
        <HeaderBar userName="Admin" />
        <Content style={{ padding: "20px" }}>
          {loading ? (
            <Spin
              tip="Loading Incident Details..."
              size="large"
              style={{ display: "block", textAlign: "center", marginTop: "50px" }}
            />
          ) : (
            <Card style={{ borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
              <Button type="default" style={{ marginBottom: "20px" }} onClick={() => navigate("/pet-reports")}>
                &larr; Back to Reports
              </Button>

              <Title level={2} style={{ textAlign: "center" }}>Incident Details</Title>

              {/* Image */}
              {reportDetails?.image && (
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <Image
                    src={reportDetails.image}
                    alt="Incident Image"
                    width={200}
                    style={{ borderRadius: "8px" }}
                  />
                </div>
              )}

              {/* Report Details in 4 Rows */}
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Descriptions bordered column={1}>
                    <Descriptions.Item label="Pet Name">{reportDetails?.pet_name || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label="Location Lost">{reportDetails?.location_lost || "N/A"}</Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col xs={24} md={12}>
                  <Descriptions bordered column={1}>
                    <Descriptions.Item label="Date Lost">{reportDetails?.date_lost || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label="Time Lost">{reportDetails?.time_lost || "N/A"}</Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col xs={24} md={12}>
                  <Descriptions bordered column={1}>
                    <Descriptions.Item label="Additional Info">{reportDetails?.additional_info || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label="Status">{reportDetails?.status || "N/A"}</Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col xs={24} md={12}>
                  <Descriptions bordered column={1}>
                    <Descriptions.Item label="Remarks">{reportDetails?.remarks || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label="Reported By">{reportDetails?.user || "N/A"}</Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>

              <Divider />

              {/* Update Incident - Only show if status is NOT Closed */}
                {status !== "Closed" && (
                <>
                    <Divider />
                    <Title level={4}>Update Incident</Title>
                        <Select
                        style={{ width: "100%", marginBottom: "10px" }}
                        placeholder="Select Status"
                        value={status}
                        onChange={(value) => setStatus(value)}
                        >
                            <Option value="In Progress">In Progress</Option>
                            <Option value="Resolved">Resolved</Option>
                            <Option value="Closed">Closed</Option>
                        </Select>
                    <Input.TextArea
                    rows={3}
                    placeholder="Add remarks..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    />
                    <Button
                    type="primary"
                    onClick={async () => {
                        await handleUpdate();
                        window.location.reload(); // Reload page after successful update
                    }}
                    style={{ marginTop: "10px" }}
                    >
                    Update Incident
                    </Button>
                </>
                )}

                <Divider />
                <Title level={4}>Incident History</Title>
                {incidentHistory.length > 0 ? (
                <Timeline
                    mode="left"
                    style={{ marginTop: "20px", paddingLeft: "10px" }}
                    pending={<Text type="secondary">Loading more updates...</Text>}
                >
                    {incidentHistory
                    .sort((a, b) => {
                        // Convert Firestore Timestamps or plain dates to milliseconds
                        const dateA = a.updatedAt?.seconds
                        ? a.updatedAt.seconds * 1000
                        : new Date(a.updatedAt).getTime();
                        const dateB = b.updatedAt?.seconds
                        ? b.updatedAt.seconds * 1000
                        : new Date(b.updatedAt).getTime();
                        return dateB - dateA; // Sort descending (latest first)
                    })
                    .map((history, index) => (
                        <Timeline.Item
                        key={index}
                        dot={
                            <ClockCircleOutlined
                            style={{
                                fontSize: "18px",
                                color: history.status === "Resolved" ? "#52c41a" : history.status === "Closed" ? "#ff4d4f" : "#1890ff",
                            }}
                            />
                        }
                        color={history.status === "Resolved" ? "green" : history.status === "Closed" ? "red" : "blue"}
                        >
                        <Card
                            hoverable
                            style={{
                            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                            borderRadius: "10px",
                            padding: "12px 16px",
                            background: "#ffffff", // Keep the background white
                            borderLeft: `5px solid ${
                                history.status === "Resolved"
                                ? "#52c41a" // Green for Resolved
                                : history.status === "Closed"
                                ? "#ff4d4f" // Red for Closed
                                : "#1890ff" // Blue for In Progress or others
                            }`,
                            }}
                        >
                            <Row>
                            <Col span={24}>
                                <Text strong>Status: </Text>
                                <Text
                                style={{
                                    color:
                                    history.status === "Resolved"
                                        ? "#52c41a"
                                        : history.status === "Closed"
                                        ? "#ff4d4f"
                                        : "#1890ff",
                                }}
                                >
                                {history.status}
                                </Text>
                            </Col>
                            <Col span={24} style={{ marginTop: "8px" }}>
                                <Text strong>Updated By: </Text>
                                {history.updatedBy}
                            </Col>
                            <Col span={24} style={{ marginTop: "8px" }}>
                                <Text strong>Updated At: </Text>
                                {history.updatedAt
                                ? history.updatedAt.seconds
                                    ? new Date(history.updatedAt.seconds * 1000).toLocaleString()
                                    : new Date(history.updatedAt).toLocaleString()
                                : "N/A"}
                            </Col>
                            {history.remarks && (
                                <Col span={24} style={{ marginTop: "8px" }}>
                                <Text strong>Remarks: </Text>
                                {history.remarks}
                                </Col>
                            )}
                            </Row>
                        </Card>
                        </Timeline.Item>
                    ))}
                </Timeline>
                ) : (
                <Text type="secondary" style={{ fontSize: "16px" }}>
                    No history available for this incident.
                </Text>
                )}
            </Card>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default IncidentDetails;
