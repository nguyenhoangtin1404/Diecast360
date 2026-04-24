import { apiClient } from './client';
import type { ApiResponse } from '../types/category';
import type {
  AdjustPointsResult,
  Member,
  MemberLedgerEntry,
  MemberPointsMutationType,
  MemberTier,
  Pagination,
} from '../types/member';

type MembersListPayload = {
  members: Member[];
  pagination: Pagination;
};

type MemberPayload = {
  member: Member;
};

type LedgerPayload = {
  entries: MemberLedgerEntry[];
  pagination: Pagination;
};

export async function fetchMembers(options?: { keyword?: string; page?: number; pageSize?: number }) {
  const params = new URLSearchParams();
  if (options?.keyword?.trim()) params.set('keyword', options.keyword.trim());
  if (options?.page != null) params.set('page', String(options.page));
  if (options?.pageSize != null) params.set('page_size', String(options.pageSize));
  const qs = params.toString();
  const response = (await apiClient.get(qs ? `/members?${qs}` : '/members')) as ApiResponse<MembersListPayload>;
  return response.data;
}

export async function fetchMemberLedger(memberId: string, options?: { page?: number; pageSize?: number }) {
  const params = new URLSearchParams();
  if (options?.page != null) params.set('page', String(options.page));
  if (options?.pageSize != null) params.set('page_size', String(options.pageSize));
  const suffix = params.toString() ? `?${params.toString()}` : '';
  const response = (await apiClient.get(`/members/${memberId}/ledger${suffix}`)) as ApiResponse<LedgerPayload>;
  return response.data;
}

export async function fetchMemberTiers() {
  const response = (await apiClient.get('/members/tiers')) as ApiResponse<{ tiers: MemberTier[] }>;
  return response.data.tiers;
}

export async function createMemberTier(payload: { name: string; rank: number; min_points: number }) {
  const response = (await apiClient.post('/members/tiers', payload)) as ApiResponse<{ tier: MemberTier }>;
  return response.data.tier;
}

export async function updateMemberTier(
  tierId: string,
  payload: Partial<{ name: string; rank: number; min_points: number }>,
) {
  const response = (await apiClient.patch(`/members/tiers/${tierId}`, payload)) as ApiResponse<{ tier: MemberTier }>;
  return response.data.tier;
}

export async function deleteMemberTier(tierId: string) {
  const response = (await apiClient.delete(`/members/tiers/${tierId}`)) as ApiResponse<{ ok: true }>;
  return response.data.ok;
}

export async function createMember(payload: { full_name: string; email?: string; phone?: string }) {
  const response = (await apiClient.post('/members', payload)) as ApiResponse<MemberPayload>;
  return response.data.member;
}

export async function updateMember(
  memberId: string,
  payload: Partial<{ full_name: string; email: string | null; phone: string | null }>,
) {
  const response = (await apiClient.patch(`/members/${memberId}`, payload)) as ApiResponse<MemberPayload>;
  return response.data.member;
}

export async function deleteMember(memberId: string) {
  const response = (await apiClient.delete(`/members/${memberId}`)) as ApiResponse<{ ok: true }>;
  return response.data.ok;
}

export async function adjustMemberPoints(
  memberId: string,
  payload: { type: MemberPointsMutationType; points: number; reason: string; note?: string },
): Promise<AdjustPointsResult> {
  const response = (await apiClient.post(
    `/members/${memberId}/points-adjustments`,
    payload,
  )) as ApiResponse<AdjustPointsResult>;
  return response.data;
}
