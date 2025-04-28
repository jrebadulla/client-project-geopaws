import React, { useEffect, useState } from "react";
import { Layout, Typography, Card, Row, Col, Button, Spin } from "antd";
import { UserOutlined, FileOutlined, SettingOutlined } from "@ant-design/icons";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import Sidebar from "./components/Sidebar";
import HeaderBar from "./components/HeaderBar";
import { db } from "./firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

const { Content } = Layout;
const { Title, Text } = Typography;

const LandingPage = ({ adminName }) => {
  const [dataSummary, setDataSummary] = useState({
    usersCount: 0,
    reportsPending: 0,
    reportsClosed: 0,
    reportsResolved: 0,
    requestsPending: 0,
  });

  const [loading, setLoading] = useState(true);

  const [graphData, setGraphData] = useState([]);

  // Fetch Data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));

        // Reports with status filters
        const reportsPendingSnapshot = await getDocs(
          query(collection(db, "reports"), where("status", "==", "Pending"))
        );
        const reportsClosedSnapshot = await getDocs(
          query(collection(db, "reports"), where("status", "==", "Closed"))
        );
        const reportsResolvedSnapshot = await getDocs(
          query(collection(db, "reports"), where("status", "==", "Resolved"))
        );

        // Requests with status filters
        const requestsPendingSnapshot = await getDocs(
          query(collection(db, "request"), where("status", "==", "Pending"))
        );

        setDataSummary({
          usersCount: usersSnapshot.size,
          reportsPending: reportsPendingSnapshot.size,
          reportsClosed: reportsClosedSnapshot.size,
          reportsResolved: reportsResolvedSnapshot.size,
          requestsPending: requestsPendingSnapshot.size,
        });

        setGraphData([
          { name: "Users", count: usersSnapshot.size },
          { name: "Pending Reports", count: reportsPendingSnapshot.size },
          { name: "Closed Reports", count: reportsClosedSnapshot.size },
          { name: "Resolved Reports", count: reportsResolvedSnapshot.size },
          { name: "Pending Requests", count: requestsPendingSnapshot.size },
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A569BD"]; // Colors for Pie Chart

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sidebar />

      <Layout>
        {/* Header */}
        <HeaderBar userName={adminName || "Admin"} />

        {/* Main Content */}
        <Content style={{ margin: "20px", background: "#fff", padding: "30px", borderRadius: "8px" }}>
          {loading ? (
            <Spin tip="Loading..." size="large" style={{ display: "block", textAlign: "center", marginTop: "50px" }} />
          ) : (
            <>
              {/* Summary Cards */}
              <Row gutter={[16, 16]} justify="center" style={{ marginBottom: "30px" }}>
                <Col xs={24} sm={12} md={8}>
                  <Card hoverable bordered style={{ textAlign: "center" }}>
                    <UserOutlined style={{ fontSize: "40px", color: "#1890ff", marginBottom: "10px" }} />
                    <Title level={4}>{dataSummary.usersCount}</Title>
                    <Text>Total Users</Text>
                  </Card>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Card hoverable bordered style={{ textAlign: "center" }}>
                    <FileOutlined style={{ fontSize: "40px", color: "#FFBB28", marginBottom: "10px" }} />
                    <Title level={4}>{dataSummary.reportsPending}</Title>
                    <Text>Pending Reports</Text>
                  </Card>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Card hoverable bordered style={{ textAlign: "center" }}>
                    <FileOutlined style={{ fontSize: "40px", color: "#52c41a", marginBottom: "10px" }} />
                    <Title level={4}>{dataSummary.reportsClosed}</Title>
                    <Text>Closed Reports</Text>
                  </Card>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Card hoverable bordered style={{ textAlign: "center" }}>
                    <FileOutlined style={{ fontSize: "40px", color: "#FF8042", marginBottom: "10px" }} />
                    <Title level={4}>{dataSummary.reportsResolved}</Title>
                    <Text>Resolved Reports</Text>
                  </Card>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Card hoverable bordered style={{ textAlign: "center" }}>
                    <SettingOutlined style={{ fontSize: "40px", color: "#faad14", marginBottom: "10px" }} />
                    <Title level={4}>{dataSummary.requestsPending}</Title>
                    <Text>Pending Requests</Text>
                  </Card>
                </Col>
              </Row>

              {/* Graph Section */}
              <Row gutter={[16, 16]} justify="center">
                <Col xs={24} md={12}>
                  <Card title="Data Summary (Bar Chart)" bordered>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={graphData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#1890ff" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </Col>

                <Col xs={24} md={12}>
                  <Card title="Data Distribution (Pie Chart)" bordered>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={graphData}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label
                        >
                          {graphData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default LandingPage;
