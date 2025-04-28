import React, { useState, useEffect, useRef } from "react";
import { collection, addDoc, updateDoc, doc, onSnapshot, query, where } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { db, storage } from "../firebase";
import { Layout, List, Avatar, Typography, Input, Button, Spin, message, Upload, Empty, Badge } from "antd";
import { UserOutlined, SendOutlined, PaperClipOutlined } from "@ant-design/icons";
import Sidebar from "./Sidebar";
import HeaderBar from "./HeaderBar"; // Reusable header

const { Sider, Content } = Layout;
const { TextArea } = Input;
const { Title } = Typography;

const ManageMessages = ({ adminUid, adminName }) => {
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messagesHistory, setMessagesHistory] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const messagesEndRef = useRef(null); // Reference to the messages container

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const usersCollection = collection(db, "users");
        const q = query(usersCollection, where("type", "==", "customer")); // Load only customers
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const customersList = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setCustomers(customersList);
        });
        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching customers:", error);
        message.error("Failed to load customers.");
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  // Update unread message count
  useEffect(() => {
    const messagesCollection = collection(db, "messages");
    const unsubscribe = onSnapshot(messagesCollection, (querySnapshot) => {
      const unreadCountsTemp = {};
      querySnapshot.docs.forEach((doc) => {
        const message = doc.data();
        const uids = [adminUid, message.sender_uid];
        uids.sort();
        const chatroomCode = uids.join("_");

        if (message.status === "unread" && message.receiver_uid === adminUid) {
          if (!unreadCountsTemp[message.sender_uid]) {
            unreadCountsTemp[message.sender_uid] = 0;
          }
          unreadCountsTemp[message.sender_uid] += 1;
        }
      });

      setUnreadCounts(unreadCountsTemp);
    });

    return () => unsubscribe();
  }, [adminUid]);

  useEffect(() => {
    let unsubscribe = () => {};

    if (selectedUser) {
      const uids = [adminUid, selectedUser.id];
      uids.sort();
      const chatroomCode = uids.join("_");

      const messagesCollection = collection(db, "messages");

      unsubscribe = onSnapshot(messagesCollection, (querySnapshot) => {
        const allMessages = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const filteredMessages = allMessages.filter((msg) => msg.code === chatroomCode);

        filteredMessages.sort((a, b) => a.timestamp.seconds - b.timestamp.seconds);

        setMessagesHistory(filteredMessages);

        // Scroll to the bottom when messages are updated
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);

        filteredMessages
          .filter((msg) => msg.sender_uid === selectedUser.id && msg.status === "unread")
          .forEach(async (msg) => {
            const messageRef = doc(db, "messages", msg.id);
            await updateDoc(messageRef, { status: "read" });
          });
      });
    }

    return () => unsubscribe();
  }, [selectedUser, adminUid]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    const updatedCounts = { ...unreadCounts };
    delete updatedCounts[user.id];
    setUnreadCounts(updatedCounts);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && !file) {
      message.warning("Please type a message or attach an image.");
      return;
    }

    setSending(true);
    let imageUrl = "";

    try {
      if (file) {
        const storageRef = ref(storage, `messages/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        await uploadTask;
        imageUrl = await getDownloadURL(storageRef);
      }

      const uids = [adminUid, selectedUser.id];
      uids.sort();
      const chatroomCode = uids.join("_");

      const messagesCollection = collection(db, "messages");
      await addDoc(messagesCollection, {
        sender_uid: adminUid,
        receiver_uid: selectedUser.id,
        text: messageText,
        image: imageUrl,
        timestamp: new Date(),
        status: "unread",
        code: chatroomCode,
      });

      setMessageText("");
      setFile(null);
      setImagePreview(null);
      message.success("Message sent successfully!");

      // Scroll to the bottom after sending a message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      message.error("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleFileChange = (info) => {
    const file = info.file.originFileObj;

    if (!file) {
      message.error("No file selected.");
      setFile(null);
      setImagePreview(null);
      return;
    }

    // Explicitly validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (allowedTypes.includes(file.type)) {
      setFile(file); // Save valid file
      setImagePreview(URL.createObjectURL(file)); // Preview the image
      message.success("Image ready to send.");
    } else {
      setFile(null); // Clear file state
      setImagePreview(null); // Clear preview
      message.error("Only JPEG, PNG image files are allowed.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout>
        <HeaderBar userName={adminName || "Admin"} />

        <Layout>
          <Sider width={300} style={{ background: "#fff", borderRight: "1px solid #ddd" }}>
            <div style={{ padding: "20px", textAlign: "center" }}>
              <Title level={4}>Contacts</Title>
            </div>
            {loadingCustomers ? (
              <Spin size="large" style={{ display: "block", margin: "50px auto" }} />
            ) : (
              <List
                dataSource={customers}
                renderItem={(user) => (
                  <List.Item
                    onClick={() => handleSelectUser(user)}
                    style={{
                      padding: "10px 20px",
                      cursor: "pointer",
                      backgroundColor: selectedUser?.id === user.id ? "#f0f2f5" : "inherit",
                    }}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={
                        <Badge count={unreadCounts[user.id]} offset={[10, 0]}>
                          <strong>{user.firstname} {user.lastname}</strong>
                        </Badge>
                      }
                      description={user.email}
                    />
                  </List.Item>
                )}
              />
            )}
          </Sider>

          <Content style={{ padding: "20px", background: "#fff" }}>
            {selectedUser ? (
              <>
                <Title level={4} style={{ marginBottom: "10px" }}>
                  Conversation with {selectedUser.firstname} {selectedUser.lastname}
                </Title>
                <div style={{ height: "500px", overflowY: "auto", marginBottom: "10px" }}>
                  {messagesHistory.length > 0 ? (
                    messagesHistory.map((msg) => {
                      const isSender = msg.sender_uid === adminUid;
                      const alignmentStyle = isSender ? { textAlign: "right" } : { textAlign: "left" };
                      const bubbleStyle = isSender
                        ? { background: "#1890ff", color: "#fff" }
                        : { background: "#f0f0f0", color: "#000" };

                      return (
                        <div key={msg.id} style={{ marginBottom: "10px", ...alignmentStyle }}>
                          {msg.image && msg.image.trim() !== "" && (
                            <img
                              src={msg.image}
                              alt="attachment"
                              style={{
                                maxWidth: "200px",
                                borderRadius: "8px",
                                marginBottom: "5px",
                                display: "block",
                              }}
                            />
                          )}
                          <div
                            style={{
                              display: "inline-block",
                              padding: "8px 12px",
                              borderRadius: "8px",
                              position: "relative",
                              ...bubbleStyle,
                            }}
                          >
                            {msg.text}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <Empty description="No messages yet" />
                  )}
                  <div ref={messagesEndRef}></div>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <TextArea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyPress}
                    rows={2}
                    placeholder="Type your message..."
                    style={{ flex: 1, marginRight: "10px" }}
                  />
                  <Upload
                    beforeUpload={() => false}
                    onChange={handleFileChange}
                    accept="image/jpeg, image/png, image/jpg"
                    showUploadList={false}
                  >
                    <Button icon={<PaperClipOutlined />} type="text" />
                  </Upload>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendMessage}
                    loading={sending}
                  />
                </div>
                {imagePreview && (
                  <div style={{ marginTop: "10px", textAlign: "center" }}>
                    <img
                      src={imagePreview}
                      alt="Selected preview"
                      style={{ maxWidth: "200px", borderRadius: "8px" }}
                    />
                  </div>
                )}
              </>
            ) : (
              <Empty description="Select a contact to start messaging" />
            )}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default ManageMessages;
