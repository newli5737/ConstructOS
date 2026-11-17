import { useState, useEffect, useCallback } from 'react';
import { catalogService, CreateProductDto } from '../services/catalog.service';
import { Product, ProductCategory, PriceList } from '../types';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchCatalog = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (search) params.q = search;
      if (selectedCatId) params.categoryId = selectedCatId;

      const [pRes, cRes, plRes] = await Promise.all([
        catalogService.getProducts(params),
        catalogService.getCategories(),
        catalogService.getPriceLists(),
      ]);

      setProducts(pRes);
      setCategories(cRes);
      setPriceLists(plRes);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi tải danh mục sản phẩm');
    } finally {
      setLoading(false);
    }
  }, [search, selectedCatId]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const createProduct = useCallback(
    async (dto: CreateProductDto) => {
      const created = await catalogService.createProduct(dto);
      await fetchCatalog();
      return created;
    },
    [fetchCatalog],
  );

  const updateProduct = useCallback(
    async (id: string, dto: Partial<CreateProductDto>) => {
      const updated = await catalogService.updateProduct(id, dto);
      await fetchCatalog();
      return updated;
    },
    [fetchCatalog],
  );

  return {
    products,
    categories,
    priceLists,
    loading,
    error,
    search,
    setSearch,
    selectedCatId,
    setSelectedCatId,
    viewMode,
    setViewMode,
    refetch: fetchCatalog,
    createProduct,
    updateProduct,
  };
};

