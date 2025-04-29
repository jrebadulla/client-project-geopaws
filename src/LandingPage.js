import React, { useEffect, useState } from "react";
import {
  Layout,
  Typography,
  Card,
  Row,
  Col,
  Button,
  Spin,
  Modal,
  Table,
} from "antd";
import { UserOutlined, FileOutlined, SettingOutlined } from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
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

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const handleCardClick = async (category) => {
    setSelectedCategory(category);
    setModalVisible(true);
    setTableLoading(true);

    try {
      if (category === "users") {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersData = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTableData(usersData);
      } else if (category === "pendingReports") {
        const pendingReportsSnapshot = await getDocs(
          query(collection(db, "reports"), where("status", "==", "Pending"))
        );
        const pendingReportsData = pendingReportsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTableData(pendingReportsData);
      }
      // Add more categories if needed
    } catch (error) {
      console.error("Error fetching table data:", error);
    } finally {
      setTableLoading(false);
    }
  };

  const getColumns = (category) => {
    if (category === "users") {
      return [
        { title: "First Name", dataIndex: "firstname", key: "firstname" },
        { title: "Last Name", dataIndex: "lastname", key: "lastname" },
        { title: "Email", dataIndex: "email", key: "email" },
        { title: "Contact", dataIndex: "contact", key: "contact" },
        { title: "Address", dataIndex: "address", key: "address" },
        { title: "Age", dataIndex: "age", key: "age" },
        { title: "Type", dataIndex: "type", key: "type" },
      ];
    } else if (
      category === "pendingReports" ||
      category === "closedReports" ||
      category === "resolvedReports"
    ) {
      return [
        { title: "Title", dataIndex: "title", key: "title" },
        { title: "Description", dataIndex: "description", key: "description" },
        { title: "Status", dataIndex: "status", key: "status" },
        { title: "Reported By", dataIndex: "reportedBy", key: "reportedBy" },
        { title: "Date", dataIndex: "date", key: "date" },
      ];
    } else if (category === "pendingRequests") {
      return [
        { title: "Request Title", dataIndex: "title", key: "title" },
        {
          title: "Request Description",
          dataIndex: "description",
          key: "description",
        },
        { title: "Status", dataIndex: "status", key: "status" },
        { title: "Requested By", dataIndex: "requestedBy", key: "requestedBy" },
        { title: "Date", dataIndex: "date", key: "date" },
      ];
    }
    return [];
  };

  const getModalTitle = (category) => {
    switch (category) {
      case "users":
        return "User Details";
      case "pendingReports":
        return "Pending Reports Details";
      case "closedReports":
        return "Closed Reports Details";
      case "resolvedReports":
        return "Resolved Reports Details";
      case "pendingRequests":
        return "Pending Requests Details";
      default:
        return "Details";
    }
  };

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
        <Content
          style={{
            margin: "20px",
            background: "#fff",
            padding: "30px",
            borderRadius: "8px",
          }}
        >
          {loading ? (
            <Spin
              tip="Loading..."
              size="large"
              style={{
                display: "block",
                textAlign: "center",
                marginTop: "50px",
              }}
            />
          ) : (
            <>
              {/* Summary Cards */}
              <Row
                gutter={[16, 16]}
                justify="center"
                style={{ marginBottom: "30px" }}
              >
                <Col xs={24} sm={12} md={8}>
                  <Card
                    hoverable
                    bordered
                    style={{ textAlign: "center" }}
                    onClick={() => handleCardClick("users")}
                  >
                    <UserOutlined
                      style={{
                        fontSize: "40px",
                        color: "#1890ff",
                        marginBottom: "10px",
                      }}
                    />
                    <Title level={4}>{dataSummary.usersCount}</Title>
                    <Text>Total Users</Text>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Card
                    hoverable
                    bordered
                    style={{ textAlign: "center" }}
                    onClick={() => handleCardClick("pendingReports")}
                  >
                    <FileOutlined
                      style={{
                        fontSize: "40px",
                        color: "#FFBB28",
                        marginBottom: "10px",
                      }}
                    />
                    <Title level={4}>{dataSummary.reportsPending}</Title>
                    <Text>Pending Reports</Text>
                  </Card>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Card
                    hoverable
                    bordered
                    style={{ textAlign: "center" }}
                    onClick={() => handleCardClick("closedReports")}
                  >
                    <FileOutlined
                      style={{
                        fontSize: "40px",
                        color: "#52c41a",
                        marginBottom: "10px",
                      }}
                    />
                    <Title level={4}>{dataSummary.reportsClosed}</Title>
                    <Text>Closed Reports</Text>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Card
                    hoverable
                    bordered
                    style={{ textAlign: "center" }}
                    onClick={() => handleCardClick("resolvedReports")}
                  >
                    <FileOutlined
                      style={{
                        fontSize: "40px",
                        color: "#FF8042",
                        marginBottom: "10px",
                      }}
                    />
                    <Title level={4}>{dataSummary.reportsResolved}</Title>
                    <Text>Resolved Reports</Text>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Card
                    hoverable
                    bordered
                    style={{ textAlign: "center" }}
                    onClick={() => handleCardClick("pendingRequests")}
                  >
                    <SettingOutlined
                      style={{
                        fontSize: "40px",
                        color: "#faad14",
                        marginBottom: "10px",
                      }}
                    />
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
                      <BarChart
                        data={graphData}
                        margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                      >
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
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
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
          <Modal
            title={getModalTitle(selectedCategory)}
            visible={modalVisible}
            onCancel={() => setModalVisible(false)}
            footer={null}
            width="80%"
            centered
          >
            <Table
              dataSource={tableData}
              columns={getColumns(selectedCategory)}
              rowKey={(record) => record.id || record.uid} // fallback
              loading={tableLoading}
              pagination={{ pageSize: 5 }}
              scroll={{ x: true }}
            />
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default LandingPage;
