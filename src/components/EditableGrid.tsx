import { useEffect, useState } from 'react';
import { Edit2, Check, X, AlertCircle, Trash2 } from 'lucide-react';

// Define Batch type locally since we removed Supabase dependency
interface Batch {
  id: string;
  product_id: string;
  variant_value: string | null;
  batch_number: string;
  manufacturing_date: string | null;
  expiry_date: string | null;
  purchase_rate: number;
  mrp: number;
  gst_percentage: number;
  initial_quantity: number;
  current_stock_qty: number;
  warehouse_location: string | null;
  cold_storage: boolean;
  supplier_name: string | null;
  purchase_invoice_no: string | null;
  created_at: string;
  updated_at: string;
}

interface EditableBatch extends Batch {
  product_name?: string;
}

interface EditableBatch extends Batch {
  product_name?: string;
}

export default function EditableGrid() {
  const [batches, setBatches] = useState<EditableBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<Partial<EditableBatch>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      
      // Load from localStorage or use mock data since we removed Supabase dependency
      const storedBatches = JSON.parse(localStorage.getItem('batches') || '[]');
      const storedProducts = JSON.parse(localStorage.getItem('products') || '[]');
      
      // Create a product map for product names
      const productsMap = new Map(storedProducts.map((p: any) => [p.id, p.product_name]));

      const batchesWithProducts = storedBatches.map((batch: any) => ({
        ...batch,
        product_name: productsMap.get(batch.product_id) || 'Unknown Product'
      }));

      setBatches(batchesWithProducts);
    } catch (err) {
      console.error('Error fetching batches:', err);
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (batch: EditableBatch) => {
    setEditingId(batch.id);
    setEditedData({
      batch_number: batch.batch_number,
      current_stock_qty: batch.current_stock_qty,
      purchase_rate: batch.purchase_rate,
      mrp: batch.mrp,
      warehouse_location: batch.warehouse_location || '',
      supplier_name: batch.supplier_name || '',
      expiry_date: batch.expiry_date || '',
      manufacturing_date: batch.manufacturing_date || '',
    });
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedData({});
    setError(null);
  };

  const handleSave = async (id: string) => {
    try {
      // Update the batch in localStorage since we removed Supabase dependency
      const storedBatches = JSON.parse(localStorage.getItem('batches') || '[]');
      const batchIndex = storedBatches.findIndex((b: any) => b.id === id);
      
      if (batchIndex !== -1) {
        storedBatches[batchIndex] = {
          ...storedBatches[batchIndex],
          ...editedData,
          updated_at: new Date().toISOString(),
        };
        
        localStorage.setItem('batches', JSON.stringify(storedBatches));
      }

      setSuccess('Batch updated successfully');
      setEditingId(null);
      setEditedData({});
      await fetchBatches();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update batch');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this batch? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete the batch from localStorage since we removed Supabase dependency
      const storedBatches = JSON.parse(localStorage.getItem('batches') || '[]');
      const updatedBatches = storedBatches.filter((b: any) => b.id !== id);
      
      localStorage.setItem('batches', JSON.stringify(updatedBatches));

      setSuccess('Batch deleted successfully');
      await fetchBatches();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete batch');
    }
  };

  const handleFieldChange = (field: keyof EditableBatch, value: string | number) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <style>{`
        .card-glass {
          background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.3);
        }
      `}</style>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 via-red-500 to-purple-600 bg-clip-text text-transparent">Inventory Grid View</h2>
          <p className="text-gray-600 mt-1">View and edit batch inventory data</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50/50 border border-red-200/50 rounded-xl text-red-700 shadow-sm backdrop-blur-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50/50 border border-green-200/50 rounded-xl text-green-700 shadow-sm backdrop-blur-sm">
          <Check className="w-5 h-5 flex-shrink-0 text-green-500" />
          <span className="font-medium">{success}</span>
        </div>
      )}

      <div className="overflow-x-auto card-glass rounded-2xl shadow-xl border border-white/30 backdrop-blur-sm">
        <table className="min-w-full divide-y divide-gray-200/50">
          <thead className="bg-white/50 backdrop-blur-sm border-b border-gray-200/30">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-white/30">
                Product
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-white/30">
                Batch Number
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-white/30">
                Stock Qty
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-white/30">
                Purchase Rate
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-white/30">
                MRP
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-white/30">
                Mfg Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-white/30">
                Expiry Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-white/30">
                Location
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-white/30">
                Supplier
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider bg-white/30 border-l border-gray-200/30">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white/30 divide-y divide-gray-200/30">
            {batches.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                  <div className="text-lg font-medium bg-gradient-to-r from-gray-600 to-gray-700 bg-clip-text text-transparent">No inventory data found</div>
                  <p className="text-sm text-gray-600 mt-2">Add products and batches to get started.</p>
                </td>
              </tr>
            ) : (
              batches.map((batch) => {
                const isEditing = editingId === batch.id;
          
                return (
                  <tr key={batch.id} className={`hover:bg-white/50 ${isEditing ? 'bg-blue-50/30' : ''} transition-all duration-200`}>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {batch.product_name}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedData.batch_number || ''}
                          onChange={(e) => handleFieldChange('batch_number', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <span className="text-gray-900">{batch.batch_number}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editedData.current_stock_qty || 0}
                          onChange={(e) => handleFieldChange('current_stock_qty', parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                        />
                      ) : (
                        <span className={`font-medium ${batch.current_stock_qty < 10 ? 'text-red-600' : 'text-green-600'}`}>
                          {batch.current_stock_qty}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editedData.purchase_rate || 0}
                          onChange={(e) => handleFieldChange('purchase_rate', parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          step="0.01"
                          min="0"
                        />
                      ) : (
                        <span className="text-gray-900">₹{batch.purchase_rate.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editedData.mrp || 0}
                          onChange={(e) => handleFieldChange('mrp', parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          step="0.01"
                          min="0"
                        />
                      ) : (
                        <span className="text-gray-900">₹{batch.mrp.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editedData.manufacturing_date || ''}
                          onChange={(e) => handleFieldChange('manufacturing_date', e.target.value)}
                          className="w-36 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <span className="text-gray-600">
                          {batch.manufacturing_date ? new Date(batch.manufacturing_date).toLocaleDateString() : 'N/A'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editedData.expiry_date || ''}
                          onChange={(e) => handleFieldChange('expiry_date', e.target.value)}
                          className="w-36 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <span className={`${
                          batch.expiry_date && new Date(batch.expiry_date) < new Date()
                            ? 'text-red-600 font-medium'
                            : 'text-gray-600'
                        }`}>
                          {batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString() : 'N/A'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedData.warehouse_location || ''}
                          onChange={(e) => handleFieldChange('warehouse_location', e.target.value)}
                          className="w-28 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <span className="text-gray-600">{batch.warehouse_location || 'N/A'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedData.supplier_name || ''}
                          onChange={(e) => handleFieldChange('supplier_name', e.target.value)}
                          className="w-32 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <span className="text-gray-600">{batch.supplier_name || 'N/A'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleSave(batch.id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Save"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="Cancel"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(batch)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(batch.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-gray-600 bg-white/30 px-4 py-3 rounded-xl border border-gray-200/30 backdrop-blur-sm">
        Total Batches: <span className="font-medium text-gray-900 bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">{batches.length}</span>
      </div>
    </div>
  );
}
