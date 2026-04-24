import { apiClient } from './client';
import type { ApiResponse } from '../types/category';
import type { Member, MemberLedgerEntry, MemberTier, Pagination } from '../types/member';

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

export async function fetchMembers(keyword?: string) {
  const params = new URLSearchParams();
  if (keyword?.trim()) params.set('keyword', keyword.trim());
  const response = (await apiClient.get(`/members?${params.toString()}`)) as ApiResponse<MembersListPayload>;
  return response.data;
}

export async function fetchMemberLedger(memberId: string) {
  const response = (await apiClient.get(`/members/${memberId}/ledger`)) as ApiResponse<LedgerPayload>;
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

export async function adjustMemberPoints(
  memberId: string,
  payload: { type: 'earn' | 'redeem' | 'adjust'; points: number; reason: string; note?: string },
) {
  const response = (await apiClient.post(`/members/${memberId}/points-adjustments`, payload)) as ApiResponse<{
    member: Member;
  }>;
  return response.data.member;
}
