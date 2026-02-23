import { useEffect, useState } from 'react';
import { supabase, Batch } from '../lib/supabase';
import { Edit2, Check, X, AlertCircle, Trash2 } from 'lucide-react';

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
      const { data: batchesData, error: batchesError } = await supabase
        .from('batch_master')
        .select('*')
        .order('created_at', { ascending: false });

      if (batchesError) throw batchesError;

      const { data: productsData, error: productsError } = await supabase
        .from('product_master')
        .select('id, product_name');

      if (productsError) throw productsError;

      const productsMap = new Map(productsData?.map(p => [p.id, p.product_name]) || []);

      const batchesWithProducts = (batchesData || []).map(batch => ({
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
      const { error: updateError } = await supabase
        .from('batch_master')
        .update({
          batch_number: editedData.batch_number,
          current_stock_qty: editedData.current_stock_qty,
          purchase_rate: editedData.purchase_rate,
          mrp: editedData.mrp,
          warehouse_location: editedData.warehouse_location || null,
          supplier_name: editedData.supplier_name || null,
          expiry_date: editedData.expiry_date || null,
          manufacturing_date: editedData.manufacturing_date || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

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
      const { error: deleteError } = await supabase
        .from('batch_master')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Grid View</h2>
          <p className="text-gray-600 mt-1">View and edit batch inventory data</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Product
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Batch Number
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Stock Qty
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Purchase Rate
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                MRP
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Mfg Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Expiry Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Location
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Supplier
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {batches.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                  No inventory data found. Add products and batches to get started.
                </td>
              </tr>
            ) : (
              batches.map((batch) => {
                const isEditing = editingId === batch.id;

                return (
                  <tr key={batch.id} className={`hover:bg-gray-50 ${isEditing ? 'bg-blue-50' : ''}`}>
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

      <div className="text-sm text-gray-600">
        Total Batches: <span className="font-medium">{batches.length}</span>
      </div>
    </div>
  );
}
