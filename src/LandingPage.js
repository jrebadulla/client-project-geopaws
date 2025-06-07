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
  const [adoptionStatusFilter, setAdoptionStatusFilter] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [filteredTableData, setFilteredTableData] = useState([]);
  const [concernFilters, setConcernFilters] = useState([]);
  const [petStatusFilter, setPetStatusFilter] = useState(null);
  const [adoptionStatusOptions, setAdoptionStatusOptions] = useState([]);

  const handleCardClick = async (category) => {
    setSelectedCategory(category);
    setModalVisible(true);
    setTableLoading(true);
    setFilteredTableData([]);

    try {
      if (category === "users") {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersData = usersSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((user) => user.type !== "admin");

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
        const petReportsSnapshot = await getDocs(collection(db, "reports"));
        const petReportsData = petReportsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTableData(petReportsData);
        const uniqueConcerns = Array.from(
          new Set(
            petReportsData
              .map((doc) => doc.report_type && doc.report_type.trim())
              .filter(Boolean)
          )
        ).map((concern) => ({
          text:
            concern === "Stray"
              ? "Pet Found"
              : concern === "Missing"
              ? "Pet Lost"
              : concern,
          value: concern,
        }));
        setConcernFilters(uniqueConcerns);

        setConcernFilters(uniqueConcerns);
        setFilteredTableData(petReportsData);
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
          query(collection(db, "request_form"))
        );
        const requestsPendingData = requestsPendingSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTableData(requestsPendingData);
        setFilteredTableData(requestsPendingData);

        // Dynamically extract status values
        const uniqueStatuses = Array.from(
          new Set(requestsPendingData.map((item) => item.status))
        ).filter(Boolean);
        setAdoptionStatusOptions(uniqueStatuses); // Store this in state
      } else if (category === "closedReports") {
        const petReportsSnapshot = await getDocs(
          query(collection(db, "reports"), where("status", "==", "Closed"))
        );
        const petReportsData = petReportsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTableData(petReportsData);

        const uniqueConcerns = Array.from(
          new Set(
            petReportsData
              .map((doc) => doc.report_type && doc.report_type.trim())
              .filter(Boolean)
          )
        ).map((concern) => ({
          text:
            concern === "Stray"
              ? "Pet Found"
              : concern === "Missing"
              ? "Pet Lost"
              : concern,
          value: concern,
        }));
        setConcernFilters(uniqueConcerns);

        setConcernFilters(uniqueConcerns);
        setFilteredTableData(petReportsData);
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

      // Special case for ADOPTION LIST
      if (selectedCategory === "pendingRequests") {
        const autoTableColumns = [
          { header: "No.", dataKey: "no" },
          { header: "Adopter Name", dataKey: "name" },
          { header: "Animal Type", dataKey: "pettype" },
          { header: "Date of Adopted", dataKey: "timestamp" },
          { header: "Email", dataKey: "email" },
          { header: "Status", dataKey: "status" },
        ];

        const rawData =
          adoptionStatusFilter && filteredTableData.length > 0
            ? filteredTableData
            : tableData;

        const dataToPrint = rawData.map((item, index) => ({
          no: index + 1,
          name: item.name || item.fullname || "N/A",
          pettype: item.pettype || "N/A",
          breed: item.breed || "N/A",
          color: item.color || "N/A",
          timestamp:
            item.timestamp && item.timestamp.toDate
              ? item.timestamp.toDate().toLocaleString()
              : "N/A",
          email: item.email || "N/A",
          status: item.status || "N/A",
        }));

        autoTable(doc, {
          startY: titleY + 10,
          columns: autoTableColumns,
          body: dataToPrint,
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
            let pdfTitle = "ADOPTION LIST";
            if (adoptionStatusFilter === "Approved") {
              pdfTitle = "ADOPTION LIST - APPROVED";
            } else if (adoptionStatusFilter === "Disapprove") {
              pdfTitle = "ADOPTION LIST - DISAPPROVE";
            }
            doc.text(pdfTitle, pageWidth / 2, titleY, {
              align: "center",
            });

            doc.setFontSize(12);
            doc.text(
              `Date: ${new Date().toLocaleDateString()}`,
              pageWidth - 44,
              titleY
            );
          },
        });

        const baseY = doc.lastAutoTable.finalY + 20;
        doc.setFontSize(12);
        doc.setFont(undefined, "bold");
        doc.text("Prepared by:", 30, baseY);
        doc.setFont(undefined, "normal");
        doc.text("Rowena Que", 60, baseY + 7);
        doc.text("Barangay Admin", 57, baseY + 14);

        window.open(doc.output("bloburl"), "_blank");
        return;
      }

      // Default for other categories
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
        filteredTableData.length > 0 ? filteredTableData : tableData;

      const dataToPrint = rawData.map((item, index) => {
        const row = { no: index + 1 };
        originalColumns.forEach((col) => {
          const value = item[col.dataIndex];
          if (col.dataIndex === "typeOfAnimal" && typeof value === "object") {
            row[col.dataIndex] = Object.entries(value)
              .filter(([_, val]) => val === true)
              .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1))
              .join(", ");
          } else if (col.dataIndex === "submittedAt" && value?.toDate) {
            row[col.dataIndex] = value.toDate().toLocaleString();
          } else {
            row[col.dataIndex] =
              value !== undefined && value !== null
                ? Array.isArray(value)
                  ? value.join(", ")
                  : value
                : "";
          }
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
            if (selectedCategory === "closedReports") {
              const reportTypes = [
                ...new Set(filteredTableData.map((item) => item.report_type)),
              ];
              if (reportTypes.length === 1) {
                if (reportTypes[0] === "Stray") {
                  pdfTitle = "PET FOUND LIST";
                } else if (reportTypes[0] === "Missing") {
                  pdfTitle = "PET LOST LIST";
                }
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
          doc.setFontSize(12);
          doc.setFont(undefined, "bold");
          doc.text("Prepared by:", 30, baseY);
          doc.setFont(undefined, "normal");
          doc.text("Rowena Que", 60, baseY + 7);
          doc.text("Barangay Admin", 57, baseY + 14);
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
          dataIndex: "report_type",
          key: "report_type",
        },
        {
          title: "Animal Type",
          dataIndex: "typeOfAnimal",
          key: "typeOfAnimal",
          render: (type) =>
            type && typeof type === "object"
              ? Object.entries(type)
                  .filter(([_, value]) => value === true)
                  .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1))
                  .join(", ")
              : "N/A",
        },

        {
          title: "Breed",
          dataIndex: "description",
          key: "description",
        },
        {
          title: "Reported By",
          dataIndex: "name",
          key: "name",
        },
        { title: "Email", dataIndex: "email", key: "email" },
        {
          title: "Date Reported",
          dataIndex: "submittedAt",
          key: "submittedAt",
          render: (timestamp) =>
            timestamp && timestamp.toDate
              ? timestamp.toDate().toLocaleDateString() +
                " " +
                timestamp.toDate().toLocaleTimeString()
              : "N/A",
        },
        {
          title: "Location/Last Seen",
          dataIndex: "location",
          key: "location",
        },
        {
          title: "Status",
          dataIndex: "status",
          key: "status",
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
        return "Pet Rescue Details";
      case "resolvedReports":
        return "Stray Animal Reports Details";
      case "pendingRequests":
        return "ADOPTION LIST";
      default:
        return "Details";
    }
  };

  const fetchData = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const userDocs = usersSnapshot.docs
        .map((doc) => doc.data())
        .filter((user) => user.type !== "admin");

      const availablePetsSnapshot = await getDocs(collection(db, "pet"));
      const reportsResolvedSnapshot = await getDocs(
        query(collection(db, "reports"), where("status", "==", "Resolved"))
      );
      const allReportsSnapshot = await getDocs(collection(db, "reports"));
      const requestsPendingSnapshot = await getDocs(
        collection(db, "request_form")
      );

      setDataSummary({
        usersCount: userDocs.length,
        reportsPending: availablePetsSnapshot.size,
        reportsResolved: reportsResolvedSnapshot.size,
        reportsClosed: allReportsSnapshot.size,
        requestsPending: requestsPendingSnapshot.size,
      });

      setGraphData([
        { name: "Users", count: userDocs.length },
        { name: "Adoption", count: availablePetsSnapshot.size || 0 },
        { name: "Resolved Reports", count: reportsResolvedSnapshot.size || 0 },
        { name: "Pet Rescue", count: allReportsSnapshot.size || 0 },
        { name: "Pending Requests", count: requestsPendingSnapshot.size || 0 },
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const COLORS = ["#1890ff", "#13c2c2", "#fa8c16", "#f759ab", "#9254de"];

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
    <Layout style={{ minHeight: "100vh"}}>
      <Sidebar />

      <Layout>
        <HeaderBar userName={adminName || "Admin"} />

        <Content
          style={{
            margin: "20px",
            background: "#fff",
            borderRadius: "8px",
            marginTop: "70px"
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
                    {
                      <img
                        src="/group.png"
                        alt="Group"
                        style={{ width: 50, height: 50 }}
                      />
                    }
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
                    {
                      <img
                        src="/pets (1).png"
                        alt="Pets"
                        style={{ width: 50, height: 50 }}
                      />
                    }

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
                    {
                      <img
                        src="/pet-care.png"
                        alt="Pets"
                        style={{ width: 50, height: 50 }}
                      />
                    }
                    <Title level={4}>{dataSummary.reportsClosed ?? 0}</Title>
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
                    {
                      <img
                        src="/kitten.png"
                        alt="Pets"
                        style={{ width: 50, height: 50 }}
                      />
                    }

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
                        margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorBar"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#1890ff"
                              stopOpacity={0.9}
                            />
                            <stop
                              offset="100%"
                              stopColor="#91d5ff"
                              stopOpacity={0.8}
                            />
                          </linearGradient>
                        </defs>

                        <XAxis
                          dataKey="name"
                          angle={-30}
                          textAnchor="end"
                          interval={0}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar
                          dataKey="count"
                          fill="url(#colorBar)"
                          radius={[10, 10, 0, 0]}
                          barSize={70}
                          activeBar={false}
                        >
                          <LabelList
                            dataKey="count"
                            position="top"
                            style={{
                              fill: "#333",
                              fontWeight: 600,
                              fontSize: 13,
                            }}
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
                        <defs>
                          <linearGradient
                            id="colorBar"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#40a9ff"
                              stopOpacity={1}
                            />
                            <stop
                              offset="100%"
                              stopColor="#1890ff"
                              stopOpacity={0.8}
                            />
                          </linearGradient>
                        </defs>

                        <Pie
                          data={graphData}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          innerRadius={40}
                          paddingAngle={5}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(1)}%`
                          }
                          fill="url(#colorPie)"
                        >
                          {graphData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                              stroke="#fff"
                              strokeWidth={2}
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
              selectedCategory === "closedReports" ? (
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <span style={{ fontWeight: "bold", fontSize: 16 }}>
                    Pet Rescue Details
                  </span>
                  <Dropdown
                    overlay={
                      <Menu
                        onClick={({ key }) => {
                          setFilteredTableData(
                            key === "all"
                              ? tableData
                              : tableData.filter(
                                  (item) => item.report_type === key
                                )
                          );
                        }}
                      >
                        <Menu.Item key="all">All Report Types</Menu.Item>
                        {concernFilters.map((filter) => (
                          <Menu.Item key={filter.value}>
                            {filter.text}
                          </Menu.Item>
                        ))}
                      </Menu>
                    }
                    placement="bottomLeft"
                    trigger={["click"]}
                  >
                    <Button
                      bode
                      icon={<FilterOutlined />}
                      size="small"
                    ></Button>
                  </Dropdown>
                </div>
              ) : selectedCategory === "pendingReports" ? (
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
              ) : selectedCategory === "pendingRequests" ? (
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <span style={{ fontWeight: "bold", fontSize: 16 }}>
                    ADOPTION LIST
                  </span>
                  <Dropdown
                    overlay={
                      <Menu
                        onClick={({ key }) => {
                          setAdoptionStatusFilter(key === "all" ? null : key);
                          const filtered =
                            key === "all"
                              ? tableData
                              : tableData.filter((item) => item.status === key);
                          setFilteredTableData(filtered);
                        }}
                      >
                        <Menu.Item key="all">All Status</Menu.Item>
                        {adoptionStatusOptions.map((status) => (
                          <Menu.Item key={status}>{status}</Menu.Item>
                        ))}
                      </Menu>
                    }
                    placement="bottomLeft"
                    trigger={["click"]}
                  >
                    <FilterOutlined />
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
            {selectedCategory === "pendingRequests" ? (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    marginBottom: "20px",
                  }}
                >
                  <thead>
                    <tr>
                      <th style={tableHeaderStyle}>Adopter name</th>
                      <th style={tableHeaderStyle}>Animal type</th>

                      <th style={tableHeaderStyle}>Date of Adopted</th>
                      <th style={tableHeaderStyle}>Email</th>
                      <th style={tableHeaderStyle}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(adoptionStatusFilter ? filteredTableData : tableData).map(
                      (item, index) => (
                        <tr key={item.id || index}>
                          <td style={tableCellStyle}>
                            {item.name || item.fullname}
                          </td>
                          <td style={tableCellStyle}>{item.pettype}</td>

                          <td style={tableCellStyle}>
                            {item.timestamp && item.timestamp.toDate
                              ? item.timestamp.toDate().toLocaleString()
                              : "N/A"}
                          </td>
                          <td style={tableCellStyle}>{item.email}</td>
                          <td style={tableCellStyle}>{item.status}</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <Table
                dataSource={
                  selectedCategory === "pendingReports" ||
                  selectedCategory === "closedReports"
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
            )}

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
