import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "./firebase";
import { Form, Input, Button, Card, Typography, Alert, Spin } from "antd";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;

const LoginPage = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    setLoading(true);
  
    try {
      console.log("Attempting login with email:", email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user; // Contains Firebase Authentication details
      const userUid = user.uid; // Extract the Firebase Authentication UID
  
      console.log("Firebase Auth UID:", userUid);
  
      // Query to find the admin user in Firestore
      const q = query(collection(db, "users"), where("email", "==", user.email), where("type", "==", "admin"));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const adminData = querySnapshot.docs[0].data(); // Fetch Firestore user data
  
        console.log("Admin login successful for:", user.email);
        console.log("Admin Firebase Auth UID:", userUid);
        console.log("Admin Firestore Data:", adminData);
  
        setLoading(false);
        onLoginSuccess(userUid); // Pass the Firebase Auth UID to the parent component
        navigate("/"); // Navigate after successful login
      } else {
        console.log("Failed: User is not an admin.");
        setLoading(false);
        setError("Only admins are allowed to log in.");
      }
    } catch (err) {
      console.error("Login failed:", err);
      setLoading(false);
      setError("Failed to log in. Please check your credentials.");
    }
  };  

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f0f2f5" }}>
      <Card style={{ width: 400, boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
        <Title level={3} style={{ textAlign: "center" }}>
          Admin Login
        </Title>
        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 20 }} />}
        <Form layout="vertical" onFinish={handleLogin}>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: "Please input your email!" }]}
          >
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block disabled={loading}>
              {loading ? <Spin size="small" /> : "Login"}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
