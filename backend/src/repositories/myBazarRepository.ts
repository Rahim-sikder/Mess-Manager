import { supabase } from "../lib/supabase";

export interface MyBazarProduct {
  id: string;
  entryId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  sortOrder: number;
  createdAt: string;
}

export interface MyBazarEntry {
  id:         string;
  userId:     string;
  memberId:   string | null;
  memberName: string | null;
  date:       string;
  note:       string | null;
  grandTotal: number;
  createdAt:  string;
  updatedAt:  string;
  products:   MyBazarProduct[];
}

export interface ProductPayload {
  productName: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  totalPrice: number;
}

export interface MyBazarPayload {
  userId: string;
  memberId?: string | null;
  date: string;
  note?: string;
  grandTotal: number;
  products: ProductPayload[];
}

function toProduct(row: Record<string, unknown>): MyBazarProduct {
  return {
    id:          row.id as string,
    entryId:     row.entry_id as string,
    productName: row.product_name as string,
    quantity:    Number(row.quantity),
    unit:        (row.unit as string) ?? "",
    unitPrice:   Number(row.unit_price),
    totalPrice:  Number(row.total_price),
    sortOrder:   Number(row.sort_order),
    createdAt:   row.created_at as string,
  };
}

function toEntry(row: Record<string, unknown>, products: MyBazarProduct[], memberName?: string | null): MyBazarEntry {
  return {
    id:         row.id as string,
    userId:     row.user_id as string,
    memberId:   (row.member_id as string | null) ?? null,
    memberName: memberName ?? null,
    date:       row.date as string,
    note:       (row.note as string | null) ?? null,
    grandTotal: Number(row.grand_total),
    createdAt:  row.created_at as string,
    updatedAt:  row.updated_at as string,
    products,
  };
}

async function attachProducts(entries: Record<string, unknown>[]): Promise<MyBazarEntry[]> {
  if (!entries.length) return [];

  const entryIds = entries.map((e) => e.id as string);

  // Fetch products
  const { data: products, error: pe } = await supabase
    .from("my_bazar_products")
    .select("*")
    .in("entry_id", entryIds)
    .order("sort_order", { ascending: true });
  if (pe) throw new Error(`fetchProducts: ${pe.message}`);

  const byEntry: Record<string, MyBazarProduct[]> = {};
  for (const p of (products ?? []) as Record<string, unknown>[]) {
    const pid = p.entry_id as string;
    if (!byEntry[pid]) byEntry[pid] = [];
    byEntry[pid].push(toProduct(p));
  }

  // Fetch member names for entries that have member_id
  const memberIds = [...new Set(entries.map((e) => e.member_id as string | null).filter(Boolean))] as string[];
  const memberNameById: Record<string, string> = {};
  if (memberIds.length) {
    const { data: members } = await supabase
      .from("members")
      .select("id, name")
      .in("id", memberIds);
    for (const m of (members ?? []) as Record<string, unknown>[]) {
      memberNameById[m.id as string] = m.name as string;
    }
  }

  // Fetch auth user names for entries NOT linked to a member (fallback display name)
  const unlinkedUserIds = [
    ...new Set(entries.filter((e) => !e.member_id).map((e) => e.user_id as string)),
  ];
  const authNameById: Record<string, string> = {};
  if (unlinkedUserIds.length) {
    const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    for (const u of authData?.users ?? []) {
      if (unlinkedUserIds.includes(u.id)) {
        const meta = u.user_metadata as Record<string, unknown>;
        const full  = meta?.full_name as string | undefined;
        authNameById[u.id] = full ?? u.email?.split("@")[0] ?? "User";
      }
    }
  }

  return entries.map((e) => {
    const mid  = e.member_id as string | null;
    const uid  = e.user_id   as string;
    const name = mid ? (memberNameById[mid] ?? null) : (authNameById[uid] ?? null);
    return toEntry(e, byEntry[e.id as string] ?? [], name);
  });
}

export async function getMyBazarEntries(userId: string): Promise<MyBazarEntry[]> {
  const { data, error } = await supabase
    .from("my_bazar_entries")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (error) throw new Error(`getMyBazarEntries: ${error.message}`);
  return attachProducts((data ?? []) as Record<string, unknown>[]);
}

export async function getAllMyBazarEntries(): Promise<MyBazarEntry[]> {
  const { data, error } = await supabase
    .from("my_bazar_entries")
    .select("*")
    .order("date", { ascending: false });

  if (error) throw new Error(`getAllMyBazarEntries: ${error.message}`);
  return attachProducts((data ?? []) as Record<string, unknown>[]);
}

export async function createMyBazarEntry(payload: MyBazarPayload): Promise<MyBazarEntry> {
  const { data: entry, error } = await supabase
    .from("my_bazar_entries")
    .insert({
      user_id:     payload.userId,
      member_id:   payload.memberId ?? null,
      date:        payload.date,
      note:        payload.note ?? null,
      grand_total: payload.grandTotal,
    })
    .select()
    .single();

  if (error) throw new Error(`createMyBazarEntry: ${error.message}`);

  const rows = payload.products.map((p, i) => ({
    entry_id:     (entry as Record<string, unknown>).id,
    product_name: p.productName,
    quantity:     p.quantity,
    unit:         p.unit ?? "",
    unit_price:   p.unitPrice,
    total_price:  p.totalPrice,
    sort_order:   i,
  }));

  const { data: products, error: pe } = await supabase
    .from("my_bazar_products")
    .insert(rows)
    .select();

  if (pe) throw new Error(`insertProducts: ${pe.message}`);

  return toEntry(
    entry as Record<string, unknown>,
    ((products ?? []) as Record<string, unknown>[]).map(toProduct)
  );
}

export async function updateMyBazarEntry(id: string, payload: MyBazarPayload): Promise<MyBazarEntry> {
  const { data: entry, error } = await supabase
    .from("my_bazar_entries")
    .update({
      date:        payload.date,
      note:        payload.note ?? null,
      grand_total: payload.grandTotal,
      updated_at:  new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`updateMyBazarEntry: ${error.message}`);

  // Replace products: delete old, insert new
  const { error: de } = await supabase.from("my_bazar_products").delete().eq("entry_id", id);
  if (de) throw new Error(`deleteOldProducts: ${de.message}`);

  const rows = payload.products.map((p, i) => ({
    entry_id:     id,
    product_name: p.productName,
    quantity:     p.quantity,
    unit:         p.unit ?? "",
    unit_price:   p.unitPrice,
    total_price:  p.totalPrice,
    sort_order:   i,
  }));

  const { data: products, error: pe } = await supabase
    .from("my_bazar_products")
    .insert(rows)
    .select();

  if (pe) throw new Error(`reinsertProducts: ${pe.message}`);

  return toEntry(
    entry as Record<string, unknown>,
    ((products ?? []) as Record<string, unknown>[]).map(toProduct)
  );
}

export async function deleteMyBazarEntry(id: string): Promise<void> {
  const { error } = await supabase.from("my_bazar_entries").delete().eq("id", id);
  if (error) throw new Error(`deleteMyBazarEntry: ${error.message}`);
}
