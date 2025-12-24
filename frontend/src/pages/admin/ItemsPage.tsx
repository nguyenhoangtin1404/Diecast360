import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Link } from 'react-router-dom';

export const ItemsPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['items', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '20',
      });
      if (search) params.append('q', search);
      const response = await apiClient.get(`/items?${params.toString()}`);
      return response.data;
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading items</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Items Management</h1>
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
        <Link to="/admin/items/new" style={{ marginLeft: '10px', padding: '8px', background: '#007bff', color: 'white', textDecoration: 'none' }}>
          New Item
        </Link>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Name</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Status</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Public</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data?.data?.items?.map((item: any) => (
            <tr key={item.id}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.name}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.status}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.is_public ? 'Yes' : 'No'}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                <Link to={`/admin/items/${item.id}`}>Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data?.data?.pagination && (
        <div style={{ marginTop: '20px' }}>
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

