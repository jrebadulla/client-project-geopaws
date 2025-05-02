import React, { useEffect, useState } from "react";
import { Table, Typography, Badge, message, Card, Tabs, Spin } from "antd";
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
      setRequestData(requestList);
    } catch (error) {
      console.error("Error fetching request_form:", error);
      message.error("Failed to fetch request data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredData = Array.isArray(requestData)
    ? requestData.filter((item) => item.status === activeTab)
    : [];

  const columns = [
    {
      title: "Name",
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
      title: "Pet Type",
      dataIndex: "pettype",
      key: "pettype",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Badge status={STATUS_BADGE[status] || "default"} text={status} />
      ),
    },
  ];

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
              <Spin tip="Loading requests..." />
            ) : (
              <Table
                dataSource={Array.isArray(filteredData) ? filteredData : []}
                columns={columns}
                rowKey="id"
                pagination={false}
                bordered
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ManageRequests;
