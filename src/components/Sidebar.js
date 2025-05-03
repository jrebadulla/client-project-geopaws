import React, { useState } from "react";
import { Layout, Menu, Typography } from "antd";
import {
  HomeOutlined,
  SettingOutlined,
  FormOutlined,
  MailOutlined,
  MessageOutlined,
  UserOutlined,
  NotificationOutlined,
  AlertOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import "./SideBar.css";

const { Sider } = Layout;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const pathToKey = {
    "/": "1",
    "/manage-pets": "3",
    "/requests": "5",
    "/pet-reports": "4",
    "/messages": "6",
    "/feedback": "7",
    "/users": "8",
    "/pet-lost": "9",
    "/pet-found": "10",
  };

  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState(pathToKey[location.pathname]);

  const handleNavigate = (path, key) => {
    navigate(path);
    setSelectedKey(key);
  };

  return (
    <Sider
      // collapsible
      // collapsed={collapsed}
      // onCollapse={(value) => setCollapsed(value)}
      breakpoint="lg"
      style={{
        backgroundColor: "#e3f2fd",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          color: "#1976d2",
          fontWeight: "bold",
          fontSize: collapsed ? "16px" : "20px",
        }}
      >
        <Typography.Title level={4} style={{ margin: 0, color: "#1976d2" }}>
          GEOPAWS
        </Typography.Title>
      </div>

      <Menu
        mode="inline"
        theme="light"
        selectedKeys={[selectedKey]}
        className="custom-sidebar"
        style={{
          backgroundColor: "#e3f2fd",
          color: "#1976d2",
        }}
      >
        <Menu.Item
          key="1"
          icon={<HomeOutlined />}
          onClick={() => handleNavigate("/", "1")}
        >
          Home
        </Menu.Item>

        <Menu.Item
          key="3"
          icon={<SettingOutlined />}
          onClick={() => handleNavigate("/manage-pets", "3")}
        >
          Manage Pets
        </Menu.Item>

        <Menu.Item
          key="5"
          icon={<MailOutlined />}
          onClick={() => handleNavigate("/requests", "5")}
        >
          Adoption Request
        </Menu.Item>

        <Menu.SubMenu
          key="pet-reports"
          icon={<FormOutlined />}
          title="Pet Rescue"
        >
          <Menu.Item
            key="pet-lost"
            icon={<AlertOutlined />}
            onClick={() => handleNavigate("/pet-lost", "pet-lost")}
          >
            Pet Lost
          </Menu.Item>

          <Menu.Item
            key="pet-found"
            icon={<FormOutlined />}
            onClick={() => handleNavigate("/pet-found", "pet-found")}
          >
            Pet Found
          </Menu.Item>
        </Menu.SubMenu>

        <Menu.Item
          key="6"
          icon={<MessageOutlined />}
          onClick={() => handleNavigate("/messages", "6")}
        >
          Messages
        </Menu.Item>

        <Menu.Item
          key="7"
          icon={<NotificationOutlined />}
          onClick={() => handleNavigate("/feedback", "7")}
        >
          Feedback
        </Menu.Item>

        <Menu.Item
          key="8"
          icon={<UserOutlined />}
          onClick={() => handleNavigate("/users", "8")}
        >
          Users
        </Menu.Item>
      </Menu>
    </Sider>
  );
};

export default Sidebar;
