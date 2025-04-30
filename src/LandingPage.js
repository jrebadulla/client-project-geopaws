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
import {
  UserOutlined,
  FileOutlined,
  SettingOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
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
  LabelList,
} from "recharts";
import Sidebar from "./components/Sidebar";
import HeaderBar from "./components/HeaderBar";
import { db } from "./firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import "./LandingPage.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  const [filteredTableData, setFilteredTableData] = useState([]);
  const [concernFilters, setConcernFilters] = useState([]);

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
        const adoptionPetsSnapshot = await getDocs(collection(db, "pet"));
        const adoptionPetsData = adoptionPetsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTableData(adoptionPetsData);
      } else if (category === "closedReports") {
        const petReportsSnapshot = await getDocs(collection(db, "pet_reports"));
        const petReportsData = petReportsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTableData(petReportsData);
        const uniqueConcerns = Array.from(
          new Set(petReportsData.map((doc) => doc.pet_name))
        ).map((concern) => ({
          text: concern,
          value: concern,
        }));

        setConcernFilters(uniqueConcerns);
      } else if (category === "closedReports") {
        const petReportsSnapshot = await getDocs(collection(db, "pet_reports"));
        const petReportsData = petReportsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTableData(petReportsData);
      } else if (category === "resolvedReports") {
        const reportsResolvedSnapshot = await getDocs(
          query(collection(db, "reports"), where("status", "==", "Resolved"))
        );
        const reportsResolvedData = reportsResolvedSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTableData(reportsResolvedData);
      } else if (category === "pendingRequests") {
        const requestsPendingSnapshot = await getDocs(
          query(collection(db, "request"))
        );
        const requestsPendingData = requestsPendingSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTableData(requestsPendingData);
      }
    } catch (error) {
      console.error("Error fetching table data:", error);
    } finally {
      setTableLoading(false);
    }
  };

  const handlePrint = () => {
    const doc = new jsPDF({ orientation: "landscape" });

    const columns = getColumns(selectedCategory)
      .filter((col) => col.dataIndex !== "images")
      .map((col) => ({
        header: col.title,
        dataKey: col.dataIndex,
      }));

    const dataToPrint =
      filteredTableData.length > 0 ? filteredTableData : tableData;

    const rows = dataToPrint.map((item) => {
      const row = {};
      columns.forEach((col) => {
        row[col.dataKey] = item[col.dataKey] || "";
      });
      return row;
    });

    doc.setFontSize(16);
    doc.text(getModalTitle(selectedCategory), 14, 20);

    autoTable(doc, {
      startY: 28,
      head: [columns.map((col) => col.header)],
      body: rows.map((row) => columns.map((col) => row[col.dataKey])),
      styles: {
        fontSize: 10,
        overflow: "linebreak",
        cellWidth: "wrap",
      },
      margin: { top: 30, left: 10, right: 10 },
      theme: "grid",
      headStyles: { fillColor: [24, 144, 255] },
      didDrawPage: (data) => {
        doc.setFontSize(16);
        doc.text(getModalTitle(selectedCategory), 14, 20);
      },
    });
    doc.save(`${getModalTitle(selectedCategory)}.pdf`);
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
    } else if (category === "pendingRequests") {
      return [
        { title: "Full Name", dataIndex: "fullname", key: "fullname" },
        { title: "Pet ID", dataIndex: "petId", key: "petId" },
        {
          title: "Status",
          dataIndex: "status",
          key: "status",
          filters: [
            { text: "Pending", value: "Pending" },
            { text: "Approved", value: "Approved" },
            { text: "Declined", value: "Declined" },
          ],
          onFilter: (value, record) => record.status === value,
        },

        { title: "User ID", dataIndex: "uid", key: "uid" },
      ];
    } else if (category === "closedReports") {
      return [
        {
          title: "Concern",
          dataIndex: "pet_name",
          key: "pet_name",
          filters: concernFilters,
          onFilter: (value, record) => record.pet_name === value,
        },

        {
          title: "Location",
          dataIndex: "location_lost",
          key: "location_lost",
        },
        { title: "Date", dataIndex: "date_lost", key: "date_lost" },
        { title: "Time", dataIndex: "time_lost", key: "time_lost" },
        {
          title: "Additional Info",
          dataIndex: "additional_info",
          key: "additional_info",
        },
        {
          title: "Status",
          dataIndex: "status",
          key: "status",
          filters: [
            { text: "In Progress", value: "In Progress" },
            { text: "Resolved", value: "Resolved" },
            { text: "Cancel", value: "Cancel" },
            { text: "Closed", value: "Closed" },
          ],
          onFilter: (value, record) => record.status === value,
        },
        { title: "Reported By", dataIndex: "user", key: "user" },
        {
          title: "Image",
          dataIndex: "image",
          key: "image",
          render: (img) =>
            img ? (
              <img
                src={img}
                alt="Lost Pet"
                style={{
                  width: "80px",
                  height: "80px",
                  objectFit: "cover",
                  borderRadius: "5px",
                }}
              />
            ) : (
              "No Image"
            ),
        },
      ];
    } else if (category === "pendingReports") {
      return [
        { title: "Pet Name", dataIndex: "pet_name", key: "pet_name" },
        {
          title: "Type",
          dataIndex: "type",
          key: "type",
          render: (type) => (Array.isArray(type) ? type.join(", ") : type),
        },
        { title: "Sex", dataIndex: "sex", key: "sex" },
        { title: "Age", dataIndex: "age", key: "age" },
        { title: "Color", dataIndex: "color", key: "color" },
        { title: "Size", dataIndex: "size", key: "size" },
        {
          title: "Breed",
          dataIndex: "breed",
          key: "breed",
        },
        {
          title: "Medical Conditions",
          dataIndex: "medical_conditions",
          key: "medical_conditions",
        },
        {
          title: "Temperament",
          dataIndex: "temperament",
          key: "temperament",
        },
        {
          title: "Training Level",
          dataIndex: "training_level",
          key: "training_level",
        },
        {
          title: "Good With",
          dataIndex: "good_with",
          key: "good_with",
          render: (good_with) =>
            Array.isArray(good_with) ? good_with.join(", ") : good_with,
        },
        {
          title: "Arrival Date",
          dataIndex: "arrivaldate",
          key: "arrivaldate",
        },
        {
          title: "Status",
          dataIndex: "status",
          key: "status",
          filters: [
            { text: "Available", value: "Available" },
            { text: "Adopted", value: "Adopted" },
          ],
          onFilter: (value, record) => record.status === value,
        },
        {
          title: "Image",
          dataIndex: "images",
          key: "images",
          render: (img) => (
            <img
              src={img}
              alt="Pet"
              style={{
                width: "80px",
                height: "80px",
                objectFit: "cover",
                borderRadius: "5px",
              }}
            />
          ),
        },
      ];
    }

    return [];
  };

  const getModalTitle = (category) => {
    switch (category) {
      case "users":
        return "User Details";
      case "pendingReports":
        return "Adoption Details";
      case "closedReports":
        return "Pet Reports Details";
      case "resolvedReports":
        return "Stray Animal Reports Details";
      case "pendingRequests":
        return "Pet Adoption Details";
      default:
        return "Details";
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));

        const availablePetsSnapshot = await getDocs(
          query(collection(db, "pet"))
        );
        const reportsClosedSnapshot = await getDocs(
          query(collection(db, "pet_reports"))
        );
        const reportsResolvedSnapshot = await getDocs(
          query(collection(db, "reports"), where("status", "==", "Resolved"))
        );

        const requestsPendingSnapshot = await getDocs(
          query(collection(db, "request"))
        );

        setDataSummary({
          usersCount: usersSnapshot.size,
          reportsPending: availablePetsSnapshot.size,
          reportsClosed: reportsClosedSnapshot.size,
          reportsResolved: reportsResolvedSnapshot.size,
          requestsPending: requestsPendingSnapshot.size,
        });

        setGraphData([
          { name: "Users", count: usersSnapshot.size || 0 },
          { name: "Adoption", count: availablePetsSnapshot.size || 0 },
          { name: "Closed Reports", count: reportsClosedSnapshot.size || 0 },
          {
            name: "Resolved Reports",
            count: reportsResolvedSnapshot.size || 0,
          },
          {
            name: "Pending Requests",
            count: requestsPendingSnapshot.size || 0,
          },
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A569BD"];

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
                    <Text>Member</Text>
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
                    <Text>Pet Lists</Text>
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
                    <Text>Pet Reports</Text>
                  </Card>
                </Col>
                {/* <Col xs={24} sm={12} md={8}>
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
                    <Text>Stray Animal Reports</Text>
                  </Card>
                </Col> */}
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
                    <Text>Pet Adoption</Text>
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
                        margin={{ top: 5, right: 20, bottom: 50, left: 0 }}
                      >
                        <XAxis
                          dataKey="name"
                          angle={-35}
                          textAnchor="end"
                          interval={0}
                        />

                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#1890ff">
                          <LabelList
                            dataKey="count"
                            position="top"
                            style={{ fill: "#000", fontWeight: "bold" }}
                          />
                        </Bar>
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
                          label={({ name, percent }) =>
                            `${name} (${(percent * 100).toFixed(0)}%)`
                          }
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
            bodyStyle={{
              maxHeight: "70vh",
              overflowY: "auto",
            }}
          >
            <Table
              dataSource={tableData}
              columns={getColumns(selectedCategory)}
              rowKey={(record) => record.id || record.uid}
              loading={tableLoading}
              pagination={false}
              onChange={(pagination, filters, sorter, extra) => {
                setFilteredTableData(extra.currentDataSource);
              }}
            />
            <Button
              type="primary"
              size="large"
              className="print-button"
              onClick={handlePrint}
            >
              Print <PrinterOutlined />
            </Button>
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default LandingPage;
