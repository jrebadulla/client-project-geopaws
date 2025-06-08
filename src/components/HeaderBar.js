import React, { useEffect, useState } from "react";
import {
  Layout,
  Dropdown,
  Menu,
  Avatar,
  Typography,
  Badge,
  message,
} from "antd";
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
    if (!adminUid) return;

    const strayQuery = collection(db, "animal_reports");
    const missingQuery = collection(db, "pet_reports");

    let strayData = [];
    let missingData = [];

    const updateAllNotifications = () => {
      const allNotifications = [...strayData, ...missingData]
        .filter((v, i, arr) => arr.findIndex((n) => n.id === v.id) === i) // remove duplicates
        .sort((a, b) => b.timestamp - a.timestamp); // sort by most recent

      setNotifications(allNotifications);
    };

    const unsubscribeStray = onSnapshot(strayQuery, (snapshot) => {
      strayData = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          if (data.status !== "pending") return null;

          return {
            id: `stray-${doc.id}`,
            type: "pet_report",
            timestamp: data.updatedAt?.toDate() || new Date(),
            text: "New Pet Found report received",
            link: "/pet-found",
          };
        })
        .filter(Boolean);

      updateAllNotifications();
    });

    const unsubscribeMissing = onSnapshot(missingQuery, (snapshot) => {
      missingData = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          if (data.status !== "pending") return null;

          return {
            id: `missing-${doc.id}`,
            type: "pet_report",
            timestamp: data.updatedAt?.toDate() || new Date(),
            text: "New Pet Lost report received",
            link: "/pet-lost",
          };
        })
        .filter(Boolean);

      updateAllNotifications();
    });

    return () => {
      unsubscribeStray();
      unsubscribeMissing();
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
        position: "fixed",
        top: 0,
        left: 200, // 👈 match the sidebar width
        width: "calc(100% - 200px)", // 👈 fill remaining space
        height: "64px",
        zIndex: 1000,
        background: "#fff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 20px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* Logo or App Title */}
      <Text style={{ fontSize: "20px", fontWeight: "bold" }}></Text>

      {/* Right-side controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        {/* Notifications */}
        <Dropdown overlay={notificationMenu} trigger={["click"]}>
          <Badge count={notifications.length} offset={[-3, 10]}>
            <BellOutlined
              style={{ fontSize: "26px", cursor: "pointer", zIndex: "1001" }}
            />
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
          <div
            style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
          >
            <Avatar icon={<UserOutlined />} style={{ marginRight: "8px" }} />
            <Text>{userName}</Text>
          </div>
        </Dropdown>
      </div>
    </Header>
  );
};

export default HeaderBar;
