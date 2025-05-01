import React, { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import "./ManagePets.css";
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
  Space,
  DatePicker,
} from "antd";
import Sidebar from "./Sidebar";
import HeaderBar from "./HeaderBar";
import { Filter, Filter1Outlined, PlusOneOutlined } from "@mui/icons-material";
import {
  FilterFilled,
  FilterOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import AddPetsForm from "./AddPets";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { Text, Title } = Typography;
const { confirm } = Modal;
const { Option } = Select;
const { Search } = Input;
const { RangePicker } = DatePicker;

const ManagePets = ({ adminName }) => {
  const [pets, setPets] = useState([]);
  const [filteredPets, setFilteredPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [searchType, setSearchType] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

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
  const handleSearchType = (value) => {
    setSearchType(value);

    if (value) {
      const searchValue = value.toLowerCase().trim();

      const filtered = pets.filter((pet) => {
        const type = (pet.type || "").toLowerCase();
        const name = (pet.pet_name || "").toLowerCase();
        const color = (pet.color || "").toLowerCase();
        const breed = (pet.breed || "").toLowerCase();
        const trainingLevel = (pet.training_level || "").toLowerCase();
        const age = pet.age ? pet.age.toString() : "";

        return (
          type.includes(searchValue) ||
          name.includes(searchValue) ||
          color.includes(searchValue) ||
          breed.includes(searchValue) ||
          trainingLevel.includes(searchValue) ||
          age.includes(searchValue)
        );
      });

      setFilteredPets(filtered);
    } else {
      setFilteredPets(pets);
    }
  };

  const columns = [
    { title: "Name", dataIndex: "pet_name", key: "pet_name" },
    { title: "Type", dataIndex: "type", key: "type" },
    { title: "Age", dataIndex: "age", key: "age" },
    { title: "Color", dataIndex: "color", key: "color" },
    {
      title: "Sex",
      dataIndex: "sex",
      key: "sex",
      filters: [
        { text: "Male", value: "Male" },
        { text: "Female", value: "Female" },
      ],
      onFilter: (value, record) => record.sex === value,
      filterMultiple: false,
    },

    {
      title: "Arrival Date",
      dataIndex: "arrivaldate",
      key: "arrivaldate",
      render: (date) => (date ? dayjs(date).format("MMMM D, YYYY") : "Unknown"),
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <RangePicker
            value={
              selectedKeys[0]
                ? [dayjs(selectedKeys[0][0]), dayjs(selectedKeys[0][1])]
                : []
            }
            onChange={(dates, dateStrings) => {
              if (dateStrings[0] && dateStrings[1]) {
                setSelectedKeys([[dateStrings[0], dateStrings[1]]]);
                confirm();
              } else {
                setSelectedKeys([]);
                confirm();
              }
            }}
            style={{ marginBottom: 8, display: "block" }}
            format="YYYY-MM-DD"
          />
          <Button
            onClick={() => {
              clearFilters();
              confirm();
            }}
            size="small"
            style={{ width: "100%" }}
          >
            Reset
          </Button>
        </div>
      ),
      onFilter: (value, record) => {
        if (!value || value.length !== 2) return true;

        const [start, end] = value;
        const arrival = dayjs(record.arrivaldate, "YYYY-MM-DD");

        return (
          arrival.isSameOrAfter(dayjs(start, "YYYY-MM-DD")) &&
          arrival.isSameOrBefore(dayjs(end, "YYYY-MM-DD"))
        );
      },

      filterIcon: (filtered) => (
        <span>
          <FilterFilled />
        </span>
      ),
    },

    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="primary" onClick={() => showModal(record)}>
            View More
          </Button>
          <Button type="primary" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button
            danger
            type="primary"
            onClick={() => showDeleteConfirm(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const showModal = (pet) => {
    setSelectedPet(pet);
    setIsModalVisible(true);
  };

  const handleEdit = (pet) => {
    setEditingPet(pet);
    setIsEditModalVisible(true);
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
      <Sidebar />
      <div style={{ flexGrow: 1 }}>
        <HeaderBar userName={adminName || "Admin"} />
        <div style={{ padding: "20px" }}>
          <Card bordered style={{ marginBottom: "20px" }}>
            <Title level={3} style={{ textAlign: "center" }}>
              Manage Pets
            </Title>
            <Row
              justify="space-between"
              align="middle"
              style={{ marginBottom: "20px" }}
            >
              <Col>
                <Button
                  type="primary"
                  icon={<PlusCircleOutlined />}
                  onClick={() => setIsAddModalVisible(true)}
                >
                  Add Pet
                </Button>
              </Col>
              <Col xs={24} sm={8}>
                <Search
                  placeholder="Search by Type"
                  allowClear
                  value={searchType}
                  onChange={(e) => handleSearchType(e.target.value)}
                />
              </Col>
            </Row>
          </Card>
          <Card>
            <Table
              dataSource={filteredPets}
              columns={columns}
              rowKey="id"
              pagination={false}
              scroll={{ x: "max-content" }}
            />

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            ></div>
          </Card>
          <Modal
            visible={isModalVisible}
            onCancel={handleCloseModal}
            footer={null}
            centered
            width={600}
            bodyStyle={{
              height: "500px",
              overflowY: "auto",
            }}
          >
            {selectedPet && (
              <div style={{ textAlign: "center", marginBottom: 20 }}>
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

                <Title
                  level={3}
                  style={{ marginBottom: "5px", fontWeight: "600" }}
                >
                  {selectedPet.pet_name || "No Name"}
                </Title>

                <Text
                  type="secondary"
                  style={{ fontSize: "16px", marginBottom: "20px" }}
                >
                  {selectedPet.status || "Unknown Status"}
                </Text>

                <Title
                  level={4}
                  style={{ marginBottom: 15, textAlign: "start" }}
                >
                  📋 Pet Information
                </Title>
                <Descriptions
                  bordered
                  column={1}
                  style={{ marginBottom: 24, textAlign: "start" }}
                >
                  <Descriptions.Item label="Name">
                    {selectedPet.pet_name || "Unknown"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Type">
                    {selectedPet.type || "Unknown"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Breed">
                    {selectedPet.breed || "Unknown"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Gender">
                    {selectedPet.sex || "Unknown"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Age">
                    {selectedPet.age || "Unknown"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Size">
                    {selectedPet.size || "Unknown"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Color">
                    {selectedPet.color || "Unknown"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Arrival Date">
                    {selectedPet.arrivaldate || "Unknown"}
                  </Descriptions.Item>
                </Descriptions>

                <Title
                  level={4}
                  style={{ marginBottom: 15, textAlign: "start" }}
                >
                  🩺 Health & Status
                </Title>
                <Descriptions
                  bordered
                  column={1}
                  size="small"
                  style={{ marginBottom: 24, textAlign: "start" }}
                >
                  <Descriptions.Item label="Vaccinated">
                    {selectedPet.vaccinated || "Unknown"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Skin Condition">
                    {selectedPet.skin_condition || "Unknown"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Appearance">
                    {selectedPet.appearance || "Unknown"}
                  </Descriptions.Item>
                </Descriptions>

          
                <Title
                  level={4}
                  style={{ marginBottom: 15, textAlign: "start" }}
                >
                  🧠 Personality & Behavior
                </Title>
                <Descriptions
                  bordered
                  column={1}
                  size="small"
                  style={{ marginBottom: 24, textAlign: "start" }}
                >
                  <Descriptions.Item label="Temperament">
                    {selectedPet.temperament || "Unknown"}
                  </Descriptions.Item>
                </Descriptions>

                <Title
                  level={4}
                  style={{ marginBottom: 15, textAlign: "start" }}
                >
                  📖 Background
                </Title>
                <Descriptions
                  bordered
                  column={1}
                  size="small"
                  style={{ textAlign: "start" }}
                >
                  <Descriptions.Item label="Background">
                    {selectedPet.background || "None"}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}
          </Modal>
          <Modal
            visible={isAddModalVisible}
            onCancel={() => setIsAddModalVisible(false)}
            footer={null}
            centered
            width={600}
            bodyStyle={{
              height: "500px",
              overflowY: "auto",
            }}
          >
            <AddPetsForm
              onFinishSuccess={() => {
                fetchPets();
                setIsAddModalVisible(false);
              }}
            />
          </Modal>
          <Modal
            title={`✏️ Edit Pet Information: ${
              editingPet?.pet_name || "Unknown"
            }`}
            visible={isEditModalVisible}
            onCancel={() => {
              setIsEditModalVisible(false);
              setEditingPet(null);
            }}
            footer={null}
            centered
            width={600}
            bodyStyle={{
              height: "450px",
              overflowY: "auto",
            }}
          >
            <AddPetsForm
              pet={editingPet}
              isEdit={true}
              onFinishSuccess={() => {
                fetchPets();
                setIsEditModalVisible(false);
                setEditingPet(null);
              }}
            />
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default ManagePets;
