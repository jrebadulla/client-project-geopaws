import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Typography,
  Card,
  Tabs,
  message,
  Space,
  Badge,
} from "antd";
import Sidebar from "./Sidebar";
import HeaderBar from "./HeaderBar";

const { Title } = Typography;
const { TabPane } = Tabs;

const ManagePetReports = ({ adminName }) => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]); // Filtered reports based on tab
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All"); // Track active tab

  // Fetch reports from Firestore
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const reportsCollection = collection(db, "pet_reports");
        const reportsSnapshot = await getDocs(reportsCollection);
        const reportsList = reportsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReports(reportsList);
        setFilteredReports(reportsList); // Default: Show all reports
      } catch (error) {
        console.error("Error fetching reports:", error);
        message.error("Failed to load pet reports.");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  // Handle Tab Change
  const handleTabChange = (key) => {
    setActiveTab(key);
    if (key === "All") {
      setFilteredReports(reports);
    } else {
      setFilteredReports(reports.filter((report) => report.status === key));
    }
  };

  // Handle View Report
  const handleViewDetails = (id) => {
    navigate(`/incident/${id}`);
  };

  // Handle Delete Report
  const handleDelete = async (reportId) => {
    try {
      await deleteDoc(doc(db, "pet_reports", reportId));
      const updatedReports = reports.filter((report) => report.id !== reportId);
      setReports(updatedReports);
      setFilteredReports(updatedReports);
      message.success("Report deleted successfully!");
    } catch (error) {
      console.error("Error deleting report:", error);
      message.error("Failed to delete report.");
    }
  };

  // Table Columns
  const columns = [
    {
      title: "Concern",
      dataIndex: "pet_name",
      key: "pet_name",
    },
    {
      title: "Date Lost",
      dataIndex: "date_lost",
      key: "date_lost",
    },
    {
      title: "Location Lost",
      dataIndex: "location_lost",
      key: "location_lost",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        switch (status) {
          case "In Progress":
            return <Badge status="processing" text="In Progress" />;
          case "Resolved":
            return <Badge status="success" text="Resolved" />;
          case "Closed":
            return <Badge status="error" text="Closed" />;
          case "Cancelled":
            return <Badge status="default" text="Cancelled" />;
          default:
            return <Badge status="default" text="Unknown" />;
        }
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="primary" onClick={() => handleViewDetails(record.id)}>
            View Details
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div style={{ flexGrow: 1 }}>
        {/* HeaderBar */}
        <HeaderBar userName={adminName || "Admin"} />

        {/* Page Content */}
        <div style={{ padding: "20px" }}>
          <Card bordered style={{ marginBottom: "20px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
            <Title level={3} style={{ textAlign: "center" }}>
              Manage Pet Reports
            </Title>
          </Card>

          {/* Tabs for Filtering */}
          <Tabs defaultActiveKey="All" onChange={handleTabChange} centered>
            <TabPane tab="All" key="All" />
            <TabPane tab="In Progress" key="In Progress" />
            <TabPane tab="Resolved" key="Resolved" />
            <TabPane tab="Closed" key="Closed" />
            <TabPane tab="Cancelled" key="Cancelled" />
          </Tabs>

          {/* Table */}
          <Card>
            <Table
              dataSource={filteredReports}
              columns={columns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 5 }}
              bordered
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ManagePetReports;
