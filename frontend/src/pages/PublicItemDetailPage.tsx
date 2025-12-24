import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Spinner360 } from '../components/Spinner360/Spinner360';

export const PublicItemDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-item', id],
    queryFn: async () => {
      const response = await apiClient.get(`/public/items/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Item not found</div>;

  const { item, images, spinner } = data?.data || {};

  if (!item) return <div>Item not found</div>;

  const hasSpinner = spinner && spinner.frames && spinner.frames.length > 0;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>{item.name}</h1>
      <p>{item.description}</p>
      <p>
        <strong>Status:</strong>{' '}
        {item.status === 'con_hang' ? 'Còn hàng' : item.status === 'giu_cho' ? 'Giữ chỗ' : 'Đã bán'}
      </p>
      {item.brand && <p><strong>Brand:</strong> {item.brand}</p>}
      {item.scale && <p><strong>Scale:</strong> {item.scale}</p>}

      <div style={{ marginTop: '30px' }}>
        {hasSpinner ? (
          <div>
            <h2>360° View</h2>
            <Spinner360
              frames={spinner.frames.map((f: any) => ({
                id: f.id,
                image_url: f.image_url,
                thumbnail_url: f.thumbnail_url,
                frame_index: f.frame_index,
              }))}
              autoplay={false}
              width={600}
              height={600}
            />
          </div>
        ) : (
          <div>
            <h2>Gallery</h2>
            {images && images.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                {images.map((img: any) => (
                  <img
                    key={img.id}
                    src={img.url}
                    alt={item.name}
                    style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                ))}
              </div>
            ) : (
              <p>No images available</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

