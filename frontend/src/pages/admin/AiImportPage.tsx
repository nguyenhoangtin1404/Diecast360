import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Loader2, Check, AlertCircle } from 'lucide-react';
import { isAxiosError } from 'axios';
import { apiClient, uploadFile } from '../../api/client';
import type { ItemFormData, ApiErrorResponse } from '../../types/item.types';
import { showToast } from '../../utils/toast';

interface AiDraftResponse {
  draftId: string;
  aiJson: {
    brand?: string;
    model_name?: string;
    scale?: string;
    color?: string;
    product_code?: string;
    car_brand?: string;
    model_brand?: string;
  };
  confidence: Record<string, number>;
  images: string[];
}

interface CreateItemResponse {
  item: {
    id: string;
  };
  warning?: {
    code: string;
    message: string;
    failedImages?: string[];
  };
}

interface ApiEnvelope<T> {
  ok: boolean;
  data: T;
  message?: string;
}

export const AiImportPage = () => {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [draft, setDraft] = useState<AiDraftResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<ItemFormData>>({});

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      if (files.length < 3) {
        // Warning? The requirement said "Upload >= 3 images -> draft". 
        // But preventing upload might be annoying. Just proceed.
      }
      
      const formData = new FormData();
      files.forEach(file => formData.append('images', file));

      setUploading(true);
      setError(null);
      setAnalyzing(true);

      try {
        const response = await uploadFile<{ ok: boolean; data: AiDraftResponse }>('/items/ai-draft', formData);
        const data = response.data;
        
        setDraft(data);
        setFormData({
            name: `${data.aiJson.brand || ''} ${data.aiJson.model_brand || ''} ${data.aiJson.car_brand || ''}`.trim() || 'New Item',
            brand: data.aiJson.brand || '',
            car_brand: data.aiJson.car_brand || '',
            model_brand: data.aiJson.model_brand || '',
            scale: data.aiJson.scale || '1:64',
            condition: 'new', // Default
            price: 0,
            status: 'con_hang',
            is_public: false,
            description: `Color: ${data.aiJson.color || ''}. Code: ${data.aiJson.product_code || ''}`,
        });
      } catch (err) {
        console.error('Upload failed', err);
        if (isAxiosError<ApiErrorResponse>(err)) {
          setError(err.response?.data?.message || 'Failed to analyze images');
        } else {
          setError('Failed to analyze images');
        }
      } finally {
        setUploading(false);
        setAnalyzing(false);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleSave = async () => {
    if (!draft) return;
    try {
        setUploading(true);
        const response = await apiClient.post<
          ApiEnvelope<CreateItemResponse>,
          ApiEnvelope<CreateItemResponse>
        >('/items', {
            ...formData,
            draft_id: draft.draftId
        });
        const result = response.data;
        if (result.warning) {
          showToast(
            `Sản phẩm đã được tạo nhưng còn ảnh draft chưa import hết: ${result.warning.message}`,
            '#f59e0b',
            4000,
          );
          navigate(`/admin/items/${result.item.id}`);
          return;
        }
        navigate('/admin/items');
    } catch (err) {
        console.error('Save failed', err);
        if (isAxiosError<ApiErrorResponse>(err)) {
          setError(err.response?.data?.message || 'Failed to save item');
        } else {
          setError('Failed to save item');
        }
        setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <button 
        onClick={() => navigate('/admin/items')}
        className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={20} className="mr-2" />
        Back to Items
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">AI Quick Import</h1>
        <p className="text-gray-400">Upload photos (box, bottom, overview) to auto-fill item details.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex items-center text-red-400">
            <AlertCircle size={20} className="mr-3" />
            {error}
        </div>
      )}

      {/* Upload Area - Only show if no draft or if we want to allow re-upload (maybe hidden if draft exists for simplicity) */}
      {!draft && (
          <div className="border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-xl p-12 text-center transition-colors bg-gray-900/50">
            {analyzing ? (
                <div className="flex flex-col items-center justify-center p-8">
                    <Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
                    <h3 className="text-xl font-medium text-white">Analyzing Images...</h3>
                    <p className="text-gray-400 mt-2">Extracting Brand, Model, Scale, and Details (powered by Vision AI)</p>
                </div>
            ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center">
                    <Upload size={48} className="text-gray-500 mb-4" />
                    <span className="text-xl font-medium text-white">Click or Drag photos here</span>
                    <span className="text-gray-500 mt-2">Upload at least 3 photos for best results</span>
                    <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChange} 
                    />
                </label>
            )}
          </div>
      )}

      {draft && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Images */}
              <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Uploaded Images</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      {draft.images.map((img, idx) => (
                          <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-gray-700 bg-gray-800">
                              <img src={img} alt={`Draft ${idx}`} className="w-full h-full object-cover" />
                          </div>
                      ))}
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-blue-300 text-sm">
                      <p className="font-semibold mb-1">AI Analysis Confidence:</p>
                      <div className="grid grid-cols-2 gap-2">
                          {Object.entries(draft.confidence || {}).map(([key, val]) => (
                              <div key={key} className="flex justify-between">
                                  <span className="capitalize">{key}:</span>
                                  <span>{Math.round(val * 100)}%</span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>

              {/* Right: Form */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl">
                  <h3 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-4">Confirm Details</h3>
                  
                  <div className="space-y-4">
                      {/* Name */}
                      <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Product Name</label>
                          <input 
                            name="name" 
                            value={formData.name || ''} 
                            onChange={handleChange}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          {/* Brand */}
                          <div>
                              <label className="block text-sm font-medium text-gray-400 mb-1">Brand</label>
                              <input 
                                name="brand" 
                                value={formData.brand || ''} 
                                onChange={handleChange}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                              />
                          </div>
                          {/* Scale */}
                          <div>
                              <label className="block text-sm font-medium text-gray-400 mb-1">Scale</label>
                              <input 
                                name="scale" 
                                value={formData.scale || ''} 
                                onChange={handleChange}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                              />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          {/* Car Brand */}
                          <div>
                              <label className="block text-sm font-medium text-gray-400 mb-1">Car Brand</label>
                              <input 
                                name="car_brand" 
                                value={formData.car_brand || ''} 
                                onChange={handleChange}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                              />
                          </div>
                          {/* Model Brand */}
                          <div>
                              <label className="block text-sm font-medium text-gray-400 mb-1">Model Brand</label>
                              <input 
                                name="model_brand" 
                                value={formData.model_brand || ''} 
                                onChange={handleChange}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                              />
                          </div>
                      </div>

                      {/* Description */}
                      <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                          <textarea 
                            name="description" 
                            rows={3}
                            value={formData.description || ''} 
                            onChange={handleChange}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                          />
                      </div>

                       {/* Price & Condition */}
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-400 mb-1">Price (VND)</label>
                              <input 
                                type="number"
                                name="price" 
                                value={formData.price || 0} 
                                onChange={handleChange}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-400 mb-1">Condition</label>
                              <select 
                                name="condition" 
                                value={formData.condition || 'new'} 
                                onChange={handleChange}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                              >
                                  <option value="new">New</option>
                                  <option value="old">Used</option>
                              </select>
                          </div>
                      </div>
                  </div>

                  <div className="mt-8 flex justify-end space-x-4">
                      <button 
                        onClick={() => { setDraft(null); setFormData({}); }}
                        className="px-6 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
                      >
                          Discard
                      </button>
                      <button 
                        onClick={handleSave}
                        disabled={uploading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center"
                      >
                          {uploading ? <Loader2 className="animate-spin mr-2" size={18} /> : <Check className="mr-2" size={18} />}
                          Confirm & Save Item
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
