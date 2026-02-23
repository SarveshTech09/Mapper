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
  isNew: boolean;
  category: string;
  sub_category: string;
  status: "active" | "inactive";
}

const { Title, Text } = Typography;

export default function ProductDataEntry() {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<string>();
  const [subCategoryFilter, setSubCategoryFilter] = useState<string>();
  const [categories, setCategories] = useState<
    { value: string; label: string }[]
  >([]);

  useEffect(() => {
    const initialize = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        /* ---------- STEP 1: Get Business ID ---------- */
        const meResponse = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/me`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!meResponse.ok) {
          throw new Error(`ME API Error: ${meResponse.status}`);
        }

        const meData = await meResponse.json();
        const businessId = meData.business_id;

        if (!businessId) {
          throw new Error("Business ID not found");
        }

        /* ---------- STEP 2: Fetch Categories ---------- */
        const categoryResponse = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/getCategory`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              business_id: businessId,
              sub_category_id: 0,
            }),
          }
        );

        if (!categoryResponse.ok) {
          throw new Error(
            `Category API Error: ${categoryResponse.status}`
          );
        }

        const categoryData = await categoryResponse.json();
        const categoryArray = categoryData.data ?? [];

        /* ---------- STEP 3: Format Rows ---------- */
        const formattedData: ProductRow[] = categoryArray.map(
          (item: any, index: number) => ({
            id: index.toString(),
            isNew: false,
            category: item.category_type, // 🔥 FIXED
            sub_category: "", // no sub category in response
            status: "active", // default
          })
        );

        setRows(formattedData);

        /* ---------- STEP 4: Build Category Select ---------- */
        const categoryOptions = categoryArray.map((item: any) => ({
          value: item.category_type,
          label: item.category_type,
        }));

        setCategories(categoryOptions);
      } catch (error: any) {
        console.error("Category fetch error:", error);
        setError(error.message || "Failed to load categories.");
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const categoryOptions = useMemo(() => {
    return [...new Set(rows.map((r) => r.category))].map((cat) => ({
      value: cat,
      label: cat,
    }));
  }, [rows]);

  const subCategoryOptions = useMemo(() => {
    const filtered = categoryFilter
      ? rows.filter((r) => r.category === categoryFilter)
      : rows;

    return [...new Set(filtered.map((r) => r.sub_category))].map((sub) => ({
      value: sub,
      label: sub,
    }));
  }, [rows, categoryFilter]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchCategory = categoryFilter
        ? row.category === categoryFilter
        : true;
      const matchSubCategory = subCategoryFilter
        ? row.sub_category === subCategoryFilter
        : true;

      return matchCategory && matchSubCategory;
    });
  }, [rows, categoryFilter, subCategoryFilter]);

  /* -------------------- Handlers -------------------- */
  const addNewRow = () => {
    const newRow: ProductRow = {
      id: `temp-${Date.now()}`,
      isNew: true,
      category: categoryFilter ?? "",
      sub_category: subCategoryFilter ?? "",
      status: "active",
    };

    setRows((prev) => [newRow, ...prev]);
  };

  const clearFilters = () => {
    setCategoryFilter(undefined);
    setSubCategoryFilter(undefined);
  };

  /* -------------------- Loading State -------------------- */
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", minHeight: 400 }}>
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

        <Button type="primary" icon={<PlusOutlined />} onClick={addNewRow}>
          Add New Category
        </Button>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
        />
      )}

      <Card>
        {/* Filters */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Text strong>Category Filter</Text>
            <Select
              showSearch
              allowClear
              placeholder="Select category"
              style={{ width: "100%", marginTop: 6 }}
              value={categoryFilter}
              onChange={(val) => {
                setCategoryFilter(val);
                setSubCategoryFilter(undefined);
              }}
              options={categoryOptions}
            />
          </Col>

          <Col span={12}>
            <Text strong>Sub Category Filter</Text>
            <Select
              showSearch
              allowClear
              placeholder="Select sub category"
              style={{ width: "100%", marginTop: 6 }}
              value={subCategoryFilter}
              onChange={setSubCategoryFilter}
              options={subCategoryOptions}
              disabled={!categoryFilter}
            />
          </Col>
        </Row>

        {(categoryFilter || subCategoryFilter) && (
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <Text type="secondary">
              Showing {filteredRows.length} of {rows.length} categories
            </Text>
            <Button type="link" size="small" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        )}

        {/* Table */}
        <Table
          dataSource={filteredRows}
          pagination={false}
          rowKey="id"
          rowClassName={(record) =>
            record.isNew
              ? "row-new"
              : record.status === "inactive"
              ? "row-inactive"
              : ""
          }
          locale={{
            emptyText: (
              <div style={{ padding: 40 }}>
                <Text type="secondary">
                  No categories available. Click "Add New Category" to begin.
                </Text>
              </div>
            ),
          }}
        >
          <Table.Column title="Category" dataIndex="category" key="category" />
          <Table.Column
            title="Sub Category"
            dataIndex="sub_category"
            key="sub_category"
          />
        </Table>
      </Card>

      {/* Summary */}
      <Card size="small">
        <Text type="secondary">Active: </Text>
        <Text strong>
          {filteredRows.filter((r) => r.status === "active" && !r.isNew).length}
        </Text>

        <Text type="secondary" style={{ marginLeft: 12 }}>
          Inactive:{" "}
          {filteredRows.filter((r) => r.status === "inactive").length}
        </Text>
      </Card>
    </div>
  );
}