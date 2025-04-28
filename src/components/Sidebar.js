import React, { useState } from "react";
import { Layout, Menu, Typography } from "antd";
import {
  HomeOutlined,
  AppstoreOutlined,
  PlusCircleOutlined,
  SettingOutlined,
  FormOutlined,
  MailOutlined,
  MessageOutlined,
  UserOutlined,
  NotificationOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Sider } = Layout;
const { SubMenu } = Menu;

const Sidebar = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false); // For toggling the sidebar collapse

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      breakpoint="lg"
      style={{
        backgroundColor: "#e3f2fd", // Light blue background
        minHeight: "100vh",
      }}
    >
      {/* Sidebar Header */}
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          color: "#1976d2", // Light Blue Text
          fontWeight: "bold",
          fontSize: collapsed ? "16px" : "20px",
        }}
      >
        <Typography.Title level={4} style={{ margin: 0, color: "#1976d2" }}>
          GeoPaws
        </Typography.Title>
      </div>

      {/* Sidebar Menu */}
      <Menu
        mode="inline"
        theme="light"
        defaultSelectedKeys={["1"]}
        style={{
          backgroundColor: "#e3f2fd", // Light Blue Background
          color: "#1976d2", // Light Blue Text
        }}
      >
        {/* Home */}
        <Menu.Item key="1" icon={<HomeOutlined style={{ color: "#1e88e5" }} />} onClick={() => handleNavigate("/")}>
          Home
        </Menu.Item>

        {/* Pets (Submenu) */}
        <SubMenu
          key="sub1"
          icon={<AppstoreOutlined style={{ color: "#1e88e5" }} />}
          title="Pets"
        >
          <Menu.Item
            key="2"
            icon={<PlusCircleOutlined style={{ color: "#1e88e5" }} />}
            onClick={() => handleNavigate("/add-pets")}
          >
            Add Pets
          </Menu.Item>
          <Menu.Item
            key="3"
            icon={<SettingOutlined style={{ color: "#1e88e5" }} />}
            onClick={() => handleNavigate("/manage-pets")}
          >
            Manage Pets
          </Menu.Item>
        </SubMenu>

        {/* Pet Reports */}
        <Menu.Item
          key="4"
          icon={<FormOutlined style={{ color: "#1e88e5" }} />}
          onClick={() => handleNavigate("/pet-reports")}
        >
          Pet Reports
        </Menu.Item>

        {/* Requests */}
        <Menu.Item
          key="5"
          icon={<MailOutlined style={{ color: "#1e88e5" }} />}
          onClick={() => handleNavigate("/requests")}
        >
          Requests
        </Menu.Item>

        {/* Messages */}
        <Menu.Item
          key="6"
          icon={<MessageOutlined style={{ color: "#1e88e5" }} />}
          onClick={() => handleNavigate("/messages")}
        >
          Messages
        </Menu.Item>

        {/* Feedback */}
        <Menu.Item
          key="7"
          icon={<NotificationOutlined style={{ color: "#1e88e5" }} />}
          onClick={() => handleNavigate("/feedback")}
        >
          Feedback
        </Menu.Item>

        {/* Users */}
        <Menu.Item
          key="8"
          icon={<UserOutlined style={{ color: "#1e88e5" }} />}
          onClick={() => handleNavigate("/users")}
        >
          Users
        </Menu.Item>
      </Menu>
    </Sider>
  );
};

export default Sidebar;
