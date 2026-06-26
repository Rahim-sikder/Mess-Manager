import { supabase } from "../lib/supabase";

export type MemberRole = "admin" | "member";

export interface ActiveMember {
  id: string;
  name: string;
}

export interface Member extends ActiveMember {
  active:  boolean;
  role:    MemberRole;
  userId:  string | null;
}

const SELECT_FIELDS = "id, name, active, role, user_id";

function toMember(row: Record<string, unknown>): Member {
  return {
    id:     row.id as string,
    name:   row.name as string,
    active: row.active as boolean,
    role:   (row.role as MemberRole) ?? "member",
    userId: (row.user_id as string | null) ?? null,
  };
}

export async function getActiveMembersForMonth(
  _month: number,
  _year:  number
): Promise<ActiveMember[]> {
  const { data, error } = await supabase
    .from("members")
    .select("id, name")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) throw new Error(`getActiveMembersForMonth: ${error.message}`);
  return (data ?? []) as ActiveMember[];
}

export async function getAllMembers(): Promise<Member[]> {
  const { data, error } = await supabase
    .from("members")
    .select(SELECT_FIELDS)
    .order("name", { ascending: true });

  if (error) throw new Error(`getAllMembers: ${error.message}`);
  return (data ?? []).map(toMember);
}

export async function createMember(name: string): Promise<Member> {
  const { data, error } = await supabase
    .from("members")
    .insert({ name })
    .select(SELECT_FIELDS)
    .single();

  if (error) throw new Error(`createMember: ${error.message}`);
  return toMember(data as Record<string, unknown>);
}

export async function setMemberActive(id: string, active: boolean): Promise<Member> {
  const { data, error } = await supabase
    .from("members")
    .update({ active })
    .eq("id", id)
    .select(SELECT_FIELDS)
    .single();

  if (error) throw new Error(`setMemberActive: ${error.message}`);
  return toMember(data as Record<string, unknown>);
}

export async function setMemberRole(id: string, role: MemberRole): Promise<Member> {
  const { data, error } = await supabase
    .from("members")
    .update({ role })
    .eq("id", id)
    .select(SELECT_FIELDS)
    .single();

  if (error) throw new Error(`setMemberRole: ${error.message}`);
  return toMember(data as Record<string, unknown>);
}

export async function linkUserToMember(memberId: string, userId: string): Promise<Member> {
  // Clear any previous link for this userId first
  await supabase
    .from("members")
    .update({ user_id: null })
    .eq("user_id", userId);

  const { data, error } = await supabase
    .from("members")
    .update({ user_id: userId })
    .eq("id", memberId)
    .select(SELECT_FIELDS)
    .single();

  if (error) throw new Error(`linkUserToMember: ${error.message}`);
  return toMember(data as Record<string, unknown>);
}

export async function getMemberByUserId(userId: string): Promise<Member | null> {
  const { data, error } = await supabase
    .from("members")
    .select(SELECT_FIELDS)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(`getMemberByUserId: ${error.message}`);
  return data ? toMember(data as Record<string, unknown>) : null;
}
