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
  Dropdown,
  Menu,
} from "antd";
import {
  UserOutlined,
  FileOutlined,
  SettingOutlined,
  PrinterOutlined,
  FilterOutlined,
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
  const [petStatusFilter, setPetStatusFilter] = useState(null);

  const handleCardClick = async (category) => {
    setSelectedCategory(category);
    setModalVisible(true);
    setTableLoading(true);
    setFilteredTableData([]);

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
        setFilteredTableData(adoptionPetsData);
        setPetStatusFilter(null);
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
    const pageWidth = doc.internal.pageSize.getWidth();

    const logo = new Image();
    logo.src = "/logo-brgy.png"; 

    logo.onload = () => {
      const logoWidth = 30;
      const logoHeight = 30;
      const lineHeight = 6;

      const headerLines = [
        "Republic of the Philippines",
        "Province of Laguna",
        "BARANGAY GOVERNMENT OF PACITA",
        "CITY OF SAN PEDRO",
        "Tel. Nos.: (02) 8868-03-62",
        "OFFICE OF THE PUNONG BARANGAY",
      ];

      const textHeight = headerLines.length * lineHeight;
      const maxTextWidth = Math.max(
        ...headerLines.map((line) => doc.getTextWidth(line))
      );
      const totalHeaderWidth = logoWidth + 10 + maxTextWidth;

      const startX = (pageWidth - totalHeaderWidth) / 2;
      const logoY = 12 + (textHeight - logoHeight) / 2;

      const textX = startX + logoWidth + 10;
      const titleY = logoY + textHeight + 10;

      const originalColumns = getColumns(selectedCategory).filter(
        (col) => !["image", "images"].includes(col.dataIndex)
      );

      const autoTableColumns = [
        { header: "No.", dataKey: "no" },
        ...originalColumns.map((col) => ({
          header: col.title,
          dataKey: col.dataIndex,
        })),
      ];

      const rawData =
        selectedCategory === "pendingReports" && filteredTableData.length > 0
          ? filteredTableData
          : tableData;

      const dataToPrint = rawData.map((item, index) => {
        const row = { no: index + 1 };
        originalColumns.forEach((col) => {
          const value = item[col.dataIndex];
          row[col.dataIndex] =
            value !== undefined && value !== null
              ? Array.isArray(value)
                ? value.join(", ")
                : value
              : "";
        });
        return row;
      });

      const chunkedData = [];
      for (let i = 0; i < dataToPrint.length; i += 10) {
        chunkedData.push(dataToPrint.slice(i, i + 10));
      }

      chunkedData.forEach((chunk, index) => {
        if (index > 0) doc.addPage();

        autoTable(doc, {
          startY: titleY + 10,
          columns: autoTableColumns,
          body: chunk,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [91, 155, 213] },
          margin: { top: 70, left: 14, right: 14 },
          theme: "grid",
          didDrawPage: () => {
            doc.addImage(logo, "PNG", startX, logoY, logoWidth, logoHeight);
            headerLines.forEach((line, i) => {
              const y = logoY + i * lineHeight;
              doc.setFont(
                undefined,
                [
                  "BARANGAY GOVERNMENT OF PACITA",
                  "OFFICE OF THE PUNONG BARANGAY",
                ].includes(line)
                  ? "bold"
                  : "normal"
              );
              doc.setFontSize(11);
              doc.text(line, textX, y);
            });
            doc.setFontSize(16);
            doc.setFont(undefined, "bold");
            let pdfTitle = getModalTitle(selectedCategory);
            if (selectedCategory === "pendingReports") {
              if (petStatusFilter === "Available") {
                pdfTitle = "LIST OF AVAILABLE PETS";
              } else if (petStatusFilter === "Adopted") {
                pdfTitle = "LIST OF ADOPTED PETS";
              }
            }

            doc.text(pdfTitle, pageWidth / 2, titleY, {
              align: "center",
            });

            doc.setFontSize(12);
            doc.setFont(undefined, "bold");
            doc.text(
              `Date: ${new Date().toLocaleDateString()}`,
              pageWidth - 44,
              titleY
            );
          },
        });

        if (index === chunkedData.length - 1) {
          const baseY = doc.lastAutoTable.finalY + 20;
          const marginLeft = 30;
          const rowenaLeft = marginLeft + 30;
          const titleLeft = marginLeft + 27;

          doc.setFontSize(12);
          doc.setFont(undefined, "bold");
          doc.text("Prepared by:", marginLeft, baseY);

          doc.setFont(undefined, "normal");
          doc.text("Rowena Que", rowenaLeft, baseY + 7);
          doc.text("Barangay Admin", titleLeft, baseY + 14);
        }
      });

      window.open(doc.output("bloburl"), "_blank");
    };
  };

  const getColumns = (category) => {
    if (category === "users") {
      return [
        { title: "First Name", dataIndex: "firstname", key: "firstname" },
        { title: "Last Name", dataIndex: "lastname", key: "lastname" },
        { title: "Email", dataIndex: "email", key: "email" },
        { title: "Contact", dataIndex: "contact", key: "contact" },
        { title: "Address", dataIndex: "address", key: "address" },
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
          title: "Report Type",
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
          title: "Arrival Date",
          dataIndex: "arrivaldate",
          key: "arrivaldate",
        },
      ];
    }

    return [];
  };

  const getModalTitle = (category) => {
    switch (category) {
      case "users":
        return "LIST OF USERS";
      case "pendingReports":
        return "PET LIST";
      case "closedReports":
        return "Pet Reports Details";
      case "resolvedReports":
        return "Stray Animal Reports Details";
      case "pendingRequests":
        return "LIST OF AVAILABLE PETS";
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
      <Sidebar />

      <Layout>
        <HeaderBar userName={adminName || "Admin"} />

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
              <Row
                gutter={[16, 16]}
                justify="center"
                style={{ marginBottom: "30px" }}
              >
                <Col xs={24} sm={12} md={6}>
                  <Card
                    hoverable
                    bordered
                    style={{ textAlign: "center", height: "180px" }}
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
                <Col xs={24} sm={12} md={6}>
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

                <Col xs={24} sm={12} md={6}>
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
                    <Text>Pet Rescue</Text>
                  </Card>
                </Col>

                <Col xs={24} sm={12} md={6}>
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
            title={
              selectedCategory === "pendingReports" ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <span style={{ fontWeight: "bold", fontSize: 16 }}>
                    PET LIST
                  </span>
                  <Dropdown
                    overlay={
                      <Menu
                        onClick={({ key }) => {
                          setPetStatusFilter(key === "all" ? null : key);
                          const filtered =
                            key === "all"
                              ? tableData
                              : tableData.filter((item) => item.status === key);
                          setFilteredTableData(filtered);
                        }}
                        selectedKeys={[petStatusFilter || "all"]}
                      >
                        <Menu.Item key="all">All Status</Menu.Item>
                        <Menu.Item key="Available">Available</Menu.Item>
                        <Menu.Item key="Adopted">Adopted</Menu.Item>
                      </Menu>
                    }
                    placement="bottomLeft"
                    trigger={["click"]}
                  >
                    <Button icon={<FilterOutlined />} size="small">
                      {petStatusFilter}
                    </Button>
                  </Dropdown>
                </div>
              ) : (
                getModalTitle(selectedCategory)
              )
            }
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
              dataSource={
                selectedCategory === "pendingReports"
                  ? filteredTableData
                  : tableData
              }
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
