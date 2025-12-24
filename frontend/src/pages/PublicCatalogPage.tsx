import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';

export const PublicCatalogPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-items', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '20',
      });
      if (search) params.append('q', search);
      const response = await apiClient.get(`/public/items?${params.toString()}`);
      return response.data;
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading catalog</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Diecast360 Catalog</h1>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ padding: '8px', width: '300px' }}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {data?.data?.items?.map((item: any) => (
          <Link
            key={item.id}
            to={`/items/${item.id}`}
            style={{
              textDecoration: 'none',
              color: 'inherit',
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '15px',
              display: 'block',
            }}
          >
            {item.cover_image_url && (
              <img
                src={item.cover_image_url}
                alt={item.name}
                style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }}
              />
            )}
            <h3 style={{ marginTop: '10px' }}>{item.name}</h3>
            <p style={{ color: '#666', fontSize: '14px' }}>
              {item.status === 'con_hang' ? 'Còn hàng' : item.status === 'giu_cho' ? 'Giữ chỗ' : 'Đã bán'}
            </p>
            {item.has_spinner && <span style={{ fontSize: '12px', color: '#007bff' }}>360° View</span>}
          </Link>
        ))}
      </div>
      {data?.data?.pagination && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span style={{ margin: '0 10px' }}>
            Page {page} of {data.data.pagination.total_pages}
          </span>
          <button
            disabled={page >= data.data.pagination.total_pages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

