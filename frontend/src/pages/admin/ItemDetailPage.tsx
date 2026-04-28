import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, uploadFile } from '../../api/client';
import { ArrowLeft, Edit, Plus, X, Star, Sparkles } from 'lucide-react';
import { Spinner360 } from '../../components/Spinner360/Spinner360';
import { CategoryQuickManage } from '../../components/admin/CategoryQuickManage';
import { InventoryTimeline } from '../../components/admin/InventoryTimeline';
import type { CategoryItem, ApiResponse } from '../../types/category';
import { showToast } from '../../utils/toast';
import type { FacebookPost } from '../../types/item.types';
import { jumpToStepWithAutoSave, navigateStepWithAutoSave, type ProductStep } from './itemStepNavigation';
import { buildStepUrlAfterCreate, evaluateFinishDecision, shouldBlockEnterSubmit } from './itemWorkflow';
import { MAX_SPINNER_FRAMES } from '../../constants/spinner';
import { useIsMobile } from '../../hooks/useIsMobile';

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

const MAX_ITEM_ATTRIBUTE_KEYS = 50;
const MAX_ITEM_ATTRIBUTE_KEY_LENGTH = 50;
const RESERVED_ITEM_ATTRIBUTE_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

interface AttributeRow {
  id: string;
  key: string;
  value: string;
}

