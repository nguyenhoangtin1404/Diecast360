import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import axios from 'axios';
import { ArrowLeft, Box, Edit, Plus, Check } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

// Helper functions for number formatting
const formatNumber = (value: string): string => {
  if (!value || value === '') return '';
  // Remove all commas and spaces
  const cleaned = value.replace(/,/g, '').replace(/\s/g, '');
  if (!cleaned) return '';
  const num = parseFloat(cleaned);
  if (isNaN(num)) return '';
  // Format with comma as thousand separator
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const parseNumber = (value: string): string => {
  // Remove all commas and spaces, keep decimal point
  return value.replace(/,/g, '').replace(/\s/g, '');
};

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
  const [originalPrice, setOriginalPrice] = useState<string>('');
  const [scale, setScale] = useState<string>('1:64');
  const [brand, setBrand] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['item', id],
    queryFn: async () => {
      const response = await apiClient.get(`/items/${id}`);
      // Response structure: {ok: true, data: {item: {...}, images: [...], spin_sets: [...]}, message: ''}
      // apiClient interceptor returns response.data, so response = {ok: true, data: {...}, message: ''}
      // We need to return response.data which is {item: {...}, images: [...], spin_sets: [...]}
      return response.data || response;
    },
    enabled: !!id && id !== 'new',
  });

  // Load data into form when data changes
  useEffect(() => {
    // data structure: {item: {...}, images: [...], spin_sets: [...]}
    if (data?.item) {
      const item = data.item;
      setName(item.name || '');
      setDescription(item.description || '');
      setStatus(item.status || 'con_hang');
      setIsPublic(item.is_public || false);
      setCarBrand(item.car_brand || '');
      setModelBrand(item.model_brand || '');
      setCondition(item.condition || '');
      setPrice(item.price ? item.price.toString() : '');
      setOriginalPrice(item.original_price ? item.original_price.toString() : '');
      setScale(item.scale || '1:64');
      setBrand(item.brand || '');
    }
  }, [data]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          // Ignore errors when revoking URLs
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const itemId = id === 'new' ? (response.data?.item?.id || response?.item?.id) : id;
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
          // Clean up preview URLs
          imagePreviewUrls.forEach(url => {
            try {
              URL.revokeObjectURL(url);
            } catch (e) {
              // Ignore errors
            }
          });
          setImagePreviewUrls([]);
        } catch (error) {
          console.error('Error uploading images:', error);
          alert('Có lỗi khi upload ảnh. Vui lòng thử lại.');
        } finally {
          setUploadingImages(false);
        }
      }
      
      // Show success notification
      const notification = document.createElement('div');
      notification.textContent = id === 'new' ? 'Đã tạo sản phẩm thành công!' : 'Đã cập nhật sản phẩm thành công!';
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease-out;
      `;
      
      const checkIcon = document.createElement('span');
      checkIcon.textContent = '✓';
      checkIcon.style.cssText = `
        font-size: 18px;
        font-weight: bold;
      `;
      notification.appendChild(checkIcon);
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }, 3000);
      
      if (id === 'new') {
        setTimeout(() => {
          navigate(`/admin/items/${itemId}`);
        }, 500);
      }
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
    if (scale) itemData.scale = scale;
    if (brand) itemData.brand = brand;
    if (price) {
      const priceNum = parseFloat(price);
      if (!isNaN(priceNum) && priceNum >= 0) {
        itemData.price = priceNum;
      }
    }
    if (originalPrice) {
      const originalPriceNum = parseFloat(originalPrice);
      if (!isNaN(originalPriceNum) && originalPriceNum >= 0) {
        itemData.original_price = originalPriceNum;
      }
    }
    
    saveMutation.mutate(itemData);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Clean up old preview URLs
      imagePreviewUrls.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          // Ignore errors
        }
      });
      
      setSelectedFiles(files);
      
      // Create new preview URLs
      const previews = files.map(file => URL.createObjectURL(file));
      setImagePreviewUrls(previews);
    }
  };

  const handleUploadImage = async (file: File, isCover: boolean = false): Promise<void> => {
    if (!id || id === 'new') return;
    
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('is_cover', isCover ? 'true' : 'false');
    
    try {
      await axios.post(`${API_BASE_URL}/items/${id}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      queryClient.invalidateQueries({ queryKey: ['item', id] });
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  if (isLoading && id !== 'new') return <div style={{ padding: '20px' }}>Đang tải...</div>;

  const item = data?.item;
  const images = data?.images || [];

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <button
            onClick={() => navigate('/admin/items')}
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              background: 'white',
              color: '#333',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f5f5f5';
              e.currentTarget.style.borderColor = '#007bff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = '#ddd';
            }}
          >
            <ArrowLeft size={18} />
            <span>Quay lại danh sách</span>
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            }}
          >
            {id === 'new' ? <Plus size={24} color="white" /> : <Edit size={24} color="white" />}
          </div>
          <div>
            <h1 style={{ 
              margin: 0, 
              fontSize: '28px', 
              fontWeight: '700', 
              color: '#1a1a1a',
              letterSpacing: '-0.5px',
              lineHeight: '1.2',
            }}>
              {id === 'new' ? 'Tạo sản phẩm mới' : 'Chỉnh sửa sản phẩm'}
            </h1>
            <p style={{ 
              margin: '4px 0 0 0', 
              fontSize: '14px', 
              color: '#666',
              fontWeight: '400',
            }}>
              {id === 'new' ? 'Thêm sản phẩm mới vào kho' : `Chỉnh sửa thông tin sản phẩm: ${item?.name || ''}`}
            </p>
          </div>
        </div>
      </div>
      <form onSubmit={handleSubmit} style={{ maxWidth: '800px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
            Tên sản phẩm <span style={{ color: '#dc3545' }}>*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ 
              width: '100%', 
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s',
              color: '#1a1a1a',
              backgroundColor: '#fff',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#007bff';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#ddd';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
            Mô tả
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '10px 12px', 
              minHeight: '100px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s',
              resize: 'vertical',
              fontFamily: 'inherit',
              color: '#1a1a1a',
              backgroundColor: '#fff',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#007bff';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#ddd';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
              Hãng xe
            </label>
            <select
            value={carBrand}
            onChange={(e) => setCarBrand(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s',
                color: '#1a1a1a',
                backgroundColor: '#fff',
                cursor: 'pointer',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#007bff';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#ddd';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <option value="">-- Chọn hãng xe --</option>
              <option value="Abarth">Abarth</option>
              <option value="Acura">Acura</option>
              <option value="Alfa Romeo">Alfa Romeo</option>
              <option value="Aston Martin">Aston Martin</option>
              <option value="Audi">Audi</option>
              <option value="Bentley">Bentley</option>
              <option value="BMW">BMW</option>
              <option value="Bugatti">Bugatti</option>
              <option value="Cadillac">Cadillac</option>
              <option value="Chevrolet">Chevrolet</option>
              <option value="Ducati">Ducati</option>
              <option value="Ford">Ford</option>
              <option value="HKS">HKS</option>
              <option value="Honda">Honda</option>
              <option value="Hyundai">Hyundai</option>
              <option value="Isuzu">Isuzu</option>
              <option value="Jaguar">Jaguar</option>
              <option value="Lamborghini">Lamborghini</option>
              <option value="Lancia">Lancia</option>
              <option value="Land Rover">Land Rover</option>
              <option value="LB Works">LB Works</option>
              <option value="Lincoln">Lincoln</option>
              <option value="Lotus">Lotus</option>
              <option value="Mazda">Mazda</option>
              <option value="McLaren">McLaren</option>
              <option value="Mercedes-Benz">Mercedes-Benz</option>
              <option value="Nissan">Nissan</option>
              <option value="Pagani">Pagani</option>
              <option value="Pandem">Pandem</option>
              <option value="Porsche">Porsche</option>
              <option value="Range Rover">Range Rover</option>
              <option value="Red Bull Racing">Red Bull Racing</option>
              <option value="RUF">RUF</option>
              <option value="Shelby">Shelby</option>
              <option value="SUBARU">SUBARU</option>
              <option value="Tommykaira">Tommykaira</option>
              <option value="Top Secret">Top Secret</option>
              <option value="Toyota">Toyota</option>
              <option value="VeilSide">VeilSide</option>
              <option value="Volkswagen">Volkswagen</option>
            </select>
        </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
              Hãng mô hình
            </label>
            <select
            value={modelBrand}
            onChange={(e) => setModelBrand(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s',
                color: '#1a1a1a',
                backgroundColor: '#fff',
                cursor: 'pointer',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#007bff';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#ddd';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <option value="">-- Chọn hãng mô hình --</option>
              <option value="Mini GT">Mini GT</option>
              <option value="Tarmac Works">Tarmac Works</option>
              <option value="Hot Wheels">Hot Wheels</option>
              <option value="Inno64">Inno64</option>
              <option value="Pop Race">Pop Race</option>
              <option value="Tomica">Tomica</option>
              <option value="Majorette">Majorette</option>
              <option value="OTHER BRAND">Hãng khác</option>
            </select>
        </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
              Tỷ lệ
            </label>
          <input
            type="text"
            value={scale}
            onChange={(e) => setScale(e.target.value)}
            placeholder="1:64"
              style={{ 
                width: '100%', 
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s',
                color: '#1a1a1a',
                backgroundColor: '#fff',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#007bff';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#ddd';
                e.currentTarget.style.boxShadow = 'none';
              }}
          />
        </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
              Thương hiệu
            </label>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s',
                color: '#1a1a1a',
                backgroundColor: '#fff',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#007bff';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#ddd';
                e.currentTarget.style.boxShadow = 'none';
              }}
          />
        </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
              Giá gốc
            </label>
          <input
              type="text"
              value={originalPrice ? formatNumber(originalPrice) : ''}
              onChange={(e) => {
                const inputValue = e.target.value;
                const parsed = parseNumber(inputValue);
                // Allow empty, numbers, and decimal point
                if (parsed === '' || /^\d*\.?\d*$/.test(parsed)) {
                  setOriginalPrice(parsed);
                }
              }}
              style={{ 
                width: '100%', 
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s',
                color: '#1a1a1a',
                backgroundColor: '#fff',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#007bff';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#ddd';
                e.currentTarget.style.boxShadow = 'none';
                const parsed = parseNumber(e.target.value);
                if (parsed === '' || (!isNaN(parseFloat(parsed)) && parseFloat(parsed) >= 0)) {
                  setOriginalPrice(parsed);
                }
              }}
          />
        </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
              Giá bán
            </label>
          <input
              type="text"
              value={price ? formatNumber(price) : ''}
              onChange={(e) => {
                const inputValue = e.target.value;
                const parsed = parseNumber(inputValue);
                // Allow empty, numbers, and decimal point
                if (parsed === '' || /^\d*\.?\d*$/.test(parsed)) {
                  setPrice(parsed);
                }
              }}
              style={{ 
                width: '100%', 
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s',
                color: '#1a1a1a',
                backgroundColor: '#fff',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#007bff';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#ddd';
                e.currentTarget.style.boxShadow = 'none';
                const parsed = parseNumber(e.target.value);
                if (parsed === '' || (!isNaN(parseFloat(parsed)) && parseFloat(parsed) >= 0)) {
                  setPrice(parsed);
                }
              }}
          />
        </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
              Tình trạng
            </label>
            <div style={{ 
              display: 'inline-flex', 
              backgroundColor: '#f5f5f5',
              borderRadius: '10px',
              padding: '4px',
              gap: '4px',
              border: '1px solid #e0e0e0',
            }}>
              <label 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: condition === 'new' ? '#fff' : '#666',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  backgroundColor: condition === 'new' ? '#007bff' : 'transparent',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  minWidth: '80px',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  if (condition !== 'new') {
                    e.currentTarget.style.backgroundColor = '#e8f0fe';
                    e.currentTarget.style.color = '#007bff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (condition !== 'new') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#666';
                  }
                }}
              >
            <input
                  type="radio"
                  name="condition"
                  value="new"
                  checked={condition === 'new'}
                  onChange={(e) => setCondition(e.target.value)}
                  style={{
                    position: 'absolute',
                    opacity: 0,
                    width: 0,
                    height: 0,
                  }}
                />
                <span>Mới</span>
              </label>
              <label 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: condition === 'old' ? '#fff' : '#666',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  backgroundColor: condition === 'old' ? '#007bff' : 'transparent',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  minWidth: '80px',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  if (condition !== 'old') {
                    e.currentTarget.style.backgroundColor = '#e8f0fe';
                    e.currentTarget.style.color = '#007bff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (condition !== 'old') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#666';
                  }
                }}
              >
                <input
                  type="radio"
                  name="condition"
                  value="old"
                  checked={condition === 'old'}
                  onChange={(e) => setCondition(e.target.value)}
                  style={{
                    position: 'absolute',
                    opacity: 0,
                    width: 0,
                    height: 0,
                  }}
                />
                <span>Cũ</span>
          </label>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
              Công khai
            </label>
            <div style={{ 
              display: 'inline-flex', 
              backgroundColor: '#f5f5f5',
              borderRadius: '10px',
              padding: '4px',
              gap: '4px',
              border: '1px solid #e0e0e0',
            }}>
              <label 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: isPublic ? '#fff' : '#666',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  backgroundColor: isPublic ? '#007bff' : 'transparent',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  minWidth: '80px',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isPublic) {
                    e.currentTarget.style.backgroundColor = '#e8f0fe';
                    e.currentTarget.style.color = '#007bff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isPublic) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#666';
                  }
                }}
                onClick={() => setIsPublic(true)}
              >
                <span>Công khai</span>
              </label>
              <label 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: !isPublic ? '#fff' : '#666',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  backgroundColor: !isPublic ? '#007bff' : 'transparent',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  minWidth: '80px',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  if (isPublic) {
                    e.currentTarget.style.backgroundColor = '#e8f0fe';
                    e.currentTarget.style.color = '#007bff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isPublic) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#666';
                  }
                }}
                onClick={() => setIsPublic(false)}
              >
                <span>Riêng tư</span>
              </label>
            </div>
          </div>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
            Trạng thái
          </label>
          <div style={{ 
            display: 'inline-flex', 
            backgroundColor: '#f5f5f5',
            borderRadius: '10px',
            padding: '4px',
            gap: '4px',
            border: '1px solid #e0e0e0',
          }}>
            <label 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: status === 'con_hang' ? '#fff' : '#666',
                padding: '10px 16px',
                borderRadius: '8px',
                backgroundColor: status === 'con_hang' ? '#007bff' : 'transparent',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                minWidth: '70px',
                userSelect: 'none',
              }}
              onMouseEnter={(e) => {
                if (status !== 'con_hang') {
                  e.currentTarget.style.backgroundColor = '#e8f0fe';
                  e.currentTarget.style.color = '#007bff';
                }
              }}
              onMouseLeave={(e) => {
                if (status !== 'con_hang') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#666';
                }
              }}
              onClick={() => setStatus('con_hang')}
            >
              <span>Còn hàng</span>
            </label>
            <label 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: status === 'giu_cho' ? '#fff' : '#666',
                padding: '10px 16px',
                borderRadius: '8px',
                backgroundColor: status === 'giu_cho' ? '#007bff' : 'transparent',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                minWidth: '70px',
                userSelect: 'none',
              }}
              onMouseEnter={(e) => {
                if (status !== 'giu_cho') {
                  e.currentTarget.style.backgroundColor = '#e8f0fe';
                  e.currentTarget.style.color = '#007bff';
                }
              }}
              onMouseLeave={(e) => {
                if (status !== 'giu_cho') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#666';
                }
              }}
              onClick={() => setStatus('giu_cho')}
            >
              <span>Giữ chỗ</span>
            </label>
            <label 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: status === 'da_ban' ? '#fff' : '#666',
                padding: '10px 16px',
                borderRadius: '8px',
                backgroundColor: status === 'da_ban' ? '#007bff' : 'transparent',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                minWidth: '70px',
                userSelect: 'none',
              }}
              onMouseEnter={(e) => {
                if (status !== 'da_ban') {
                  e.currentTarget.style.backgroundColor = '#e8f0fe';
                  e.currentTarget.style.color = '#007bff';
                }
              }}
              onMouseLeave={(e) => {
                if (status !== 'da_ban') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#666';
                }
              }}
              onClick={() => setStatus('da_ban')}
            >
              <span>Đã bán</span>
            </label>
          </div>
        </div>
        {id === 'new' && (
          <div style={{ marginBottom: '10px' }}>
            <label>Tải lên hình ảnh:</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              style={{ 
                width: '100%', 
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s',
                color: '#1a1a1a',
                backgroundColor: '#fff',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#007bff';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#ddd';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {selectedFiles.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ color: '#666', marginBottom: '8px' }}>
                  Đã chọn {selectedFiles.length} ảnh
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginTop: '10px' }}>
                  {imagePreviewUrls.map((url, index) => (
                    <div key={index} style={{ border: '1px solid #ddd', padding: '5px', borderRadius: '4px' }}>
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                      <div style={{ marginTop: '5px', fontSize: '12px', textAlign: 'center' }}>
                        {selectedFiles[index]?.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <button 
          type="submit" 
          disabled={saveMutation.isPending || uploadingImages}
          style={{
            padding: '12px 24px',
            background: saveMutation.isPending || uploadingImages ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: saveMutation.isPending || uploadingImages ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(0, 123, 255, 0.2)',
            minWidth: '120px',
          }}
          onMouseEnter={(e) => {
            if (!saveMutation.isPending && !uploadingImages) {
              e.currentTarget.style.background = '#0056b3';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 123, 255, 0.3)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!saveMutation.isPending && !uploadingImages) {
              e.currentTarget.style.background = '#007bff';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 123, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          {saveMutation.isPending ? 'Đang lưu...' : uploadingImages ? 'Đang upload ảnh...' : 'Lưu'}
        </button>
      </form>
      {id !== 'new' && item && (
        <div style={{ marginTop: '40px', maxWidth: '800px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600', 
            color: '#1a1a1a',
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: '2px solid #f0f0f0',
          }}>Hình ảnh</h2>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="file"
              multiple
              accept="image/*"
              style={{ 
                width: '100%', 
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s',
                color: '#1a1a1a',
                backgroundColor: '#fff',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#007bff';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#ddd';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onChange={async (e) => {
                if (e.target.files && e.target.files.length > 0) {
                  const files = Array.from(e.target.files);
                  setUploadingImages(true);
                  try {
                    for (let i = 0; i < files.length; i++) {
                      const file = files[i];
                      await handleUploadImage(file, images.length === 0 && i === 0);
                    }
                  } catch (error) {
                    console.error('Error uploading images:', error);
                    alert('Có lỗi khi upload ảnh');
                  } finally {
                    setUploadingImages(false);
                    // Reset input
                    e.target.value = '';
                  }
                }
              }}
              disabled={uploadingImages}
              style={{ display: 'none' }}
            />
            {uploadingImages && (
              <div style={{ 
                marginTop: '12px', 
                padding: '12px',
                background: '#f0f7ff',
                borderRadius: '8px',
                color: '#007bff',
                fontSize: '14px',
              }}>
                Đang upload ảnh, vui lòng đợi...
              </div>
            )}
          </div>
          {images.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
              {images.map((img: any) => (
                <div key={img.id} style={{ border: img.is_cover ? '2px solid #007bff' : '1px solid #ddd', padding: '10px', borderRadius: '8px', backgroundColor: '#fff' }}>
                  <div style={{ position: 'relative' }}>
                    <img
                      src={img.thumbnail_url || img.url}
                      alt="Item"
                      style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }}
                      onError={(e) => {
                        // Fallback to full image if thumbnail fails
                        const target = e.target as HTMLImageElement;
                        if (target.src !== img.url) {
                          target.src = img.url;
                        }
                      }}
                    />
                    {img.is_cover && (
                      <div style={{ 
                        position: 'absolute', 
                        top: '8px', 
                        right: '8px', 
                        backgroundColor: '#007bff', 
                        color: 'white', 
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        Ảnh đại diện
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                    Thứ tự: {img.display_order + 1}
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={async () => {
                        try {
                          await apiClient.patch(`/items/${id}/images/${img.id}`, { is_cover: true });
                          queryClient.invalidateQueries({ queryKey: ['item', id] });
                        } catch (error) {
                          console.error('Error setting cover image:', error);
                          alert('Có lỗi khi đặt ảnh đại diện');
                        }
                      }}
                      disabled={img.is_cover}
                      style={{ 
                        padding: '6px 12px', 
                        cursor: img.is_cover ? 'not-allowed' : 'pointer',
                        backgroundColor: img.is_cover ? '#ccc' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        flex: 1
                      }}
                    >
                      {img.is_cover ? 'Đã là ảnh đại diện' : 'Đặt làm ảnh đại diện'}
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm('Bạn có chắc muốn xóa ảnh này?')) {
                          try {
                            await apiClient.delete(`/items/${id}/images/${img.id}`);
                            queryClient.invalidateQueries({ queryKey: ['item', id] });
                          } catch (error) {
                            console.error('Error deleting image:', error);
                            alert('Có lỗi khi xóa ảnh');
                          }
                        }
                      }}
                      style={{ 
                        padding: '6px 12px', 
                        backgroundColor: '#dc3545', 
                        color: 'white', 
                        border: 'none', 
                        cursor: 'pointer',
                        borderRadius: '4px',
                        fontSize: '12px',
                        flex: 1
                      }}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666', border: '1px dashed #ddd', borderRadius: '8px' }}>
              <p>Chưa có ảnh nào được upload.</p>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>Sử dụng nút bên trên để upload ảnh cho sản phẩm.</p>
            </div>
          )}
          <h2 style={{ 
            marginTop: '40px', 
            fontSize: '24px', 
            fontWeight: '600', 
            color: '#1a1a1a',
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: '2px solid #f0f0f0',
          }}>Spinner 360°</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>Quản lý spinner 360° sẽ được thêm vào sau...</p>
          <h2 style={{ 
            marginTop: '40px', 
            fontSize: '24px', 
            fontWeight: '600', 
            color: '#1a1a1a',
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: '2px solid #f0f0f0',
          }}>Social Selling</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
              onClick={async () => {
                try {
              const caption = `${item.name} - ${item.status === 'con_hang' ? 'Còn hàng' : item.status === 'giu_cho' ? 'Giữ chỗ' : 'Đã bán'}`;
                  await navigator.clipboard.writeText(caption);
                  
                  const notification = document.createElement('div');
                  notification.textContent = 'Đã copy caption!';
                  notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #28a745;
                    color: white;
                    padding: 12px 20px;
                    borderRadius: 8px;
                    boxShadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    zIndex: 10000;
                    fontSize: 14px;
                    fontWeight: 500;
                    animation: slideIn 0.3s ease-out;
                  `;
                  document.body.appendChild(notification);
                  setTimeout(() => {
                    notification.style.animation = 'slideOut 0.3s ease-out';
                    setTimeout(() => document.body.removeChild(notification), 300);
                  }, 2000);
                } catch (error) {
                  alert('Không thể copy. Vui lòng thử lại.');
                }
              }}
              style={{
                padding: '10px 20px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(0, 123, 255, 0.2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#0056b3';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 123, 255, 0.3)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#007bff';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 123, 255, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Copy Caption
          </button>
          <button
              onClick={async () => {
                try {
              const link = `${window.location.origin}/items/${id}`;
                  await navigator.clipboard.writeText(link);
                  
                  const notification = document.createElement('div');
                  notification.textContent = 'Đã copy link!';
                  notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #28a745;
                    color: white;
                    padding: 12px 20px;
                    borderRadius: 8px;
                    boxShadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    zIndex: 10000;
                    fontSize: 14px;
                    fontWeight: 500;
                    animation: slideIn 0.3s ease-out;
                  `;
                  document.body.appendChild(notification);
                  setTimeout(() => {
                    notification.style.animation = 'slideOut 0.3s ease-out';
                    setTimeout(() => document.body.removeChild(notification), 300);
                  }, 2000);
                } catch (error) {
                  alert('Không thể copy. Vui lòng thử lại.');
                }
              }}
              style={{
                padding: '10px 20px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(40, 167, 69, 0.2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#218838';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(40, 167, 69, 0.3)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#28a745';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(40, 167, 69, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Copy Link
          </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
};
