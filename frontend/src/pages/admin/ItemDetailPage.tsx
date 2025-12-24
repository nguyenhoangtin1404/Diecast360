import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const ItemDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('con_hang');
  const [isPublic, setIsPublic] = useState(false);
  const [carBrand, setCarBrand] = useState('');
  const [modelBrand, setModelBrand] = useState('');
  const [condition, setCondition] = useState('');
  const [price, setPrice] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['item', id],
    queryFn: async () => {
      const response = await apiClient.get(`/items/${id}`);
      return response.data;
    },
    enabled: !!id && id !== 'new',
    onSuccess: (data) => {
      const item = data.data?.item;
      if (item) {
        setName(item.name || '');
        setDescription(item.description || '');
        setStatus(item.status || 'con_hang');
        setIsPublic(item.is_public || false);
        setCarBrand(item.car_brand || '');
        setModelBrand(item.model_brand || '');
        setCondition(item.condition || '');
        setPrice(item.price ? item.price.toString() : '');
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (id === 'new') {
        return apiClient.post('/items', data);
      } else {
        return apiClient.patch(`/items/${id}`, data);
      }
    },
    onSuccess: async (response) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['item', id] });
      
      // Upload images if there are any
      const itemId = id === 'new' ? response.data?.item?.id : id;
      if (itemId && selectedFiles.length > 0) {
        setUploadingImages(true);
        try {
          const token = localStorage.getItem('access_token');
          for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const formData = new FormData();
            formData.append('file', file);
            formData.append('is_cover', i === 0 ? 'true' : 'false');
            
            await axios.post(`${API_BASE_URL}/items/${itemId}/images`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${token}`,
              },
            });
          }
          queryClient.invalidateQueries({ queryKey: ['item', itemId] });
          setSelectedFiles([]);
        } catch (error) {
          console.error('Error uploading images:', error);
        } finally {
          setUploadingImages(false);
        }
      }
      
      if (id === 'new') {
        navigate(`/admin/items/${itemId}`);
      }
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async ({ itemId, file, isCover }: { itemId: string; file: File; isCover: boolean }) => {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('is_cover', isCover ? 'true' : 'false');
      
      return axios.post(`${API_BASE_URL}/items/${itemId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', id] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const itemData: any = {
      name,
      description,
      status,
      is_public: isPublic,
    };
    
    if (carBrand) itemData.car_brand = carBrand;
    if (modelBrand) itemData.model_brand = modelBrand;
    if (condition) itemData.condition = condition;
    if (price) {
      const priceNum = parseFloat(price);
      if (!isNaN(priceNum) && priceNum >= 0) {
        itemData.price = priceNum;
      }
    }
    
    saveMutation.mutate(itemData);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleUploadImage = async (file: File, isCover: boolean = false) => {
    if (!id || id === 'new') return;
    uploadImageMutation.mutate({ itemId: id, file, isCover });
  };

  if (isLoading && id !== 'new') return <div>Loading...</div>;

  const item = data?.data;
  const images = item?.images || [];

  return (
    <div style={{ padding: '20px' }}>
      <button onClick={() => navigate('/admin/items')}>Back to Items</button>
      <h1>{id === 'new' ? 'New Item' : 'Edit Item'}</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: '100%', padding: '8px', minHeight: '100px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Hãng xe (Car Brand):</label>
          <input
            type="text"
            value={carBrand}
            onChange={(e) => setCarBrand(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Hãng mô hình (Model Brand):</label>
          <input
            type="text"
            value={modelBrand}
            onChange={(e) => setModelBrand(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Tình trạng (Condition):</label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          >
            <option value="">-- Chọn tình trạng --</option>
            <option value="new">Mới</option>
            <option value="old">Cũ</option>
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Giá (Price):</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Status:</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ padding: '8px' }}
          >
            <option value="con_hang">Còn hàng</option>
            <option value="giu_cho">Giữ chỗ</option>
            <option value="da_ban">Đã bán</option>
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            {' '}Public
          </label>
        </div>
        {id === 'new' && (
          <div style={{ marginBottom: '10px' }}>
            <label>Upload Images (sẽ upload sau khi tạo item):</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              style={{ width: '100%', padding: '8px' }}
            />
            {selectedFiles.length > 0 && (
              <div style={{ marginTop: '8px', color: '#666' }}>
                Đã chọn {selectedFiles.length} ảnh
              </div>
            )}
          </div>
        )}
        <button type="submit" disabled={saveMutation.isPending || uploadingImages}>
          {saveMutation.isPending ? 'Saving...' : uploadingImages ? 'Uploading images...' : 'Save'}
        </button>
      </form>
      {id !== 'new' && item && (
        <div style={{ marginTop: '30px' }}>
          <h2>Images</h2>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleUploadImage(e.target.files[0], images.length === 0);
                }
              }}
              style={{ marginBottom: '10px' }}
            />
            {uploadImageMutation.isPending && <div>Uploading...</div>}
          </div>
          {images.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {images.map((img: any) => (
                <div key={img.id} style={{ border: '1px solid #ddd', padding: '10px' }}>
                  <img
                    src={img.url}
                    alt="Item"
                    style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                  />
                  {img.is_cover && (
                    <div style={{ marginTop: '8px', color: '#007bff', fontWeight: 'bold' }}>
                      Cover Image
                    </div>
                  )}
                  <button
                    onClick={() => {
                      // Set as cover image
                      apiClient.patch(`/items/${id}/images/${img.id}`, { is_cover: true });
                      queryClient.invalidateQueries({ queryKey: ['item', id] });
                    }}
                    disabled={img.is_cover}
                    style={{ marginTop: '8px', padding: '4px 8px' }}
                  >
                    Set as Cover
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p>No images uploaded yet.</p>
          )}
          <h2 style={{ marginTop: '30px' }}>Spinner</h2>
          <p>Spinner management coming soon...</p>
          <h2 style={{ marginTop: '30px' }}>Social Selling</h2>
          <button
            onClick={() => {
              const caption = `${item.name} - ${item.status === 'con_hang' ? 'Còn hàng' : item.status === 'giu_cho' ? 'Giữ chỗ' : 'Đã bán'}`;
              navigator.clipboard.writeText(caption);
              alert('Caption copied!');
            }}
          >
            Copy Caption
          </button>
          <button
            onClick={() => {
              const link = `${window.location.origin}/items/${id}`;
              navigator.clipboard.writeText(link);
              alert('Link copied!');
            }}
          >
            Copy Link
          </button>
        </div>
      )}
    </div>
  );
};
