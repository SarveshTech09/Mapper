import { useState, useEffect, useMemo } from "react";
import { PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Table,
  Alert,
  Spin,
  Typography,
  Card,
  Select,
  Row,
  Col,
} from "antd";

interface ProductRow {
  id: string;
  category: string;
  sub_category: string;
  status: "active" | "inactive";
}

const { Title, Text } = Typography;

export default function ProductDataEntry() {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [businessId, setBusinessId] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>();
  const [subCategoryFilter, setSubCategoryFilter] = useState<string>();

  const [categories, setCategories] = useState<
    { value: string; label: string }[]
  >([]);

  const [subCategories, setSubCategories] = useState<
    { value: string; label: string }[]
  >([]);

  /* ================= LOAD INITIAL DATA ================= */
  useEffect(() => {
    const fetchInitialData = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      try {
        setLoading(true);

        // 1️⃣ Get business ID
        const meRes = await fetch(`${import.meta.env.VITE_BASE_URL}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const meData = await meRes.json();
        const id = meData.business_id;
        setBusinessId(id);

        // 2️⃣ Get Categories
        const categoryRes = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/getCategory`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              business_id: id,
              sub_category_id: 0,
            }),
          },
        );

        const categoryData = await categoryRes.json();
        const categoryArray = categoryData.data ?? [];

        setRows(
          categoryArray.map((item: any, index: number) => ({
            id: index.toString(),
            category: item.category_type,
            sub_category: item.product_category ?? "",
            status: "active",
          })),
        );

        setCategories(
          categoryArray.map((item: any) => ({
            value: item.category_type,
            label: item.category_type,
          })),
        );
      } catch (err) {
        console.error(err);
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  /* ================= LOAD SUB CATEGORIES ================= */
  useEffect(() => {
    const fetchSubCategories = async () => {
      if (!categoryFilter || !businessId) {
        return;
      }

      const token = localStorage.getItem("access_token");
      if (!token) return;

      try {
        const res = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/optical/getCategory/${businessId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              category_type: categoryFilter,
            }),
          },
        );

        const result = await res.json();
        const subArray = result.data ?? result ?? [];

        // 🔥 Update sub category dropdown
        const formattedSubCategories = subArray.map((item: any) => ({
          value: item.product_category,
          label: item.product_category,
        }));

        setSubCategories(formattedSubCategories);

        // 🔥 ALSO update table rows
        setRows(
          subArray.map((item: any, index: number) => ({
            id: index.toString(),
            category: categoryFilter,
            sub_category: item.product_category,
            status: "active",
          })),
        );
      } catch (err) {
        console.error("Sub category error:", err);
      }
    };

    fetchSubCategories();
  }, [categoryFilter, businessId]);

  const filteredRows = useMemo(() => {
    if (!subCategoryFilter) return rows;

    return rows.filter((row) => row.sub_category === subCategoryFilter);
  }, [rows, subCategoryFilter]);

  if (loading) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", minHeight: 400 }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Product Categories
          </Title>
          <Text type="secondary">
            View product categories and sub-categories
          </Text>
        </div>

        <Button type="primary" icon={<PlusOutlined />}>
          Add New Category
        </Button>
      </div>

      {error && <Alert message={error} type="error" showIcon closable />}

      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Text strong>Category Filter</Text>
            <Select
              allowClear
              placeholder="Select category"
              style={{ width: "100%", marginTop: 6 }}
              value={categoryFilter}
              onChange={(val) => {
                setCategoryFilter(val);
                setSubCategoryFilter(undefined);
              }}
              options={categories}
            />
          </Col>

          <Col span={12}>
            <Text strong>Sub Category Filter</Text>
            <Select
              allowClear
              placeholder="Select sub category"
              style={{ width: "100%", marginTop: 6 }}
              value={subCategoryFilter}
              onChange={setSubCategoryFilter}
              options={subCategories}
              disabled={!categoryFilter}
            />
          </Col>
        </Row>

        <Table dataSource={filteredRows} rowKey="id" pagination={false}>
          <Table.Column title="Category" dataIndex="category" />
          <Table.Column title="Sub Category" dataIndex="sub_category" />
        </Table>
      </Card>

      <Card size="small">
        <Text type="secondary">Total: </Text>
        <Text strong>{filteredRows.length}</Text>
      </Card>
    </div>
  );
}
