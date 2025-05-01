import React, { useState, useEffect } from "react";
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
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

const AddPets = ({ pet = null, isEdit = false, onFinishSuccess }) => {
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const CheckboxGroup = Checkbox.Group;

  useEffect(() => {
    if (isEdit && pet) {
      form.resetFields(); 
      form.setFieldsValue({
        ...pet,
        arrivaldate: pet.arrivaldate ? dayjs(pet.arrivaldate) : null,
      });

      setImagePreview(pet.images || null);
    }
  }, [isEdit, pet]);

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
    let imageUrl = pet?.images || ""; 

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
        status: pet?.status || "Available",
      };

      Object.keys(petData).forEach((key) => {
        if (petData[key] === undefined) {
          delete petData[key];
        }
      });

      if (isEdit && pet?.id) {
        await updateDoc(doc(db, "pet", pet.id), petData);
        message.success("🐾 Pet updated successfully!");
      } else {
        await addDoc(collection(db, "pet"), petData);
        message.success("🐾 Pet added successfully!");
      }

      form.resetFields();
      setImagePreview(null);
      if (onFinishSuccess) onFinishSuccess();
    } catch (error) {
      console.error("Error saving pet:", error);
      message.error("Failed to save pet. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card
      bordered={false}
      style={{
        boxShadow: "none", 
        borderRadius: "8px",
        padding: "0px",
        background: "#fff",
        width: "100%", 
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

          <Col xs={24}>
            <Form.Item
              name="imageFile"
              label="Pet Image"
              valuePropName="fileList"
              getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
              rules={
                !isEdit
                  ? [{ required: true, message: "Please upload a pet image!" }]
                  : []
              }
            >
              <Upload
                beforeUpload={() => false}
                maxCount={1}
                accept="image/*"
                listType="picture-card"
                onChange={({ fileList }) => handleImageChange(fileList)}
                defaultFileList={
                  isEdit && pet?.images
                    ? [
                        {
                          uid: "-1",
                          name: "Current Image",
                          status: "done",
                          url: pet.images,
                        },
                      ]
                    : []
                }
                showUploadList={{
                  showPreviewIcon: true,
                  showRemoveIcon: true,
                }}
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
                📋 Pet Information
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
              label="Type of Animal"
              rules={[
                {
                  required: true,
                  message: "Please select the Type of Animal!",
                },
              ]}
            >
              <Select placeholder="Select animal type">
                <Select.Option value="Dog">Dog</Select.Option>
                <Select.Option value="Cat">Cat</Select.Option>
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
            <Form.Item name="skin_condition" label="Skin Condition">
              <Select>
                <Option value="Good">Good</Option>
                <Option value="Moderate Issue">Moderate Issue</Option>
                <Option value="Bad">Bad</Option>
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

          <Col xs={24}>
            <Form.Item name="appearance" label="Appearance">
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
                📖 Background (Optional)
              </Title>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}></Col>

          <Col xs={24}>
            <Form.Item name="background">
              <Input.TextArea
                rows={4}
                placeholder="Share the rescue background or story..."
              />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={uploading}
                style={{ width: "100%", borderRadius: "8px" }}
              >
                {uploading ? "Uploading..." : isEdit ? "Update Pet" : "Add Pet"}
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default AddPets;
