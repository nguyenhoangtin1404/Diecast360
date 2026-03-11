// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CatalogFilters } from '../../src/components/catalog/CatalogFilters';

const useQueryMock = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: unknown) => useQueryMock(options),
}));

vi.mock('../../src/api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('CatalogFilters', () => {
  afterEach(() => {
    cleanup();
    useQueryMock.mockReset();
  });

  it('should render loading and error states', () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: true,
    });

    render(
      <CatalogFilters
        carBrand={null}
        modelBrand={null}
        condition={null}
        onCarBrandChange={vi.fn()}
        onModelBrandChange={vi.fn()}
        onConditionChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Đang tải bộ lọc...')).toBeTruthy();
    expect(screen.getByText('Không thể tải bộ lọc lúc này.')).toBeTruthy();
  });

  it('should render brands by type and trigger callbacks on selection/toggle', () => {
    const onCarBrandChange = vi.fn();
    const onModelBrandChange = vi.fn();
    const onConditionChange = vi.fn();

    useQueryMock.mockReturnValue({
      data: {
        categories: [
          { id: '2', name: 'BMW', type: 'car_brand', is_active: true },
          { id: '1', name: 'Audi', type: 'car_brand', is_active: true },
          { id: '3', name: 'Mini GT', type: 'model_brand', is_active: true },
          { id: '4', name: 'Tarmac', type: 'model_brand', is_active: true },
        ],
      },
      isLoading: false,
      isError: false,
    });

    render(
      <CatalogFilters
        carBrand={null}
        modelBrand={null}
        condition={null}
        onCarBrandChange={onCarBrandChange}
        onModelBrandChange={onModelBrandChange}
        onConditionChange={onConditionChange}
      />,
    );

    expect(useQueryMock).toHaveBeenCalledTimes(1);
    expect((useQueryMock.mock.calls[0][0] as { queryKey: unknown[] }).queryKey).toEqual([
      'catalog-filters',
      'all',
    ]);

    const audiButton = screen.getByRole('button', { name: 'Audi' });
    const bmwButton = screen.getByRole('button', { name: 'BMW' });
    const miniGtButton = screen.getByRole('button', { name: 'Mini GT' });
    const tarmacButton = screen.getByRole('button', { name: 'Tarmac' });

    expect(audiButton.compareDocumentPosition(bmwButton)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(miniGtButton.compareDocumentPosition(tarmacButton)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    fireEvent.click(audiButton);
    fireEvent.click(miniGtButton);
    fireEvent.click(screen.getByRole('button', { name: 'Mới' }));

    expect(onCarBrandChange).toHaveBeenCalledWith('Audi');
    expect(onModelBrandChange).toHaveBeenCalledWith('Mini GT');
    expect(onConditionChange).toHaveBeenCalledWith('new');
  });

  it('should clear selected values when clicking selected chips', () => {
    const onCarBrandChange = vi.fn();
    const onModelBrandChange = vi.fn();
    const onConditionChange = vi.fn();

    useQueryMock.mockReturnValue({
      data: {
        categories: [
          { id: '1', name: 'Audi', type: 'car_brand', is_active: true },
          { id: '3', name: 'Mini GT', type: 'model_brand', is_active: true },
        ],
      },
      isLoading: false,
      isError: false,
    });

    render(
      <CatalogFilters
        carBrand="Audi"
        modelBrand="Mini GT"
        condition="old"
        onCarBrandChange={onCarBrandChange}
        onModelBrandChange={onModelBrandChange}
        onConditionChange={onConditionChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Audi' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mini GT' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cũ' }));

    expect(onCarBrandChange).toHaveBeenCalledWith(null);
    expect(onModelBrandChange).toHaveBeenCalledWith(null);
    expect(onConditionChange).toHaveBeenCalledWith(null);
  });
});
