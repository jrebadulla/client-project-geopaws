import React, { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import {
  Table,
  Modal,
  Button,
  Typography,
  Card,
  Row,
  Col,
  Select,
  Input,
  Pagination,
  Descriptions,
  message,
  Image,
} from "antd";
import Sidebar from "./Sidebar";
import HeaderBar from "./HeaderBar"; // Import the reusable header component

const { Text, Title } = Typography;
const { confirm } = Modal;
const { Option } = Select;

const ManagePets = ({ adminName }) => {
  const [pets, setPets] = useState([]);
  const [filteredPets, setFilteredPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Filter states
  const [searchType, setSearchType] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Fetch pets from Firestore
  const fetchPets = async () => {
    try {
      const petsCollection = collection(db, "pet");
      const petsSnapshot = await getDocs(petsCollection);
      const petsList = petsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPets(petsList);
      setFilteredPets(petsList);
    } catch (error) {
      console.error("Error fetching pets:", error);
      message.error("Failed to fetch pets.");
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  // Handle Search by Type
  const handleSearchType = (value) => {
    setSearchType(value);
    if (value) {
      const filtered = pets.filter((pet) =>
        pet.type.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredPets(filtered);
    } else {
      setFilteredPets(pets); // Reset if search is cleared
    }
  };

  const columns = [
    { title: "Name", dataIndex: "pet_name", key: "pet_name" },
    { title: "Type", dataIndex: "type", key: "type" },
    { title: "Age", dataIndex: "age", key: "age" },
    { title: "Color", dataIndex: "color", key: "color" },
    { title: "Sex", dataIndex: "sex", key: "sex" },
    { title: "Arrival Date", dataIndex: "arrivaldate", key: "arrivaldate" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <>
          <Button type="link" onClick={() => showModal(record)}>
            View More
          </Button>
          <Button type="link" danger onClick={() => showDeleteConfirm(record.id)}>
            Delete
          </Button>
        </>
      ),
    },
  ];

  const showModal = (pet) => {
    setSelectedPet(pet);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedPet(null);
  };

  const showDeleteConfirm = (id) => {
    confirm({
      title: "Are you sure you want to delete this pet?",
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk() {
        handleDelete(id);
      },
    });
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "pet", id));
      message.success("Pet deleted successfully!");
      fetchPets();
    } catch (error) {
      console.error("Error deleting pet:", error);
      message.error("Failed to delete pet.");
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div style={{ flexGrow: 1 }}>
        {/* Header */}
        <HeaderBar userName={adminName || "Admin"} />

        {/* Page Content */}
        <div style={{ padding: "20px" }}>
          <Card bordered style={{ marginBottom: "20px" }}>
            <Title level={3} style={{ textAlign: "center" }}>
              Manage Pets
            </Title>

            {/* Search Filter */}
            <Row gutter={[16, 16]} style={{ marginBottom: "20px" }}>
              <Col xs={24} sm={8}>
                <Input
                  placeholder="Search by Type"
                  allowClear
                  value={searchType}
                  onChange={(e) => handleSearchType(e.target.value)}
                />
              </Col>
            </Row>
          </Card>

          {/* Table */}
          <Card>
            <Table
              dataSource={filteredPets.slice(
                (currentPage - 1) * pageSize,
                currentPage * pageSize
              )}
              columns={columns}
              rowKey="id"
              pagination={false}
            />
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredPets.length}
              onChange={(page, pageSize) => {
                setCurrentPage(page);
                setPageSize(pageSize);
              }}
              style={{ marginTop: "20px", textAlign: "center" }}
            />
          </Card>

          {/* Modal for Pet Details */}
          <Modal
            visible={isModalVisible}
            onCancel={handleCloseModal}
            footer={null}
            centered
            width={600} // Keeps it clean and compact
          >
            {selectedPet && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                {/* Pet Image */}
                <Image
                  src={selectedPet.images || "https://via.placeholder.com/200"}
                  alt="Pet"
                  width={150}
                  height={150}
                  style={{
                    borderRadius: "50%",
                    objectFit: "cover",
                    boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
                    marginBottom: "20px",
                  }}
                />

                {/* Pet Name */}
                <Title level={3} style={{ marginBottom: "5px", fontWeight: "600" }}>
                  {selectedPet.pet_name || "No Name"}
                </Title>

                {/* Status */}
                <Text type="secondary" style={{ fontSize: "16px", marginBottom: "20px" }}>
                  {selectedPet.status || "Unknown Status"}
                </Text>

                {/* Pet Details */}
                <Descriptions bordered column={2} size="small" style={{ width: "100%" }}>
                  <Descriptions.Item label="Type">
                    {selectedPet.type}
                  </Descriptions.Item>
                  <Descriptions.Item label="Age">
                    {selectedPet.age}
                  </Descriptions.Item>
                  <Descriptions.Item label="Color">
                    {selectedPet.color}
                  </Descriptions.Item>
                  <Descriptions.Item label="Sex">
                    {selectedPet.sex}
                  </Descriptions.Item>
                  <Descriptions.Item label="Size">
                    {selectedPet.sizeweight}
                  </Descriptions.Item>
                  <Descriptions.Item label="Arrival Date">
                    {selectedPet.arrivaldate}
                  </Descriptions.Item>
                  <Descriptions.Item label="Health Issues">
                    {selectedPet.health_issues || "None"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Rescue Location">
                    {selectedPet.rescue_location || "Unknown"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Additional Details" span={2}>
                    {selectedPet.additional_details || "None"}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default ManagePets;