function newAttributeRowId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `attr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function attributeRowsFromApi(attributes: unknown): AttributeRow[] {
  if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) {
    return [{ id: newAttributeRowId(), key: '', value: '' }];
  }
  const entries = Object.entries(attributes as Record<string, unknown>);
  if (entries.length === 0) {
    return [{ id: newAttributeRowId(), key: '', value: '' }];
  }
  return entries.map(([k, v]) => ({
    id: newAttributeRowId(),
    key: k,
    value:
      v === null || v === undefined
        ? ''
        : typeof v === 'boolean' || typeof v === 'number'
          ? String(v)
          : String(v),
  }));
}

/** Integers only without ambiguous leading zeros (e.g. "0123" stays a string). Decimals stay strings. */
function parseAttributeInputValue(raw: string): string | number | boolean | null {
  const t = raw.trim();
  if (t === '') return null;
  const low = t.toLowerCase();
  if (low === 'true') return true;
  if (low === 'false') return false;
  if (/^-?(0|[1-9]\d*)$/.test(t)) return parseInt(t, 10);
  return t;
}

function buildAttributesPayload(
  rows: AttributeRow[],
): { ok: true; value: Record<string, string | number | boolean | null> } | { ok: false; message: string } {
  const out: Record<string, string | number | boolean | null> = {};
  const seen = new Set<string>();
  for (const row of rows) {
    const key = row.key.trim();
    if (!key) continue;
    if (key.length > MAX_ITEM_ATTRIBUTE_KEY_LENGTH) {
      return {
        ok: false,
        message: `Tên thuộc tính quá dài (tối đa ${MAX_ITEM_ATTRIBUTE_KEY_LENGTH} ký tự).`,
      };
    }
    if (key !== row.key) {
      return { ok: false, message: 'Tên thuộc tính không được có khoảng trắng đầu hoặc cuối.' };
    }
    if (RESERVED_ITEM_ATTRIBUTE_KEYS.has(key)) {
      return { ok: false, message: `Tên thuộc tính "${key}" không được phép.` };
    }
    if (seen.has(key)) {
      return { ok: false, message: `Trùng tên thuộc tính: ${key}` };
    }
    seen.add(key);
    out[key] = parseAttributeInputValue(row.value);
  }
  if (Object.keys(out).length > MAX_ITEM_ATTRIBUTE_KEYS) {
    return { ok: false, message: `Tối đa ${MAX_ITEM_ATTRIBUTE_KEYS} thuộc tính.` };
  }
  return { ok: true, value: out };
}

interface SpinFrame {
  id: string;
  spin_set_id: string;
  frame_index: number;
  image_url: string;
  thumbnail_url?: string | null;
  created_at: string;
}

interface ItemImage {
  id: string;
  item_id: string;
  url: string;
  thumbnail_url: string | null;
  is_cover: boolean;
  display_order: number;
  created_at: string;
}

interface SpinSet {
  id: string;
  item_id: string;
  label: string | null;
  is_default: boolean;
  frames: SpinFrame[];
  created_at: string;
  updated_at: string;
}

interface ItemData {
  name: string;
  description?: string;
  status?: 'con_hang' | 'giu_cho' | 'da_ban';
  is_public?: boolean;
  car_brand?: string;
  model_brand?: string;
  condition?: 'new' | 'old';
  scale?: string;
  brand?: string;
  price?: number;
  original_price?: number;
  quantity?: number;
  attributes?: Record<string, string | number | boolean | null>;
}

interface ItemResponse {
  item: {
    id: string;
    [key: string]: unknown;
  };
}

interface AiDescriptionResponse {
  short_description: string;
  long_description: string;
  bullet_specs: string[];
  meta_title: string;
  meta_description: string;
}

interface SavePayload {
  itemData: ItemData;
  silent?: boolean;
  navigateAfterCreate?: boolean;
}

const PRODUCT_STEPS: Array<{ id: ProductStep; title: string; shortTitle: string }> = [
  { id: 1, title: 'Thông tin cơ bản', shortTitle: 'Thông tin' },
  { id: 2, title: 'Hình ảnh', shortTitle: 'Hình ảnh' },
  { id: 3, title: 'Ảnh 360', shortTitle: 'Ảnh 360' },
  { id: 4, title: 'AI gen nội dung FB', shortTitle: 'AI FB' },
];


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
  const [condition, setCondition] = useState<'new' | 'old'>('new');
  const [price, setPrice] = useState<string>('');
  const [originalPrice, setOriginalPrice] = useState<string>('');
  const [scale, setScale] = useState<string>('1:64');
  const [brand, setBrand] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [attributeRows, setAttributeRows] = useState<AttributeRow[]>(() => [
    { id: newAttributeRowId(), key: '', value: '' },
  ]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [lastImageUploadFailed, setLastImageUploadFailed] = useState(false);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [selectedSpinSetId, setSelectedSpinSetId] = useState<string | null>(null);
  const [newSpinSetLabel, setNewSpinSetLabel] = useState('');
  const [newSpinSetIsDefault, setNewSpinSetIsDefault] = useState(false);
  const [showCreateSpinSet, setShowCreateSpinSet] = useState(false);
  const [uploadingFrames, setUploadingFrames] = useState(false);
  
  // AI Description states
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiDescription, setAiDescription] = useState<AiDescriptionResponse | null>(null);
  const [showAiPreview, setShowAiPreview] = useState(false);
  const [aiPreviewTab, setAiPreviewTab] = useState<'short' | 'long' | 'bullets' | 'seo'>('short');

  // FB Post AI states
  const [fbPostContent, setFbPostContent] = useState('');
  const [fbPostInstructions, setFbPostInstructions] = useState('');
  const [isGeneratingFbPost, setIsGeneratingFbPost] = useState(false);
  const [facebookPosts, setFacebookPosts] = useState<FacebookPost[]>([]);
  const [newFbLinkInput, setNewFbLinkInput] = useState('');
  const [isSavingFbLink, setIsSavingFbLink] = useState(false);
  const [isPublishingToFb, setIsPublishingToFb] = useState(false);
  const [publishFbMessage, setPublishFbMessage] = useState<string | null>(null);
  const socialSellingRef = useRef<HTMLDivElement>(null);
  const stepNavInFlightRef = useRef(false);
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState<ProductStep>(1);
  const isMobile = useIsMobile();

  const { data, isLoading } = useQuery({
    queryKey: ['item', id],
    queryFn: async () => {
      const response = await apiClient.get(`/items/${id}`);
      return response.data;
    },
    enabled: !!id && id !== 'new',
  });

  // Fetch ALL categories per type (popup needs all, dropdown filters active in-memory)
  const { data: carBrandsData } = useQuery({
    queryKey: ['categories', 'car_brand'],
    queryFn: async () => {
      const response = await apiClient.get('/categories?type=car_brand') as ApiResponse<{ categories: CategoryItem[] }>;
      return response.data;
    },
  });

  const { data: modelBrandsData } = useQuery({
    queryKey: ['categories', 'model_brand'],
    queryFn: async () => {
      const response = await apiClient.get('/categories?type=model_brand') as ApiResponse<{ categories: CategoryItem[] }>;
      return response.data;
    },
  });

  // Derive active-only lists for dropdowns (in-memory filter, no extra API call)
  const activeCarBrands = useMemo(
    () => (carBrandsData?.categories || []).filter(c => c.is_active),
    [carBrandsData]
  );
  const activeModelBrands = useMemo(
    () => (modelBrandsData?.categories || []).filter(c => c.is_active),
    [modelBrandsData]
  );

  // Load data into form when data changes
  useEffect(() => {
    // data structure: {item: {...}, images: [...], spin_sets: [...]}
    if (data?.item) {
      const item = data.item;
      /* eslint-disable react-hooks/set-state-in-effect -- initializing controlled form fields
         from server data; React 18 batches all these calls into a single re-render. */
      setName(item.name || '');
      setDescription(item.description || '');
      setStatus(item.status || 'con_hang');
      setIsPublic(item.is_public || false);
      setCarBrand(item.car_brand || '');
      setModelBrand(item.model_brand || '');
      setCondition(item.condition === 'old' ? 'old' : 'new');
      setPrice(item.price ? item.price.toString() : '');
      setOriginalPrice(item.original_price ? item.original_price.toString() : '');
      setScale(item.scale || '1:64');
      setBrand(item.brand || '');
      setFbPostContent(item.fb_post_content || '');
      const q = (item as { quantity?: unknown }).quantity;
      setQuantity(
        typeof q === 'number' && Number.isFinite(q) ? String(Math.max(0, Math.floor(q))) : '',
      );
      setAttributeRows(attributeRowsFromApi((item as { attributes?: unknown }).attributes));
      /* eslint-enable react-hooks/set-state-in-effect */
    }
    if (data?.facebook_posts) {
      setFacebookPosts(data.facebook_posts || []);
    }
    
    // Set selected spin set to default if available
    if (data?.spin_sets && data.spin_sets.length > 0) {
      const defaultSpinSet = (data.spin_sets as SpinSet[]).find((set) => set.is_default);
      if (defaultSpinSet) {
        setSelectedSpinSetId(defaultSpinSet.id);
      } else if (!selectedSpinSetId) {
        setSelectedSpinSetId((data.spin_sets[0] as SpinSet).id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // Ignore errors when revoking URLs
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to Social Selling section when navigating from items list
  useEffect(() => {
    if (searchParams.get('section') === 'social-selling' && socialSellingRef.current && data) {
      setCurrentStep(4);
      setTimeout(() => {
        socialSellingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [searchParams, data]);

  useEffect(() => {
    const stepFromQuery = searchParams.get('step');
    if (!stepFromQuery) return;
    const parsed = Number(stepFromQuery);
    if ([1, 2, 3, 4].includes(parsed)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing URL ?step= param to state is intentional
      setCurrentStep(parsed as ProductStep);
    }
  }, [searchParams]);

  const extractItemIdFromResponse = (response: unknown): string | null => {
    const isApiResponse = (r: unknown): r is ApiResponse<ItemResponse> => {
      return typeof r === 'object' && r !== null && 'data' in r && 'ok' in r;
    };

    const responseData = isApiResponse(response) ? response.data : (response as ItemResponse);
    const extractedId = responseData?.item?.id || (responseData as { id?: string })?.id;
    return extractedId || null;
  };

  useEffect(() => {
    if (id === 'new') {
      /* eslint-disable react-hooks/set-state-in-effect -- resetting form for /new route; React 18 batches these */
      setCondition('new');
      setQuantity('');
      setAttributeRows([{ id: newAttributeRowId(), key: '', value: '' }]);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [id]);

  const saveMutation = useMutation({
    mutationFn: async ({ itemData }: SavePayload) => {
      if (id === 'new') {
        return apiClient.post('/items', itemData);
      } else {
        return apiClient.patch(`/items/${id}`, itemData);
      }
    },
    onSuccess: async (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      const itemId = id === 'new' ? extractItemIdFromResponse(response) : id;
      if (itemId) {
        queryClient.invalidateQueries({ queryKey: ['item', itemId] });
      }
      if (id === 'new' && !itemId) {
        showToast('Không thể tạo sản phẩm. Vui lòng thử lại.');
        return;
      }

      if (itemId && selectedFiles.length > 0) {
        setUploadingImages(true);
        try {
          for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const formData = new FormData();
            formData.append('file', file);
            formData.append('is_cover', i === 0 ? 'true' : 'false');
            await uploadFile(`/items/${itemId}/images`, formData);
          }
          queryClient.invalidateQueries({ queryKey: ['item', itemId] });
          setSelectedFiles([]);
          imagePreviewUrls.forEach(url => {
            try {
              URL.revokeObjectURL(url);
            } catch {
              // ignore
            }
          });
          setImagePreviewUrls([]);
          setLastImageUploadFailed(false);
        } catch (error) {
          console.error('Error uploading images:', error);
          setLastImageUploadFailed(true);
          alert('Có lỗi khi upload ảnh. Vui lòng thử lại.');
        } finally {
          setUploadingImages(false);
        }
      }

      if (!variables?.silent) {
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
      }

      if (id === 'new' && variables?.navigateAfterCreate) {
        setTimeout(() => {
          navigate(`/admin/items/${itemId}`);
        }, 500);
      }
    },
  });

  const buildItemData = (): ItemData => {
    const itemData: ItemData = {
      name,
      description,
      status: status as 'con_hang' | 'giu_cho' | 'da_ban',
      is_public: isPublic,
    };

    if (carBrand) itemData.car_brand = carBrand;
    if (modelBrand) itemData.model_brand = modelBrand;
    if (condition) itemData.condition = condition as 'new' | 'old';
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

    if (status === 'da_ban') {
      itemData.quantity = 0;
    } else {
      const qt = quantity.trim();
      if (qt !== '') {
        const qn = parseInt(qt, 10);
        if (!Number.isNaN(qn) && qn >= 0) {
          itemData.quantity = qn;
        }
      }
    }

    const attrs = buildAttributesPayload(attributeRows);
    if (attrs.ok) {
      itemData.attributes = attrs.value;
    }

    return itemData;
  };

  const validateInventoryBeforeSave = (): boolean => {
    if (status !== 'da_ban' && quantity.trim() !== '') {
      const qn = parseInt(quantity.trim(), 10);
      if (Number.isNaN(qn) || qn < 0 || !Number.isInteger(qn)) {
        showToast('Số lượng phải là số nguyên ≥ 0.');
        return false;
      }
    }
    const attrCheck = buildAttributesPayload(attributeRows);
    if (!attrCheck.ok) {
      showToast(attrCheck.message);
      return false;
    }
    return true;
  };

  const saveCurrentItem = async (silent = false): Promise<boolean> => {
    if (!name.trim()) {
      showToast('Vui lòng nhập tên sản phẩm trước khi chuyển bước.');
      return false;
    }
    if (!validateInventoryBeforeSave()) {
      return false;
    }
    try {
      const response = await saveMutation.mutateAsync({
        itemData: buildItemData(),
        silent,
        navigateAfterCreate: !silent,
      });
      if (id === 'new') {
        const createdItemId = extractItemIdFromResponse(response);
        if (!createdItemId) {
          showToast('Không thể tạo sản phẩm. Vui lòng thử lại.');
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Auto-save failed:', error);
      showToast('Không thể lưu dữ liệu. Vui lòng thử lại.');
      return false;
    }
  };

  const preventEnterSubmit = (e: React.KeyboardEvent<HTMLFormElement>) => {
    const target = e.target as HTMLElement;
    if (shouldBlockEnterSubmit(e.key, target.tagName)) {
      e.preventDefault();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Clean up old preview URLs
      imagePreviewUrls.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch {
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
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('is_cover', isCover ? 'true' : 'false');
    
    try {
      await uploadFile(`/items/${id}/images`, formData);
      setLastImageUploadFailed(false);
      queryClient.invalidateQueries({ queryKey: ['item', id] });
    } catch (error) {
      console.error('Error uploading image:', error);
      setLastImageUploadFailed(true);
      throw error;
    }
  };

  // Create spin set mutation
  const createSpinSetMutation = useMutation({
    mutationFn: async (data: { label?: string; is_default?: boolean }) => {
      if (!id || id === 'new') throw new Error('Item ID is required');
      return apiClient.post(`/items/${id}/spin-sets`, data);
    },
    onSuccess: () => {
      if (id && id !== 'new') {
        queryClient.invalidateQueries({ queryKey: ['item', id] });
      }
      setShowCreateSpinSet(false);
      setNewSpinSetLabel('');
      setNewSpinSetIsDefault(false);
    },
  });

  // Update spin set mutation
  const updateSpinSetMutation = useMutation({
    mutationFn: async ({ spinSetId, data }: { spinSetId: string; data: { label?: string; is_default?: boolean } }) => {
      return apiClient.patch(`/spin-sets/${spinSetId}`, data);
    },
    onSuccess: () => {
      if (id && id !== 'new') {
        queryClient.invalidateQueries({ queryKey: ['item', id] });
      }
    },
  });

  // Upload frame mutation
  const uploadFrameMutation = useMutation({
    mutationFn: async ({ spinSetId, file, frameIndex }: { spinSetId: string; file: File; frameIndex?: number }) => {
      const formData = new FormData();
      formData.append('frame', file);
      if (frameIndex !== undefined) {
        formData.append('frame_index', frameIndex.toString());
      }
      return uploadFile(`/spin-sets/${spinSetId}/frames`, formData);
    },
    onSuccess: () => {
      if (id && id !== 'new') {
        queryClient.invalidateQueries({ queryKey: ['item', id] });
      }
    },
  });

  // Delete frame mutation
  const deleteFrameMutation = useMutation({
    mutationFn: async ({ spinSetId, frameId }: { spinSetId: string; frameId: string }) => {
      return apiClient.delete(`/spin-sets/${spinSetId}/frames/${frameId}`);
    },
    onSuccess: () => {
      if (id && id !== 'new') {
        queryClient.invalidateQueries({ queryKey: ['item', id] });
      }
    },
  });

  // Reorder frames mutation
  const reorderFramesMutation = useMutation({
    mutationFn: async ({ spinSetId, frameIds }: { spinSetId: string; frameIds: string[] }) => {
      return apiClient.patch(`/spin-sets/${spinSetId}/frames/order`, { frame_ids: frameIds });
    },
    onSuccess: () => {
      if (id && id !== 'new') {
        queryClient.invalidateQueries({ queryKey: ['item', id] });
      }
    },
    onError: (error) => {
      console.error('Error reordering frames:', error);
      alert('Có lỗi khi sắp xếp frames: ' + (error instanceof Error ? error.message : 'Unknown error'));
      // Invalidate to restore original order
      if (id && id !== 'new') {
        queryClient.invalidateQueries({ queryKey: ['item', id] });
      }
    },
  });

  const handleUploadFrames = async (e: React.ChangeEvent<HTMLInputElement>, spinSetId: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    setUploadingFrames(true);
    
    try {
      for (const file of files) {
        await uploadFrameMutation.mutateAsync({ spinSetId, file });
      }
    } catch (error) {
      console.error('Error uploading frames:', error);
      alert('Có lỗi khi upload frames');
    } finally {
      setUploadingFrames(false);
      e.target.value = '';
    }
  };

  const handleMoveFrame = (spinSetId: string, frameId: string, direction: 'up' | 'down', spinSets: SpinSet[]) => {
    const spinSet = spinSets.find((set) => set.id === spinSetId);
    if (!spinSet || !spinSet.frames || spinSet.frames.length === 0) return;

    const frames = [...spinSet.frames].sort((a, b) => a.frame_index - b.frame_index);
    const currentIndex = frames.findIndex((f) => f.id === frameId);
    
    if (currentIndex === -1) return;
    
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === frames.length - 1) return;

    const newOrder = [...frames];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    [newOrder[currentIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[currentIndex]];

    const frameIds = newOrder.map((f) => f.id);
    reorderFramesMutation.mutate({ spinSetId, frameIds });
  };

  // AI Description generation handler
  const handleGenerateAiDescription = async () => {
    if (!id || id === 'new') {
      alert('Vui lòng lưu sản phẩm trước khi tạo mô tả AI.');
      return;
    }
    
    setIsGeneratingAi(true);
    try {
      const response = await apiClient.post(`/items/${id}/ai-description`, {});
      const result = response.data;
      
      if (!result) throw new Error('No data received');
      
      setAiDescription(result);
      setShowAiPreview(true);
      setAiPreviewTab('short');
    } catch (error) {
      console.error('Error generating AI description:', error);
      alert('Có lỗi khi tạo mô tả AI. Vui lòng thử lại.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Accept AI generated description
  const handleAcceptAiDescription = () => {
    if (!aiDescription) return;
    if (!validateInventoryBeforeSave()) {
      return;
    }
    const newDescription = aiDescription.long_description;
    setDescription(newDescription);
    setShowAiPreview(false);
    setAiDescription(null);
    const merged = buildItemData();
    merged.description = newDescription;
    saveMutation.mutate({ itemData: merged });
  };

  if (isLoading && id !== 'new') return <div style={{ padding: '20px' }}>Đang tải...</div>;

  const item = data?.item;
  const images = (data?.images || []) as ItemImage[];
  const spinSets = (data?.spin_sets || []) as SpinSet[];
  const selectedSpinSet = spinSets.find((set) => set.id === selectedSpinSetId);
  const maxFramesReached = (selectedSpinSet?.frames?.length ?? 0) >= MAX_SPINNER_FRAMES;
  const isNewItem = id === 'new';

  const addAttributeRow = () => {
    setAttributeRows((prev) => {
      if (prev.length >= MAX_ITEM_ATTRIBUTE_KEYS) {
        showToast(`Tối đa ${MAX_ITEM_ATTRIBUTE_KEYS} thuộc tính.`);
        return prev;
      }
      return [...prev, { id: newAttributeRowId(), key: '', value: '' }];
    });
  };

  const removeAttributeRow = (rowId: string) => {
    setAttributeRows((prev) => {
      if (prev.length <= 1) {
        return [{ id: newAttributeRowId(), key: '', value: '' }];
      }
      return prev.filter((r) => r.id !== rowId);
    });
  };

  const updateAttributeRow = (rowId: string, field: 'key' | 'value', value: string) => {
    setAttributeRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r)),
    );
  };

  const goToStep = (step: ProductStep) => {
    void (async () => {
      if (stepNavInFlightRef.current) return;
      if (isNewItem && step > 1) {
        showToast('Vui lòng lưu sản phẩm trước để mở các bước tiếp theo.');
        return;
      }
      stepNavInFlightRef.current = true;
      try {
        await jumpToStepWithAutoSave({
          currentStep,
          targetStep: step,
          isBusy: saveMutation.isPending || uploadingImages,
          saveCurrentItem,
          setCurrentStep,
        });
      } finally {
        stepNavInFlightRef.current = false;
      }
    })();
  };

  const goToNextStep = async () => {
    if (isNewItem && currentStep === 1) {
      if (!name.trim()) {
        showToast('Vui lòng nhập tên sản phẩm trước khi chuyển bước.');
        return;
      }
      if (!validateInventoryBeforeSave()) {
        return;
      }

      try {
        const response = await saveMutation.mutateAsync({
          itemData: buildItemData(),
          silent: true,
          navigateAfterCreate: false,
        });
        const createdItemId = extractItemIdFromResponse(response);
        if (!createdItemId) {
          showToast('Không thể tạo sản phẩm. Vui lòng thử lại.');
          return;
        }
        navigate(buildStepUrlAfterCreate(createdItemId, 2));
      } catch (error) {
        console.error('Create item before next step failed:', error);
        showToast('Không thể lưu dữ liệu. Vui lòng thử lại.');
      }
      return;
    }

    await navigateStepWithAutoSave({
      currentStep,
      direction: 'next',
      isBusy: saveMutation.isPending || uploadingImages,
      saveCurrentItem,
      setCurrentStep,
    });
  };

  const goToPrevStep = async () => {
    await navigateStepWithAutoSave({
      currentStep,
      direction: 'prev',
      isBusy: saveMutation.isPending || uploadingImages,
      saveCurrentItem,
      setCurrentStep,
    });
  };

  const handleSaveAndBackToList = async () => {
    const saved = await saveCurrentItem(true);
    if (!saved) return;

    let missingImages = images.length === 0;
    let missingSpin360 = !spinSets.some((set) => (set.frames?.length || 0) > 0);
    try {
      const response = await apiClient.get(`/items/${id}`);
      const latest = response.data;
      const latestImages = (latest.images || []) as ItemImage[];
      const latestSpinSets = (latest.spin_sets || []) as SpinSet[];
      missingImages = latestImages.length === 0;
      missingSpin360 = !latestSpinSets.some((set) => (set.frames?.length || 0) > 0);
    } catch (error) {
      console.error('Cannot verify media before finishing:', error);
    }

    const preDecision = evaluateFinishDecision(
      { lastImageUploadFailed, missingImages, missingSpin360 },
      false,
    );
    const confirmed = preDecision.warnings.length === 0 || window.confirm(
      `Cảnh báo dữ liệu media:\n${preDecision.warnings.join('\n')}\n\nBạn vẫn muốn hoàn tất và về danh sách sản phẩm?`
    );
    const finishDecision = evaluateFinishDecision(
      { lastImageUploadFailed, missingImages, missingSpin360 },
      confirmed,
    );

    if (!finishDecision.proceed) {
      if (finishDecision.fallbackStep) {
        setCurrentStep(finishDecision.fallbackStep);
      }
      showToast('Vui lòng bổ sung ảnh/ảnh 360 trước khi hoàn tất.');
      return;
    }

    showToast('Đã lưu sản phẩm thành công.');
    navigate('/admin/items');
  };

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
        .item-detail-shell {
          max-width: 1280px;
          margin: 0 auto;
          box-sizing: border-box;
          padding: 20px 16px 32px;
        }
        .product-stepper {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 20px;
          max-width: 800px;
        }
        .product-step-btn {
          border: 1px solid #d8dee9;
          background: #fff;
          border-radius: 10px;
          padding: 10px 12px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .product-step-btn.active {
          border-color: #007bff;
          background: #e9f2ff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.08);
        }
        .product-step-btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .product-step-index {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 999px;
          background: #f0f2f5;
          color: #333;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .product-step-btn.active .product-step-index {
          background: #007bff;
          color: #fff;
        }
        @media (max-width: 768px) {
          .product-stepper {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }
          .product-step-btn {
            padding: 8px 10px;
          }
          .item-detail-shell {
            padding: 16px 12px 20px;
          }
          .item-detail-header-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .item-detail-heading {
            font-size: 24px;
          }
          .item-detail-form,
          .item-detail-sections {
            max-width: 100%;
          }
          .item-detail-toolbar {
            flex-direction: column;
            align-items: stretch;
          }
          .item-detail-toolbar > * {
            width: 100%;
          }
          .item-detail-actions {
            position: sticky;
            bottom: 0;
            padding: 12px 0 calc(12px + env(safe-area-inset-bottom, 0px));
            background: linear-gradient(180deg, rgba(255,255,255,0) 0%, #fff 22%);
          }
          .item-detail-actions button {
            flex: 1 1 100%;
            min-height: 44px;
          }
        }
      `}</style>
    <div className="item-detail-shell">
      <div style={{ marginBottom: '24px' }}>
        <div className="item-detail-header-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
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
        <div className="item-detail-header-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
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
            <h1 className="item-detail-heading" style={{ 
              margin: 0, 
              fontSize: isMobile ? '24px' : '28px', 
              fontWeight: '800', 
              color: '#0f172a',
              letterSpacing: '-0.02em',
              lineHeight: '1.15',
            }}>
              {id === 'new' ? 'Tạo sản phẩm mới' : 'Chỉnh sửa sản phẩm'}
            </h1>
            <p style={{ 
              margin: '4px 0 0 0', 
              fontSize: '14px', 
              color: '#64748b',
              fontWeight: '500',
            }}>
              {id === 'new' ? 'Thêm sản phẩm mới vào kho' : `Chỉnh sửa thông tin sản phẩm: ${item?.name || ''}`}
            </p>
          </div>
        </div>
      </div>
      <div className="product-stepper">
        {PRODUCT_STEPS.map((step) => {
          const disabled = isNewItem && step.id > 1;
          return (
            <button
              key={step.id}
              type="button"
              className={`product-step-btn ${currentStep === step.id ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
              onClick={() => goToStep(step.id)}
              disabled={disabled}
            >
              <span className="product-step-index">{step.id}</span>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>
                {isMobile ? step.shortTitle : step.title}
              </div>
            </button>
          );
        })}
      </div>
      <form
        onSubmit={(e) => e.preventDefault()}
        onKeyDown={preventEnterSubmit}
        className="item-detail-form"
        style={{ maxWidth: '800px', display: currentStep === 1 ? 'block' : 'none' }}
      >
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
          <div className="item-detail-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
              Mô tả
            </label>
            {id && id !== 'new' && (
              <button
                type="button"
                onClick={handleGenerateAiDescription}
                disabled={isGeneratingAi}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: isGeneratingAi ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: isGeneratingAi ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <Sparkles size={14} />
                {isGeneratingAi ? 'Đang tạo...' : 'Tạo mô tả AI'}
              </button>
            )}
          </div>
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
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                Hãng xe
              </label>
              <CategoryQuickManage
                type="car_brand"
                categories={carBrandsData?.categories || []}
              />
            </div>
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
              {activeCarBrands.map((cat) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
        </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                Hãng mô hình
              </label>
              <CategoryQuickManage
                type="model_brand"
                categories={modelBrandsData?.categories || []}
              />
            </div>
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
              {activeModelBrands.map((cat) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
              <option value="OTHER BRAND">Hãng khác</option>
            </select>
        </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
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
              flexWrap: 'wrap',
              width: isMobile ? '100%' : 'auto',
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
                  flex: isMobile ? '1 1 120px' : undefined,
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
                  onChange={(e) => setCondition(e.target.value as 'new' | 'old')}
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
                  flex: isMobile ? '1 1 120px' : undefined,
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
                  onChange={(e) => setCondition(e.target.value as 'new' | 'old')}
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
            flexWrap: 'wrap',
            width: isMobile ? '100%' : 'auto',
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
                flex: isMobile ? '1 1 110px' : undefined,
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
                flex: isMobile ? '1 1 110px' : undefined,
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
                flex: isMobile ? '1 1 110px' : undefined,
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
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
            Số lượng tồn kho
          </label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            disabled={status === 'da_ban'}
            value={status === 'da_ban' ? '0' : quantity}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '');
              setQuantity(v);
            }}
            placeholder="Ví dụ: 5"
            style={{
              width: '100%',
              maxWidth: '200px',
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s',
              color: '#1a1a1a',
              backgroundColor: status === 'da_ban' ? '#f3f4f6' : '#fff',
            }}
            onFocus={(e) => {
              if (status === 'da_ban') return;
              e.currentTarget.style.borderColor = '#007bff';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#ddd';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          {status === 'da_ban' ? (
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px', marginBottom: 0 }}>
              Trạng thái đã bán: hệ thống luôn lưu số lượng 0.
            </p>
          ) : (
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px', marginBottom: 0 }}>
              Để trống khi tạo mới để dùng mặc định (1). Chỉ nhập số nguyên ≥ 0.
            </p>
          )}
        </div>
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '6px',
            }}
          >
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>Thuộc tính tùy chỉnh</label>
            <button
              type="button"
              onClick={addAttributeRow}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <Plus size={14} />
              Thêm dòng
            </button>
          </div>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px' }}>
            Tối đa {MAX_ITEM_ATTRIBUTE_KEYS} cặp. Giá trị để trống được lưu là null. Nhập <code>true</code> /{' '}
            <code>false</code> hoặc số nguyên để lưu đúng kiểu.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {attributeRows.map((row) => (
              <div
                key={row.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr auto',
                  gap: '8px',
                  alignItems: 'center',
                }}
              >
                <input
                  type="text"
                  value={row.key}
                  onChange={(e) => updateAttributeRow(row.id, 'key', e.target.value)}
                  placeholder="Tên (ví dụ: mau_sac)"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
                <input
                  type="text"
                  value={row.value}
                  onChange={(e) => updateAttributeRow(row.id, 'value', e.target.value)}
                  placeholder="Giá trị"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeAttributeRow(row.id)}
                  aria-label="Xóa dòng thuộc tính"
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    background: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={18} color="#6b7280" />
                </button>
              </div>
            ))}
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
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '120px' : '150px'}, 1fr))`, gap: '10px', marginTop: '10px' }}>
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
        <div style={{ fontSize: '13px', color: '#6b7280' }}>
          Dữ liệu sẽ tự động lưu khi bạn nhấn nút Bước tiếp hoặc Bước trước.
        </div>
        {id && id !== 'new' && (
          <InventoryTimeline itemId={id} />
        )}
      </form>
      {id !== 'new' && item && (
        <div className="item-detail-sections" style={{ marginTop: '40px', maxWidth: '800px' }}>
          <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
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
              aria-label="Upload item images"
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
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '150px' : '200px'}, 1fr))`, gap: '15px' }}>
              {images.map((img) => (
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
          </div>
          <div style={{ display: currentStep === 3 ? 'block' : 'none' }}>
          <h2 style={{ 
            marginTop: '40px', 
            fontSize: '24px', 
            fontWeight: '600', 
            color: '#1a1a1a',
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: '2px solid #f0f0f0',
          }}>Spinner 360°</h2>
          
          {/* Create Spin Set */}
          {!showCreateSpinSet ? (
            <button
              onClick={() => setShowCreateSpinSet(true)}
              style={{
                padding: '10px 20px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Plus size={16} />
              Tạo bộ spinner mới
            </button>
          ) : (
            <div style={{ 
              marginBottom: '20px', 
              padding: '16px', 
              border: '1px solid #ddd', 
              borderRadius: '8px',
              backgroundColor: '#f9f9f9',
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Tên bộ spinner (tùy chọn)"
                  value={newSpinSetLabel}
                  onChange={(e) => setNewSpinSetLabel(e.target.value)}
                  style={{
                    flex: '1 1 220px',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', minHeight: '40px' }}>
                  <input
                    type="checkbox"
                    checked={newSpinSetIsDefault}
                    onChange={(e) => setNewSpinSetIsDefault(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px' }}>Đặt làm mặc định</span>
                </label>
                <button
                  onClick={() => {
                    createSpinSetMutation.mutate({ 
                      label: newSpinSetLabel || undefined,
                      is_default: newSpinSetIsDefault,
                    });
                  }}
                  disabled={createSpinSetMutation.isPending}
                  style={{
                    padding: '8px 16px',
                    background: createSpinSetMutation.isPending ? '#ccc' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: createSpinSetMutation.isPending ? 'not-allowed' : 'pointer',
                  }}
                >
                  {createSpinSetMutation.isPending ? 'Đang tạo...' : 'Tạo'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateSpinSet(false);
                    setNewSpinSetLabel('');
                    setNewSpinSetIsDefault(false);
                  }}
                  style={{
                    padding: '8px 16px',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Spin Sets List */}
          {spinSets.length > 0 ? (
            <div style={{ marginBottom: '30px' }}>
              {/* Spin Set Selector */}
              <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {spinSets.map((set) => (
                  <button
                    key={set.id}
                    onClick={() => setSelectedSpinSetId(set.id)}
                    style={{
                      padding: '10px 16px',
                      background: selectedSpinSetId === set.id ? '#007bff' : '#f5f5f5',
                      color: selectedSpinSetId === set.id ? 'white' : '#333',
                      border: selectedSpinSetId === set.id ? 'none' : '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {set.is_default && <Star size={16} fill="currentColor" />}
                    {set.label || `Bộ spinner ${set.frames?.length || 0} frames`}
                  </button>
                ))}
              </div>

              {/* Selected Spin Set Management */}
              {selectedSpinSet && (
                <div style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '12px', 
                  padding: '20px',
                  backgroundColor: '#fff',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1a1a1a' }}>
                        {selectedSpinSet.label || 'Bộ spinner không tên'}
                        {selectedSpinSet.is_default && (
                          <span style={{ 
                            marginLeft: '8px', 
                            padding: '4px 8px', 
                            background: '#ffc107', 
                            color: '#000',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                          }}>
                            Mặc định
                          </span>
                        )}
                      </h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
                        {selectedSpinSet.frames?.length || 0} frames
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {!selectedSpinSet.is_default && (
                        <button
                          onClick={() => {
                            updateSpinSetMutation.mutate({
                              spinSetId: selectedSpinSet.id,
                              data: { is_default: true },
                            });
                          }}
                          style={{
                            padding: '8px 16px',
                            background: '#ffc107',
                            color: '#000',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <Star size={16} />
                          Đặt làm mặc định
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Spinner360 Preview */}
                  {selectedSpinSet.frames && selectedSpinSet.frames.length > 0 && (
                    <div style={{ 
                      marginBottom: '30px', 
                      padding: '20px', 
                      background: '#f9f9f9', 
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'center',
                    }}>
                      <Spinner360
                        frames={selectedSpinSet.frames.map((frame) => ({
                          id: frame.id,
                          image_url: frame.image_url,
                          thumbnail_url: frame.thumbnail_url ?? undefined,
                          frame_index: frame.frame_index,
                        }))}
                        autoplay={false}
                        width={400}
                        height={400}
                      />
                    </div>
                  )}

                  {/* Upload Frames */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontSize: '14px', 
                      fontWeight: '500',
                      color: '#333',
                    }}>
                      Upload frames:
                    </label>
                    <input
                      type="file"
                      data-testid="spinner-frame-upload"
                      multiple
                      accept="image/*"
                      disabled={uploadingFrames || maxFramesReached}
                      onChange={(e) => handleUploadFrames(e, selectedSpinSet.id)}
                      style={{ 
                        width: '100%', 
                        padding: '10px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        cursor: uploadingFrames || maxFramesReached ? 'not-allowed' : 'pointer',
                      }}
                    />
                    {maxFramesReached && (
                      <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#dc3545' }}>
                        Đã đạt giới hạn {MAX_SPINNER_FRAMES} frames. Vui lòng xóa bớt frame nếu muốn upload thêm.
                      </p>
                    )}
                    {uploadingFrames && (
                      <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#007bff' }}>
                        Đang upload frames...
                      </p>
                    )}
                  </div>

                  {/* Frames List */}
                  {selectedSpinSet.frames && selectedSpinSet.frames.length > 0 ? (
                    <div>
                      <h4 style={{ 
                        margin: '0 0 16px 0', 
                        fontSize: '16px', 
                        fontWeight: '600',
                        color: '#333',
                      }}>
                        Frames ({selectedSpinSet.frames.length})
                      </h4>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
                        gap: '12px',
                      }}>
                        {[...selectedSpinSet.frames]
                          .sort((a, b) => a.frame_index - b.frame_index)
                          .map((frame, index) => (
                            <div 
                              key={frame.id} 
                              style={{ 
                                border: '1px solid #ddd', 
                                borderRadius: '8px', 
                                padding: '10px',
                                backgroundColor: '#fff',
                                position: 'relative',
                              }}
                            >
                              <img
                                src={frame.thumbnail_url || frame.image_url}
                                alt={`Frame ${frame.frame_index + 1}`}
                                style={{ 
                                  width: '100%', 
                                  height: '150px', 
                                  objectFit: 'cover', 
                                  borderRadius: '4px',
                                  marginBottom: '8px',
                                }}
                              />
                              <div style={{ 
                                fontSize: '12px', 
                                color: '#666', 
                                marginBottom: '8px',
                                textAlign: 'center',
                              }}>
                                Frame {frame.frame_index + 1}
                              </div>
                              <div style={{ display: 'flex', gap: '4px', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button
                                    onClick={() => handleMoveFrame(selectedSpinSet.id, frame.id, 'up', spinSets)}
                                    disabled={index === 0 || reorderFramesMutation.isPending}
                                    style={{
                                      flex: 1,
                                      padding: '6px',
                                      background: index === 0 ? '#ccc' : '#f0f0f0',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: index === 0 ? 'not-allowed' : 'pointer',
                                      fontSize: '12px',
                                    }}
                                    title="Di chuyển lên"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    onClick={() => handleMoveFrame(selectedSpinSet.id, frame.id, 'down', spinSets)}
                                    disabled={index === selectedSpinSet.frames.length - 1 || reorderFramesMutation.isPending}
                                    style={{
                                      flex: 1,
                                      padding: '6px',
                                      background: index === selectedSpinSet.frames.length - 1 ? '#ccc' : '#f0f0f0',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: index === selectedSpinSet.frames.length - 1 ? 'not-allowed' : 'pointer',
                                      fontSize: '12px',
                                    }}
                                    title="Di chuyển xuống"
                                  >
                                    ↓
                                  </button>
                                </div>
                                <button
                                    onClick={async () => {
                                    if (confirm('Bạn có chắc muốn xóa frame này?')) {
                                      try {
                                        await deleteFrameMutation.mutateAsync({
                                          spinSetId: selectedSpinSet.id,
                                          frameId: frame.id,
                                        });
                                      } catch (error: unknown) {
                                        const err = error as { response?: { status?: number }; status?: number; message?: string };
                                        // Ignore 404 errors (frame already deleted)
                                        if (err?.response?.status === 404 || err?.status === 404 || err?.message?.includes('not found')) {
                                          console.log('Frame already deleted, refreshing...');
                                          queryClient.invalidateQueries({ queryKey: ['item', id] });
                                          return;
                                        }
                                        
                                        console.error('Error deleting frame:', err);
                                        alert(`Có lỗi khi xóa frame: ${err?.message || JSON.stringify(err)}`);
                                      }
                                    }
                                  }}
                                  disabled={deleteFrameMutation.isPending}
                                  style={{
                                    width: '100%',
                                    padding: '6px',
                                    background: deleteFrameMutation.isPending ? '#ccc' : '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: deleteFrameMutation.isPending ? 'not-allowed' : 'pointer',
                                    fontSize: '12px',
                                  }}
                                >
                                  {deleteFrameMutation.isPending ? 'Xóa...' : 'Xóa'}
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ 
                      padding: '40px', 
                      textAlign: 'center', 
                      color: '#666',
                      border: '1px dashed #ddd',
                      borderRadius: '8px',
                    }}>
                      <p style={{ margin: 0, fontSize: '14px' }}>
                        Chưa có frames nào. Upload frames để bắt đầu.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              color: '#666',
              border: '1px dashed #ddd',
              borderRadius: '8px',
            }}>
              <p style={{ margin: 0, fontSize: '14px' }}>
                Chưa có bộ spinner nào. Tạo bộ spinner mới để bắt đầu.
              </p>
            </div>
          )}
          </div>
          <div style={{ display: currentStep === 4 ? 'block' : 'none' }}>
          <div ref={socialSellingRef}>
          <h2 style={{ 
            marginTop: '40px', 
            fontSize: '24px', 
            fontWeight: '600', 
            color: '#1a1a1a',
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: '2px solid #f0f0f0',
          }}>Social Selling</h2>

          {/* FB Posts History */}
          {facebookPosts.length > 0 && (
            <div style={{
              marginBottom: '20px',
              padding: '14px 18px',
              background: 'linear-gradient(135deg, #e3f2fd 0%, #e8f5e9 100%)',
              borderRadius: '10px',
              border: '1px solid #bbdefb',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '18px' }}>✅</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#1b5e20' }}>
                  Đã đăng Facebook ({facebookPosts.length} bài)
                </span>
              </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                {facebookPosts.map((post) => (
                  <div key={post.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0',
                    gap: '8px',
                    flexWrap: isMobile ? 'wrap' : 'nowrap',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {new Date(post.posted_at).toLocaleDateString('vi-VN', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                      <div style={{ fontSize: '13px', color: '#1877F2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {post.post_url}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap' }}>
                      <a
                        href={post.post_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '4px 10px',
                          background: '#1877F2',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          fontSize: '12px',
                          textDecoration: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        🔗 Mở
                      </a>
                      <button
                        onClick={async () => {
                          if (!confirm('Bạn muốn xóa bài FB này?')) return;
                          try {
                            await apiClient.delete(`/items/${id}/facebook-posts/${post.id}`);
                            setFacebookPosts(prev => prev.filter(p => p.id !== post.id));
                            showToast('Đã xóa bài FB!');
                            queryClient.invalidateQueries({ queryKey: ['items'] });
                            queryClient.invalidateQueries({ queryKey: ['fb-posts'] });
                            queryClient.invalidateQueries({ queryKey: ['item', id] });
                          } catch {
                            alert('Không thể xóa. Vui lòng thử lại.');
                          }
                        }}
                        style={{
                          padding: '4px 10px',
                          background: '#f5f5f5',
                          color: '#dc3545',
                          border: '1px solid #ddd',
                          borderRadius: '5px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Custom Instructions Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: '500',
              color: '#333',
            }}>
              Yêu cầu bổ sung (tùy chọn):
            </label>
            <input
              type="text"
              value={fbPostInstructions}
              onChange={(e) => setFbPostInstructions(e.target.value)}
              placeholder="VD: Thêm hashtag trending, nhấn mạnh giá sale..."
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={async () => {
              setIsGeneratingFbPost(true);
              try {
                const response = await apiClient.post(`/items/${id}/fb-post`, {
                  custom_instructions: fbPostInstructions || undefined
                });
                setFbPostContent(response.data?.content || '');
              } catch (error) {
                console.error('Error generating FB post:', error);
                alert('Có lỗi khi tạo bài FB. Vui lòng thử lại.');
              } finally {
                setIsGeneratingFbPost(false);
              }
            }}
            disabled={isGeneratingFbPost}
            style={{
              padding: '12px 24px',
              background: isGeneratingFbPost ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isGeneratingFbPost ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
              width: isMobile ? '100%' : 'auto',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={18} />
            {isGeneratingFbPost ? 'Đang tạo...' : 'Tạo bài FB bằng AI'}
          </button>

          {/* FB Post Content Textarea */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: '500',
              color: '#333',
            }}>
              Nội dung bài đăng:
            </label>
            <textarea
              value={fbPostContent}
              onChange={(e) => setFbPostContent(e.target.value)}
              placeholder="Nội dung bài FB sẽ hiển thị ở đây sau khi AI tạo. Bạn có thể chỉnh sửa trực tiếp..."
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '14px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                lineHeight: '1.6',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
            <button
              onClick={async () => {
                if (!fbPostContent) {
                  alert('Chưa có nội dung để copy!');
                  return;
                }
                try {
                  await navigator.clipboard.writeText(fbPostContent);
                  showToast('Đã copy nội dung!');
                } catch {
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
              }}
            >
              📋 Copy nội dung
            </button>
            <button
              onClick={async () => {
                try {
                  const link = `${window.location.origin}/items/${id}`;
                  await navigator.clipboard.writeText(link);
                  showToast('Đã copy link!');
                } catch {
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
              }}
            >
              🔗 Copy Link SP
            </button>
            <button
              onClick={async () => {
                if (!fbPostContent) {
                  alert('Chưa có nội dung để lưu!');
                  return;
                }
                try {
                  await apiClient.patch(`/items/${id}`, { fb_post_content: fbPostContent });
                  queryClient.invalidateQueries({ queryKey: ['items'] });
                  queryClient.invalidateQueries({ queryKey: ['fb-posts'] });
                  queryClient.invalidateQueries({ queryKey: ['item', id] });
                  showToast('Đã lưu nội dung!');
                } catch (error) {
                  console.error('Error saving FB post:', error);
                  alert('Không thể lưu. Vui lòng thử lại.');
                }
              }}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              💾 Lưu nội dung
            </button>
            {/* "Đăng lên Facebook" button: copy content + open FB */}
            <button
              onClick={async () => {
                if (!fbPostContent) {
                  alert('Chưa có nội dung! Tạo bài FB trước khi đăng.');
                  return;
                }
                try {
                  await navigator.clipboard.writeText(fbPostContent);
                  // Save content to DB
                  await apiClient.patch(`/items/${id}`, { fb_post_content: fbPostContent });
                  queryClient.invalidateQueries({ queryKey: ['items'] });
                  queryClient.invalidateQueries({ queryKey: ['fb-posts'] });
                  queryClient.invalidateQueries({ queryKey: ['item', id] });
                  // Open Facebook in new tab
                  window.open('https://www.facebook.com/', '_blank');
                  showToast('✅ Đã copy nội dung! Hãy paste và đăng trên Facebook.', '#1877F2', 4000);
                } catch {
                  alert('Không thể copy. Vui lòng thử lại.');
                }
              }}
              style={{
                padding: '10px 20px',
                background: '#1877F2',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              📤 Đăng lên Facebook
            </button>
            <button
              onClick={async () => {
                if (!fbPostContent) {
                  alert('Chưa có nội dung! Tạo bài FB trước khi publish.');
                  return;
                }
                if (!window.confirm('Bạn có chắc muốn publish bài này lên Facebook Page? Hành động này không thể hoàn tác.')) {
                  return;
                }
                setIsPublishingToFb(true);
                setPublishFbMessage(null);
                try {
                  // Publish to Facebook via Graph API (content sent in body)
                  const response = await apiClient.post(`/items/${id}/facebook-posts/publish`, {
                    content: fbPostContent,
                  });
                  const responseData = response.data as { post?: FacebookPost };
                  const newPost = responseData.post;
                  if (newPost) {
                    setFacebookPosts(prev => [newPost, ...prev]);
                  }
                  queryClient.invalidateQueries({ queryKey: ['items'] });
                  queryClient.invalidateQueries({ queryKey: ['fb-posts'] });
                  queryClient.invalidateQueries({ queryKey: ['item', id] });
                  setPublishFbMessage('✅ Đã đăng thành công lên Facebook!');
                  showToast('✅ Đã publish lên Facebook!', '#28a745', 4000);
                } catch (error) {
                  console.error('Error publishing to FB:', error);
                  const err = error as { response?: { data?: { message?: string } } };
                  const msg = err?.response?.data?.message || 'Không thể publish. Vui lòng thử lại.';
                  setPublishFbMessage(`❌ ${msg}`);
                } finally {
                  setIsPublishingToFb(false);
                }
              }}
              disabled={isPublishingToFb || !fbPostContent}
              style={{
                padding: '10px 20px',
                background: isPublishingToFb || !fbPostContent ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isPublishingToFb || !fbPostContent ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {isPublishingToFb ? '⏳ Đang publish...' : '🚀 Publish lên Facebook'}
            </button>
          </div>

          {/* Publish Status Message */}
          {publishFbMessage && (
            <div style={{
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              marginBottom: '16px',
              background: publishFbMessage.startsWith('✅') ? '#d4edda' : '#f8d7da',
              color: publishFbMessage.startsWith('✅') ? '#155724' : '#721c24',
              border: `1px solid ${publishFbMessage.startsWith('✅') ? '#c3e6cb' : '#f5c6cb'}`,
            }}>
              {publishFbMessage}
            </div>
          )}

          {/* Save FB Post Link Section */}
          <div style={{
            padding: '18px',
            background: '#f8f9fa',
            borderRadius: '10px',
            border: '1px dashed #dee2e6',
          }}>
            <label style={{
              display: 'block',
              marginBottom: '10px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#333',
            }}>
              📌 Thêm link bài đăng Facebook
            </label>
            <p style={{ fontSize: '13px', color: '#666', margin: '0 0 12px 0' }}>
              Sau khi đăng xong trên Facebook, dán link bài viết vào đây để lưu lại.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                type="url"
                value={newFbLinkInput}
                onChange={(e) => setNewFbLinkInput(e.target.value)}
                placeholder="https://www.facebook.com/..."
                style={{
                  flex: '1 1 260px',
                  padding: '10px 14px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
              <button
                onClick={async () => {
                  if (!newFbLinkInput) {
                    alert('Vui lòng nhập link bài Facebook!');
                    return;
                  }
                  if (!newFbLinkInput.includes('facebook.com') && !newFbLinkInput.includes('fb.com')) {
                    alert('Link không hợp lệ! Vui lòng nhập link Facebook.');
                    return;
                  }
                  setIsSavingFbLink(true);
                  try {
                    const response = await apiClient.post(`/items/${id}/facebook-posts`, {
                      post_url: newFbLinkInput,
                      content: fbPostContent || undefined,
                    });
                    const responseData = response.data as { post?: FacebookPost };
                    const newPost = responseData.post;
                    if (newPost) {
                      setFacebookPosts(prev => [newPost, ...prev]);
                    }
                    setNewFbLinkInput('');
                    queryClient.invalidateQueries({ queryKey: ['items'] });
                    queryClient.invalidateQueries({ queryKey: ['fb-posts'] });
                    queryClient.invalidateQueries({ queryKey: ['item', id] });
                    showToast('✅ Đã lưu link bài Facebook!');
                  } catch (error) {
                    console.error('Error saving FB link:', error);
                    alert('Không thể lưu. Vui lòng thử lại.');
                  } finally {
                    setIsSavingFbLink(false);
                  }
                }}
                disabled={isSavingFbLink}
                style={{
                  padding: '10px 20px',
                  background: isSavingFbLink ? '#ccc' : '#1877F2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: isSavingFbLink ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {isSavingFbLink ? 'Đang lưu...' : '➕ Thêm link FB'}
              </button>
            </div>
          </div>
          </div>
          </div>
        </div>
      )}
      <div className="item-detail-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '20px', maxWidth: '800px' }}>
        <button
          type="button"
          onClick={goToPrevStep}
          disabled={currentStep === 1 || saveMutation.isPending || uploadingImages}
          style={{
            padding: '10px 16px',
            background: currentStep === 1 || saveMutation.isPending || uploadingImages ? '#d2d6dc' : '#4b5563',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: currentStep === 1 || saveMutation.isPending || uploadingImages ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          ← Bước trước
        </button>
        <button
          type="button"
          onClick={goToNextStep}
          disabled={currentStep === 4 || saveMutation.isPending || uploadingImages}
          style={{
            padding: '10px 16px',
            background: currentStep === 4 || saveMutation.isPending || uploadingImages ? '#d2d6dc' : '#1f8f4f',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: currentStep === 4 || saveMutation.isPending || uploadingImages ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          {saveMutation.isPending ? 'Đang lưu...' : 'Bước tiếp →'}
        </button>
        {currentStep === 4 && (
          <button
            type="button"
            onClick={handleSaveAndBackToList}
            disabled={saveMutation.isPending || uploadingImages}
            style={{
              padding: '10px 16px',
              background: saveMutation.isPending || uploadingImages ? '#d2d6dc' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: saveMutation.isPending || uploadingImages ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            {saveMutation.isPending ? 'Đang lưu...' : 'Hoàn tất'}
          </button>
        )}
      </div>
    </div>

      {/* AI Description Preview Modal */}
      {showAiPreview && aiDescription && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '700px',
            maxHeight: '80vh',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={24} color="#667eea" />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>AI Generated Content</h3>
              </div>
              <button
                onClick={() => { setShowAiPreview(false); setAiDescription(null); }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                }}
              >
                <X size={24} color="#666" />
              </button>
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #eee',
              background: '#f8f9fa',
            }}>
              {(['short', 'long', 'bullets', 'seo'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setAiPreviewTab(tab)}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: 'none',
                    background: aiPreviewTab === tab ? 'white' : 'transparent',
                    borderBottom: aiPreviewTab === tab ? '2px solid #667eea' : '2px solid transparent',
                    color: aiPreviewTab === tab ? '#667eea' : '#666',
                    fontWeight: aiPreviewTab === tab ? '600' : '400',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  {tab === 'short' && 'Mô tả ngắn'}
                  {tab === 'long' && 'Mô tả chi tiết'}
                  {tab === 'bullets' && 'Bullet specs'}
                  {tab === 'seo' && 'SEO Meta'}
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{
              padding: '24px',
              maxHeight: '400px',
              overflow: 'auto',
            }}>
              {aiPreviewTab === 'short' && (
                <div>
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>Mô tả ngắn cho Facebook post (50-80 từ):</p>
                  <div style={{
                    padding: '16px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    fontSize: '14px',
                    lineHeight: '1.6',
                  }}>
                    {aiDescription.short_description}
                  </div>
                </div>
              )}
              {aiPreviewTab === 'long' && (
                <div>
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>Mô tả chi tiết cho website (150-200 từ):</p>
                  <div style={{
                    padding: '16px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    fontSize: '14px',
                    lineHeight: '1.6',
                  }}>
                    {aiDescription.long_description}
                  </div>
                </div>
              )}
              {aiPreviewTab === 'bullets' && (
                <div>
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>Bullet specs (5-7 điểm):</p>
                  <ul style={{
                    padding: '16px 16px 16px 32px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    fontSize: '14px',
                    lineHeight: '1.8',
                    margin: 0,
                  }}>
                    {aiDescription.bullet_specs.map((spec, idx) => (
                      <li key={idx}>{spec}</li>
                    ))}
                  </ul>
                </div>
              )}
              {aiPreviewTab === 'seo' && (
                <div>
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Meta Title (max 60 ký tự):</p>
                    <div style={{
                      padding: '12px 16px',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}>
                      {aiDescription.meta_title}
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Meta Description (max 155 ký tự):</p>
                    <div style={{
                      padding: '12px 16px',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}>
                      {aiDescription.meta_description}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #eee',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => { setShowAiPreview(false); setAiDescription(null); }}
                style={{
                  padding: '10px 20px',
                  background: '#f8f9fa',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleAcceptAiDescription}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Áp dụng mô tả chi tiết
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
