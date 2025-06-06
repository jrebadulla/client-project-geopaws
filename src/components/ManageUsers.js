import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import {
  Table,
  Typography,
  Card,
  Space,
  Spin,
  message,
  Button,
  Modal,
  Descriptions,
  Avatar,
  Image,
  Layout,
} from "antd";
import { UserOutlined, IdcardOutlined } from "@ant-design/icons";
import Sidebar from "./Sidebar";
import HeaderBar from "./HeaderBar";
import { Content } from "antd/es/layout/layout";

const { Title, Text } = Typography;

const ManageUsers = ({ adminName = "Admin" }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Fetch customers from Firestore
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const usersCollection = collection(db, "users");
        const q = query(usersCollection, where("type", "==", "customer"));
        const usersSnapshot = await getDocs(q);

        const usersList = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching customers:", error);
        message.error("Failed to load customers. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Handle View Details
  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setIsModalVisible(true);
  };

  // Close Modal
  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedUser(null);
  };

  // Function to get the valid image URL
  const getValidImage = (user) => {
    return user.images2 || user.images3 || user.images || null;
  };

  // Table columns
  const columns = [
    {
      title: "Full Name",
      dataIndex: "fullname",
      key: "fullname",
      render: (_, record) => `${record.firstname} ${record.lastname}`,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Contact",
      dataIndex: "contact",
      key: "contact",
      render: (text) => (text ? text : "N/A"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="primary" onClick={() => handleViewDetails(record)}>
            View Details
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout>
        <HeaderBar userName={adminName} />
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
            <Title level={3} style={{ textAlign: "center", margin: 0 }}>
              Members
            </Title>
          </Card>

          <Card>
            {loading ? (
              <Spin
                size="large"
                style={{ display: "block", margin: "50px auto" }}
              />
            ) : (
              <Table
                dataSource={users}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: "max-content", y: 400 }}
              />
            )}
          </Card>

          <Modal
            visible={isModalVisible}
            onCancel={handleCloseModal}
            footer={[
              <Button key="close" type="primary" onClick={handleCloseModal}>
                Close
              </Button>,
            ]}
            centered
            width={600}
            bodyStyle={{
              height: "450px",
              overflowY: "auto",
            }}
          >
            {selectedUser && (
              <div style={{ textAlign: "center" }}>
                <Avatar
                  size={100}
                  src={selectedUser.images}
                  icon={!selectedUser.images ? <UserOutlined /> : null}
                  style={{
                    marginBottom: "20px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
                  }}
                />

                <Title level={4} style={{ marginBottom: "10px" }}>
                  {`${selectedUser.firstname} ${selectedUser.lastname}`}
                </Title>

                <Title
                  level={4}
                  style={{ marginBottom: 15, textAlign: "start" }}
                >
                  📋 Member Information
                </Title>

                <Descriptions
                  bordered
                  size="small"
                  column={1}
                  layout="horizontal"
                >
                  <Descriptions.Item label="Email">
                    <Text>{selectedUser.email}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Contact">
                    <Text>{selectedUser.contact || "N/A"}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Address">
                    <Text>{selectedUser.address || "N/A"}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Age">
                    <Text>{selectedUser.age || "N/A"}</Text>
                  </Descriptions.Item>
                </Descriptions>

                {/* Valid IDs Section */}
                <div style={{ marginTop: "20px", textAlign: "center" }}>
                  <Title level={5}>
                    <IdcardOutlined style={{ marginRight: "10px" }} />
                    Valid IDs
                  </Title>
                  {selectedUser.images2 || selectedUser.images3 ? (
                    <Space
                      style={{ display: "flex", justifyContent: "center" }}
                    >
                      {selectedUser.images2 && (
                        <Image
                          src={selectedUser.images2}
                          alt="Valid ID 1"
                          width={150}
                          style={{
                            borderRadius: "8px",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                          }}
                        />
                      )}
                      {selectedUser.images3 && (
                        <Image
                          src={selectedUser.images3}
                          alt="Valid ID 2"
                          width={150}
                          style={{
                            borderRadius: "8px",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                          }}
                        />
                      )}
                    </Space>
                  ) : (
                    <Text type="secondary">No valid IDs available</Text>
                  )}
                </div>
              </div>
            )}
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default ManageUsers;
