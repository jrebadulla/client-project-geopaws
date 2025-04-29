import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Typography,
  Upload,
  Select,
  DatePicker,
  Card,
  Row,
  Col,
  message,
  Divider,
  Checkbox,
} from "antd";
import { UploadOutlined, PlusOutlined } from "@ant-design/icons";
import { db, storage } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const { Title, Text } = Typography;
const { Option } = Select;

const AddPets = ({ adminName }) => {
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const CheckboxGroup = Checkbox.Group;

  const handleImageChange = (fileList) => {
    if (fileList && fileList[0]) {
      const file = fileList[0].originFileObj;
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const onFinish = async (values) => {
    setUploading(true);
    let imageUrl = "";

    try {
      if (values.imageFile && values.imageFile[0]) {
        const imageFile = values.imageFile[0].originFileObj;
        const storageRef = ref(
          storage,
          `images/${Date.now()}_${imageFile.name}`
        );
        const uploadTask = uploadBytesResumable(storageRef, imageFile);

        await new Promise((resolve, reject) => {
          uploadTask.on("state_changed", null, reject, async () => {
            imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve();
          });
        });
      }

      const { imageFile, ...cleanedValues } = values;
      const petData = {
        ...cleanedValues,
        images: imageUrl,
        arrivaldate: values.arrivaldate.format("YYYY-MM-DD"),
      };

      Object.keys(petData).forEach((key) => {
        if (petData[key] === undefined) {
          delete petData[key];
        }
      });

      await addDoc(collection(db, "pet"), petData);

      message.success("🐾 Pet added successfully!");
      form.resetFields();
      setImagePreview(null);
    } catch (error) {
      console.error("Error adding pet:", error);
      message.error("Failed to add pet. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    // <div
    //   style={{
    //     minHeight: "100vh",
    //     background: "black",
    //     padding: "40px 20px",
    //   }}
    // >
    <Card
      bordered={false}
      style={{
        boxShadow: "none", // remove extra shadow
        borderRadius: "8px",
        padding: "0px",
        background: "#fff",
        width: "100%", // full width inside modal
      }}
    >
      <Title level={3} style={{ textAlign: "center", marginBottom: "10px" }}>
        🐾 Pet Profile - Available for Adoption
      </Title>

      <Text
        type="secondary"
        style={{
          display: "block",
          textAlign: "center",
          marginBottom: "30px",
        }}
      >
        Fill out the details below to list a pet for adoption
      </Text>

      <Divider />

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        size="large"
        scrollToFirstError
        style={{ width: "100%" }}
      >
        <Row gutter={[24, 24]}>
          {/* Upload Image */}
          <Col xs={24}>
            <Form.Item
              name="imageFile"
              label="Pet Image"
              valuePropName="fileList"
              getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
              rules={[
                { required: true, message: "Please upload a pet image!" },
              ]}
            >
              <Upload
                beforeUpload={() => false}
                maxCount={1}
                accept="image/*"
                listType="picture-card"
                onChange={({ fileList }) => handleImageChange(fileList)}
              >
                <UploadOutlined style={{ fontSize: 24 }} />
                <div style={{ marginTop: 8 }}>Upload</div>
              </Upload>
            </Form.Item>
          </Col>

          {/* Pet Name */}
          <Col xs={24} sm={12}>
            <Form.Item colon={false} label=" " style={{ marginBottom: 0 }}>
              <Title
                level={4}
                style={{
                  margin: 0,
                  padding: 0,
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                📋 Basic Information
              </Title>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}></Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="pet_name"
              label="Pet Name"
              rules={[
                { required: true, message: "Please enter the pet's name" },
              ]}
            >
              <Input placeholder="e.g., Fluffy" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="type"
              label="Species"
              rules={[
                {
                  required: true,
                  message: "Please select or enter a species!",
                },
              ]}
            >
              <Select
                mode="tags"
                placeholder="Dog, Cat, or Type your own"
                style={{ width: "100%" }}
              >
                <Option value="Dog">Dog</Option>
                <Option value="Cat">Cat</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="breed" label="Breed">
              <Input placeholder='e.g., Golden Retriever or "Mixed Breed"' />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="age" label="Age" rules={[{ required: true }]}>
              <Input placeholder="e.g., 2 years old" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="sex" label="Gender" rules={[{ required: true }]}>
              <Select placeholder="Select gender">
                <Option value="Male">Male</Option>
                <Option value="Female">Female</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="size" label="Size" rules={[{ required: true }]}>
              <Select placeholder="Select size">
                <Option value="Small">Small</Option>
                <Option value="Medium">Medium</Option>
                <Option value="Large">Large</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="arrivaldate"
              label="Arrival Date"
              rules={[
                { required: true, message: "Please select the arrival date" },
              ]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="color" label="Color" rules={[{ required: true }]}>
              <Input placeholder="e.g., Brown, White, Black" />
            </Form.Item>
          </Col>

          {/* HEALTH & STATUS */}
          <Col xs={24} sm={12}>
            <Form.Item colon={false} label=" " style={{ marginBottom: 0 }}>
              <Title
                level={4}
                style={{
                  margin: 0,
                  padding: 0,
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                🩺 Health & Status
              </Title>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}></Col>

          <Col xs={24} sm={12}>
            <Form.Item name="spayed_neutered" label="Spayed/Neutered">
              <Select>
                <Option value="Yes">Yes</Option>
                <Option value="No">No</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="vaccinated" label="Vaccinated">
              <Select>
                <Option value="Yes">Yes</Option>
                <Option value="No">No</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="dewormed" label="Dewormed">
              <Select>
                <Option value="Yes">Yes</Option>
                <Option value="No">No</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="microchipped" label="Microchipped">
              <Select>
                <Option value="Yes">Yes</Option>
                <Option value="No">No</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item name="medical_conditions" label="Medical Conditions">
              <Input placeholder="e.g., None, Allergies, Special Needs" />
            </Form.Item>
          </Col>

          {/* PERSONALITY & BEHAVIOR */}
          <Col xs={24} sm={12}>
            <Form.Item colon={false} label=" " style={{ marginBottom: 0 }}>
              <Title
                level={4}
                style={{
                  margin: 0,
                  padding: 0,
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  whiteSpace: "nowrap",
                }}
              >
                🧠 Personality & Behavior
              </Title>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}></Col>

          <Col xs={24}>
            <Form.Item name="temperament" label="Temperament">
              <Input placeholder="e.g., Playful, Calm, Energetic, Shy" />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item name="good_with" label="Good with">
              <CheckboxGroup>
                <Checkbox value="Dogs">Other Dogs</Checkbox>
                <Checkbox value="Cats">Cats</Checkbox>
                <Checkbox value="Children">Children</Checkbox>
                <Checkbox value="All">All of the above</Checkbox>
              </CheckboxGroup>
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item name="training_level" label="Training Level">
              <Select>
                <Option value="House-trained">House-trained</Option>
                <Option value="Basic Commands">Basic Commands</Option>
                <Option value="Needs Training">Needs Training</Option>
              </Select>
            </Form.Item>
          </Col>

          {/* RESCUE STORY (OPTIONAL) */}
          <Col xs={24} sm={12}>
            <Form.Item colon={false} label=" " style={{ marginBottom: 0 }}>
              <Title
                level={4}
                style={{
                  margin: 0,
                  padding: 0,
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  whiteSpace: "nowrap",
                }}
              >
                📖 Rescue Story (Optional)
              </Title>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}></Col>

          <Col xs={24}>
            <Form.Item name="rescue_story">
              <Input.TextArea
                rows={4}
                placeholder="Share the rescue background or story..."
              />
            </Form.Item>
          </Col>

          {/* Submit Button */}
          <Col xs={24}>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={uploading}
                style={{ width: "100%", borderRadius: "8px" }}
              >
                {uploading ? "Uploading..." : "Add Pet"}
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
    // </div>
  );
};

export default AddPets;
