import React, { useEffect, useState } from "react";
import { Layout, Dropdown, Menu, Avatar, Typography, Badge, message } from "antd";
import { BellOutlined, UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import moment from "moment";

const { Header } = Layout;
const { Text } = Typography;

const HeaderBar = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Admin");
  const [adminUid, setAdminUid] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Retrieve admin data from localStorage
    const storedUserName = localStorage.getItem("userName");
    const storedAdminUid = localStorage.getItem("adminUid");

    if (storedUserName) {
      setUserName(storedUserName);
    } else {
      console.warn("UserName not found in localStorage.");
    }

    if (storedAdminUid) {
      setAdminUid(storedAdminUid);
    } else {
      console.warn("Admin UID not found in localStorage.");
    }
  }, []);

  useEffect(() => {
    if (!adminUid) {
      console.warn("Admin UID is undefined. Unable to fetch notifications.");
      return;
    }

    const messagesQuery = query(
      collection(db, "messages"),
      where("receiver_uid", "==", adminUid),
      where("status", "==", "unread")
    );

    const petReportsQuery = query(
      collection(db, "pet_reports"),
      where("status", "==", "In Progress")
    );

    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const messageNotifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        type: "message",
        timestamp: doc.data().timestamp?.toDate() || new Date(),
        text: "New message has been received",
      }));

      setNotifications((prev) => [
        ...prev.filter((n) => n.type !== "message"), // Remove old message notifications
        ...messageNotifications,
      ]);
    });

    const unsubscribePetReports = onSnapshot(petReportsQuery, (snapshot) => {
      const reportNotifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        type: "pet_report",
        timestamp: doc.data().updatedAt?.toDate() || new Date(),
        text: "New report has been received",
        link: `/incident/${doc.id}`, // Add link to navigate
      }));

      setNotifications((prev) => [
        ...prev.filter((n) => n.type !== "pet_report"), // Remove old pet report notifications
        ...reportNotifications,
      ]);
    });

    return () => {
      unsubscribeMessages();
      unsubscribePetReports();
    };
  }, [adminUid]);

  // Notifications dropdown menu
  const notificationMenu = (
    <Menu>
      {notifications.length > 0 ? (
        notifications.map((notification) => (
          <Menu.Item
            key={notification.id}
            onClick={() => {
              if (notification.type === "pet_report" && notification.link) {
                navigate(notification.link); // Navigate to incident page
              }
            }}
          >
            <span style={{ cursor: "pointer" }}>
              {notification.text} <br />
              <small style={{ color: "gray" }}>
                {moment(notification.timestamp).fromNow()}
              </small>
            </span>
          </Menu.Item>
        ))
      ) : (
        <Menu.Item key="no-notifications">No new notifications</Menu.Item>
      )}
    </Menu>
  );

  // Logout function
  const handleLogout = async () => {
    try {
      await auth.signOut(); // Firebase logout
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("adminUid");
      localStorage.removeItem("userName");
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      message.error("Logout failed. Please try again.");
    }
  };

  return (
    <Header
      style={{
        background: "#fff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 20px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        zIndex: 1000,
      }}
    >
      {/* Logo or App Title */}
      <Text style={{ fontSize: "20px", fontWeight: "bold" }}></Text>

      {/* Right-side controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        {/* Notifications */}
        <Dropdown overlay={notificationMenu} trigger={["click"]}>
          <Badge count={notifications.length} offset={[-3, 10]}>
            <BellOutlined style={{ fontSize: "18px", cursor: "pointer" }} />
          </Badge>
        </Dropdown>

        {/* User Profile */}
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item key="profile" disabled>
                <UserOutlined /> {userName}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item key="logout" onClick={handleLogout}>
                <LogoutOutlined /> Logout
              </Menu.Item>
            </Menu>
          }
          trigger={["click"]}
        >
          <div style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
            <Avatar icon={<UserOutlined />} style={{ marginRight: "8px" }} />
            <Text>{userName}</Text>
          </div>
        </Dropdown>
      </div>
    </Header>
  );
};

export default HeaderBar;
