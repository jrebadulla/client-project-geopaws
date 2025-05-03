import React, { useEffect, useState } from "react";
import { Typography, Badge, message, Card, Tabs, Spin } from "antd";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import Sidebar from "./Sidebar";
import HeaderBar from "./HeaderBar";

const STATUS_BADGE = {
  Approved: "success",
  Disapprove: "error",
  Pending: "processing",
};

function ManageRequests({ adminName = "Admin" }) {
  const [requestData, setRequestData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Pending");
  const [error, setError] = useState(null);

  const fetchRequests = async () => {
    try {
      const requestCollection = collection(db, "request_form");
      const requestSnapshot = await getDocs(requestCollection);
      const requestList = requestSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          status: data.status || "Pending",
        };
      });
      console.log("Fetched data:", requestList);
      setRequestData(requestList);
    } catch (error) {
      console.error("Error fetching request_form:", error);
      setError(error.message);
      message.error("Failed to fetch request data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Filter data based on active tab
  const filteredData = Array.isArray(requestData)
    ? requestData.filter((item) => item.status === activeTab)
    : [];

  // Instead of using Ant Design Table, let's create a simple table
  const renderSimpleTable = () => {
    if (filteredData.length === 0) {
      return <div>No {activeTab} requests found</div>;
    }

    return (
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Name</th>
              <th style={tableHeaderStyle}>Email</th>
              <th style={tableHeaderStyle}>Phone</th>
              <th style={tableHeaderStyle}>Pet Type</th>
              <th style={tableHeaderStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <tr key={item.id}>
                <td style={tableCellStyle}>{item.name || "N/A"}</td>
                <td style={tableCellStyle}>{item.email || "N/A"}</td>
                <td style={tableCellStyle}>{item.phone || "N/A"}</td>
                <td style={tableCellStyle}>{item.pettype || "N/A"}</td>
                <td style={tableCellStyle}>
                  <span>
                    <span
                      style={{
                        display: "inline-block",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor:
                          item.status === "Approved"
                            ? "#52c41a"
                            : item.status === "Disapprove"
                              ? "#f5222d"
                              : "#1890ff",
                        marginRight: "8px",
                      }}
                    ></span>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

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

  // Show debug info


  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flexGrow: 1 }}>
        <HeaderBar userName={adminName} />
        <div style={{ padding: 20 }}>
          <Card bordered style={{ marginBottom: 20 }}>
            <Typography.Title level={3} style={{ textAlign: "center" }}>
              Pet Adoption Requests
            </Typography.Title>
          </Card>


          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            centered
            items={[
              { key: "Pending", label: "Pending" },
              { key: "Approved", label: "Approved" },
              { key: "Disapprove", label: "Disapprove" },
            ]}
          />

          <Card>
            {loading ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <Spin tip="Loading requests..." />
              </div>
            ) : (
              renderSimpleTable()
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ManageRequests;