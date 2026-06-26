import {
  getAllMembers,
  createMember,
  setMemberActive,
  setMemberRole,
  linkUserToMember,
  getMemberByUserId,
  type Member,
  type MemberRole,
} from "../repositories/memberRepository";

export async function listMembers(): Promise<Member[]> {
  return getAllMembers();
}

export async function addMember(name: string): Promise<Member> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("name must not be empty");
  if (trimmed.length > 100) throw new Error("name must be 100 characters or fewer");
  return createMember(trimmed);
}

export async function toggleMemberActive(id: string, active: boolean): Promise<Member> {
  if (!id) throw new Error("id is required");
  return setMemberActive(id, active);
}

export async function changeMemberRole(id: string, role: MemberRole): Promise<Member> {
  if (!id) throw new Error("id is required");
  if (role !== "admin" && role !== "member") throw new Error("role must be admin or member");
  return setMemberRole(id, role);
}

export async function linkMember(memberId: string, userId: string): Promise<Member> {
  if (!memberId || !userId) throw new Error("memberId and userId are required");
  return linkUserToMember(memberId, userId);
}

export async function getMemberForUser(userId: string): Promise<Member | null> {
  if (!userId) return null;
  return getMemberByUserId(userId);
}
