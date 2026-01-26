import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Spinner360 } from '../components/Spinner360/Spinner360';
import { ArrowLeft, X, ChevronLeft, ChevronRight } from 'lucide-react';

export const PublicItemDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-item', id],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/public/items/${id}`);
        // apiClient interceptor returns response.data, so response = {ok: true, data: {item, images, spinner}, message: ''}
        // We need to return response.data which is {item, images, spinner}
        const result = response.data || response;
        console.log('[PublicItemDetailPage] Response:', result);
        return result;
      } catch (err) {
        console.error('[PublicItemDetailPage] Error fetching item:', err);
        throw err;
      }
    },
    enabled: !!id,
  });

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center' }}>Đang tải...</div>;
  if (error) {
    console.error('Error loading item:', error);
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Không tìm thấy sản phẩm</h2>
        <p style={{ color: '#666', marginTop: '8px' }}>
          Sản phẩm không tồn tại hoặc không được công khai.
        </p>
      </div>
    );
  }

  // Response structure: {item, images, spinner} (already unwrapped by apiClient)
  const { item, images, spinner } = data || {};

  if (!item) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Không tìm thấy sản phẩm</h2>
        <p style={{ color: '#666', marginTop: '8px' }}>
          Sản phẩm không tồn tại hoặc không được công khai.
        </p>
      </div>
    );
  }

  const hasSpinner = spinner && spinner.frames && spinner.frames.length > 0;

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen || !images || images.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxOpen(false);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev + 1) % images.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, images]);

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Back Button */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '10px 20px',
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
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f5f5f5';
            e.currentTarget.style.borderColor = '#007bff';
            e.currentTarget.style.transform = 'translateX(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.borderColor = '#ddd';
            e.currentTarget.style.transform = 'translateX(0)';
          }}
        >
          <ArrowLeft size={18} />
          <span>Quay lại</span>
        </button>
      </div>

      {/* Header Section */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ 
          fontSize: '36px', 
          fontWeight: '700', 
          color: '#1a1a1a', 
          margin: '0 0 16px 0',
          lineHeight: '1.2',
          letterSpacing: '-0.5px',
        }}>
          {item.name}
        </h1>
        
        {item.description && (
          <p style={{ 
            fontSize: '18px', 
            color: '#666', 
            lineHeight: '1.8',
            margin: '0 0 32px 0',
          }}>
            {item.description}
          </p>
        )}
      </div>

      {/* Main Content Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '40px',
        marginBottom: '40px',
      }}>
        {/* Left Column - Product Info */}
        <div>
          <div style={{
            backgroundColor: '#fff',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            marginBottom: '24px',
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1a1a1a',
              margin: '0 0 20px 0',
              paddingBottom: '12px',
              borderBottom: '2px solid #f0f0f0',
            }}>
              Thông tin sản phẩm
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '15px', color: '#666', fontWeight: '500' }}>Trạng thái:</span>
                <span style={{
                  padding: '6px 12px',
                  backgroundColor: item.status === 'con_hang' ? '#d4edda' : item.status === 'giu_cho' ? '#fff3cd' : '#f8d7da',
                  color: item.status === 'con_hang' ? '#155724' : item.status === 'giu_cho' ? '#856404' : '#721c24',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                }}>
                  {item.status === 'con_hang' ? 'Còn hàng' : item.status === 'giu_cho' ? 'Giữ chỗ' : 'Đã bán'}
                </span>
              </div>

              {/* Car Brand */}
              {item.car_brand && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '15px', color: '#666', fontWeight: '500' }}>Hãng xe:</span>
                  <span style={{ fontSize: '15px', color: '#1a1a1a', fontWeight: '600' }}>{item.car_brand}</span>
                </div>
              )}

              {/* Model Brand */}
              {item.model_brand && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '15px', color: '#666', fontWeight: '500' }}>Hãng mô hình:</span>
                  <span style={{ fontSize: '15px', color: '#1a1a1a', fontWeight: '600' }}>{item.model_brand}</span>
                </div>
              )}

              {/* Condition */}
              {item.condition && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '15px', color: '#666', fontWeight: '500' }}>Tình trạng:</span>
                  <span style={{
                    padding: '6px 12px',
                    backgroundColor: item.condition === 'new' ? '#e7f3ff' : '#fff4e6',
                    color: item.condition === 'new' ? '#0066cc' : '#cc6600',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}>
                    {item.condition === 'new' ? 'Mới' : 'Cũ'}
                  </span>
                </div>
              )}

              {/* Scale */}
              {item.scale && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '15px', color: '#666', fontWeight: '500' }}>Tỷ lệ:</span>
                  <span style={{ fontSize: '15px', color: '#1a1a1a', fontWeight: '600' }}>{item.scale}</span>
                </div>
              )}

              {/* Brand */}
              {item.brand && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '15px', color: '#666', fontWeight: '500' }}>Thương hiệu:</span>
                  <span style={{ fontSize: '15px', color: '#1a1a1a', fontWeight: '600' }}>{item.brand}</span>
                </div>
              )}
            </div>
          </div>

          {/* Price Section */}
          {(item.price || item.original_price) && (
            <div style={{
              backgroundColor: '#fff',
              padding: '24px',
              borderRadius: '16px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1a1a1a',
                margin: '0 0 20px 0',
                paddingBottom: '12px',
                borderBottom: '2px solid #f0f0f0',
              }}>
                Giá
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {item.original_price && (
                  <div>
                    <div style={{ fontSize: '14px', color: '#999', marginBottom: '4px' }}>Giá gốc:</div>
                    <div style={{ 
                      fontSize: '20px', 
                      color: '#999', 
                      textDecoration: 'line-through',
                      fontWeight: '500',
                    }}>
                      {item.original_price.toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                )}
                {item.price && (
                  <div>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Giá bán:</div>
                    <div style={{ 
                      fontSize: '32px', 
                      color: '#007bff', 
                      fontWeight: '700',
                    }}>
                      {item.price.toLocaleString('vi-VN')} đ
                    </div>
                    {item.original_price && item.original_price > item.price && (
                      <div style={{
                        marginTop: '8px',
                        padding: '6px 12px',
                        backgroundColor: '#d4edda',
                        color: '#155724',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'inline-block',
                      }}>
                        Giảm {((1 - item.price / item.original_price) * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Images/Spinner */}
        <div>
          {hasSpinner ? (
            <div style={{
              backgroundColor: '#fff',
              padding: '24px',
              borderRadius: '16px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                marginBottom: '20px',
                color: '#1a1a1a',
                paddingBottom: '12px',
                borderBottom: '2px solid #f0f0f0',
              }}>
                360° View
              </h2>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center',
                padding: '20px',
                backgroundColor: '#f9f9f9',
                borderRadius: '12px',
              }}>
                <Spinner360
                  frames={spinner.frames.map((f: any) => ({
                    id: f.id,
                    image_url: f.image_url,
                    thumbnail_url: f.thumbnail_url ?? undefined,
                    frame_index: f.frame_index,
                  }))}
                  autoplay={false}
                  width={500}
                  height={500}
                />
              </div>
            </div>
          ) : images && images.length > 0 ? (
            <div style={{
              backgroundColor: '#fff',
              padding: '24px',
              borderRadius: '16px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                marginBottom: '20px',
                color: '#1a1a1a',
                paddingBottom: '12px',
                borderBottom: '2px solid #f0f0f0',
              }}>
                Hình ảnh
              </h2>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '12px' 
              }}>
                {images.slice(0, 4).map((img: any) => (
                  <div key={img.id} style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    aspectRatio: '1',
                  }}>
                    <img
                      src={img.url}
                      alt={item.name}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </div>
                ))}
              </div>
              {images.length > 4 && (
                <div style={{
                  marginTop: '12px',
                  textAlign: 'center',
                  fontSize: '14px',
                  color: '#666',
                }}>
                  +{images.length - 4} hình ảnh khác
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Full Gallery Section */}
      {images && images.length > 0 && (
        <div style={{ marginTop: '40px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600', 
            marginBottom: '24px',
            color: '#1a1a1a',
            paddingBottom: '12px',
            borderBottom: '2px solid #f0f0f0',
          }}>
            Thư viện hình ảnh
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
            gap: '16px' 
          }}>
            {images.map((img: any, index: number) => (
              <div 
                key={img.id} 
                style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  transition: 'transform 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                onClick={() => {
                  setLightboxIndex(index);
                  setLightboxOpen(true);
                }}
              >
                <img
                  src={img.url}
                  alt={item.name}
                  style={{ 
                    width: '100%', 
                    height: '250px', 
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && images && images.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(false);
            }}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              zIndex: 10001,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <X size={24} />
          </button>

          {/* Previous Button */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
              }}
              style={{
                position: 'absolute',
                left: '20px',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                zIndex: 10001,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Image */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              position: 'relative',
            }}
          >
            <img
              src={images[lightboxIndex]?.url}
              alt={`${item.name} - ${lightboxIndex + 1}`}
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: '8px',
              }}
            />
            {images.length > 1 && (
              <div style={{
                position: 'absolute',
                bottom: '-40px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
              }}>
                {lightboxIndex + 1} / {images.length}
              </div>
            )}
          </div>

          {/* Next Button */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) => (prev + 1) % images.length);
              }}
              style={{
                position: 'absolute',
                right: '20px',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                zIndex: 10001,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

