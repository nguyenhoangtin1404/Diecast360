import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

export const ItemDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('con_hang');
  const [isPublic, setIsPublic] = useState(false);

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      if (id === 'new') {
        navigate('/admin/items');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      name,
      description,
      status,
      is_public: isPublic,
    });
  };

  if (isLoading && id !== 'new') return <div>Loading...</div>;

  const item = data?.data;

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
        <button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Saving...' : 'Save'}
        </button>
      </form>
      {id !== 'new' && item && (
        <div style={{ marginTop: '30px' }}>
          <h2>Images</h2>
          <p>Image management coming soon...</p>
          <h2>Spinner</h2>
          <p>Spinner management coming soon...</p>
          <h2>Social Selling</h2>
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

