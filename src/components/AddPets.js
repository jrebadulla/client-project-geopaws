import React, { useState } from 'react';
import { Form, Input, Button, Typography, Upload, Select, DatePicker, Card, Row, Col, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { db, storage } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import Sidebar from './Sidebar';
import HeaderBar from './HeaderBar'; // Import reusable header

const { Title } = Typography;
const { Option } = Select;

const AddPets = ({ adminName }) => {
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null); // State for image preview

  const handleImageChange = (fileList) => {
    if (fileList && fileList[0]) {
      const file = fileList[0].originFileObj;
      const reader = new FileReader();

      reader.onload = (e) => {
        setImagePreview(e.target.result); // Set the preview URL
      };

      reader.readAsDataURL(file);
    } else {
      setImagePreview(null); // Reset preview if no file is selected
    }
  };

  const onFinish = async (values) => {
    console.log("Form Values Submitted:", values);
    setUploading(true);
    let imageUrl = '';

    try {
      if (values.imageFile && values.imageFile[0]) {
        const imageFile = values.imageFile[0].originFileObj;
        const storageRef = ref(storage, `images/${Date.now()}_${imageFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, imageFile);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            null,
            reject,
            async () => {
              imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      }

      const { imageFile, ...cleanedValues } = values;

      // Remove undefined optional fields
      const petData = {
        ...cleanedValues,
        images: imageUrl,
        arrivaldate: values.arrivaldate.format('YYYY-MM-DD'),
      };

      // Filter out undefined fields
      Object.keys(petData).forEach((key) => {
        if (petData[key] === undefined) {
          delete petData[key];
        }
      });

      const petCollectionRef = collection(db, 'pet');
      await addDoc(petCollectionRef, petData);

      message.success('Pet added successfully!');
      form.resetFields();
      setImagePreview(null); // Reset image preview
    } catch (error) {
      console.error('Error adding pet:', error);
      message.error('Failed to add pet. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div style={{ flexGrow: 1 }}>
        <HeaderBar userName={adminName || "Admin"} /> {/* Reusable Header */}
        <div style={{ padding: '20px' }}>
          <Card style={{ width: '100%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <Title level={3} style={{ textAlign: 'center', marginBottom: '20px' }}>
              Add New Pet
            </Title>
            <Form form={form} layout="vertical" onFinish={onFinish}>
              <Row gutter={[16, 16]}>
                {/* Image Upload Section */}
                <Col xs={24}>
                  <Form.Item
                    name="imageFile"
                    label="Upload Image"
                    valuePropName="fileList"
                    getValueFromEvent={(e) => {
                      const fileList = Array.isArray(e) ? e : e?.fileList;
                      handleImageChange(fileList); // Update image preview
                      return fileList;
                    }}
                    rules={[{ required: true, message: 'Please upload an image' }]}
                  >
                    <Upload beforeUpload={() => false} maxCount={1} accept="image/*">
                      <Button icon={<UploadOutlined />}>Click to Upload</Button>
                    </Upload>
                  </Form.Item>
                  {/* Image Preview */}
                  {imagePreview && (
                    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{ maxWidth: '100%', maxHeight: '200px', border: '1px solid #ddd', padding: '5px', borderRadius: '5px' }}
                      />
                    </div>
                  )}
                </Col>

                {/* Pet Name */}
                <Col xs={24} sm={12}>
                  <Form.Item name="pet_name" label="Pet Name" rules={[{ required: true, message: "Please enter the pet's name" }]}>
                    <Input placeholder="Fluffy" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item name="age" label="Age" rules={[{ required: true }]}>
                    <Input placeholder="3 years old" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item name="arrivaldate" label="Arrival Date" rules={[{ required: true }]}>
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item name="color" label="Color" rules={[{ required: true }]}>
                    <Input placeholder="Tricolor" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item name="sex" label="Sex" rules={[{ required: true }]}>
                    <Select placeholder="Select sex">
                      <Option value="Male">Male</Option>
                      <Option value="Female">Female</Option>
                    </Select>
                  </Form.Item>
                </Col>

                {/* Size Dropdown */}
                <Col xs={24} sm={12}>
                  <Form.Item name="size" label="Size" rules={[{ required: true }]}>
                    <Select placeholder="Select size">
                      <Option value="Small">Small</Option>
                      <Option value="Medium">Medium</Option>
                      <Option value="Large">Large</Option>
                      <Option value="Extra Large">Extra Large</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                    <Input placeholder="Available" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                    <Input placeholder="Cat" />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item name="health_issues" label="Health Issues">
                    <Input placeholder="Healthy" />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item name="rescue_location" label="Rescue Location">
                    <Input placeholder="Laguna" />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item name="additional_details" label="Additional Details">
                    <Input.TextArea placeholder="None" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={uploading} block>
                  {uploading ? 'Uploading...' : 'Add Pet'}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AddPets;
