import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import {
  Typography,
  Card,
  Spin,
  message,
  Avatar,
  List,
  Space,
  Empty,
  Tag,
  Layout,
} from "antd";
import Sidebar from "./Sidebar";
import { UserOutlined, CommentOutlined } from "@ant-design/icons";
import { Content } from "antd/es/layout/layout";
import HeaderBar from "./HeaderBar";

const { Title, Text } = Typography;

const ManageFeedback = ({adminName = "Admin"}) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const feedbackCollection = collection(db, "feedback");
        const feedbackSnapshot = await getDocs(feedbackCollection);
        const feedbackList = feedbackSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFeedbacks(feedbackList);

        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);
        const usersData = {};
        usersSnapshot.forEach((doc) => {
          usersData[doc.id] = doc.data();
        });
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching data:", error);
        message.error("Failed to load feedbacks. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getUserInfo = (uid) => {
    const user = users[uid];
    return user
      ? {
          name: `${user.firstname} ${user.lastname}`,
          initials:
            user.firstname?.[0]?.toUpperCase() +
            user.lastname?.[0]?.toUpperCase(),
        }
      : { name: "Unknown User", initials: "?" };
  };

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
            bordered={false}
            style={{
              marginBottom: "24px",
              background: "#ffffff",
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          >
            <Title level={3} style={{ textAlign: "center", marginBottom: 4 }}>
              💬 User Feedback
            </Title>
            <Text
              type="secondary"
              style={{ display: "block", textAlign: "center" }}
            >
              Insights and thoughts from users across the platform
            </Text>
          </Card>

          <Card
            style={{
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              backgroundColor: "#ffffff",
            }}
            bodyStyle={{ padding: "24px" }}
          >
            {loading ? (
              <Spin
                size="large"
                style={{ display: "block", margin: "80px auto" }}
              />
            ) : feedbacks.length === 0 ? (
              <Empty
                description="No feedback submitted yet."
                style={{ margin: "60px 0" }}
              />
            ) : (
              <List
                itemLayout="vertical"
                dataSource={feedbacks}
                style={{ maxHeight: "600px", overflowY: "auto" }}
                renderItem={(item) => {
                  const user = getUserInfo(item.uid);

                  return (
                    <List.Item
                      key={item.id}
                      style={{
                        border: "1px solid #f0f0f0",
                        borderRadius: 8,
                        padding: "16px 20px",
                        marginBottom: 16,
                        background: "#fafafa",
                      }}
                    >
                      <Space align="start" style={{ width: "100%" }}>
                        <Avatar
                          size="large"
                          style={{
                            backgroundColor: "#1890ff",
                            fontWeight: "bold",
                          }}
                        >
                          {user.initials}
                        </Avatar>
                        <div style={{ flex: 1 }}>
                          <Text strong style={{ fontSize: 16 }}>
                            {user.name}
                          </Text>
                          <div
                            style={{
                              marginTop: 8,
                              background: "#ffffff",
                              padding: "12px 16px",
                              borderRadius: 6,
                              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                            }}
                          >
                            <CommentOutlined
                              style={{ color: "#1890ff", marginRight: 8 }}
                            />
                            <Text>{item.feedback}</Text>
                          </div>
                        </div>
                      </Space>
                    </List.Item>
                  );
                }}
              />
            )}
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
};

export default ManageFeedback;
