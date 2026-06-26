import {
  getMyBazarEntries, getAllMyBazarEntries, createMyBazarEntry,
  updateMyBazarEntry, deleteMyBazarEntry, type MyBazarPayload,
} from "../repositories/myBazarRepository";

export const listMyBazarEntries  = (userId: string) => getMyBazarEntries(userId);
export const listAllMyBazarEntries = () => getAllMyBazarEntries();
export const makeMyBazarEntry    = (payload: MyBazarPayload) => createMyBazarEntry(payload);
export const editMyBazarEntry    = (id: string, payload: MyBazarPayload) => updateMyBazarEntry(id, payload);
export const removeMyBazarEntry  = (id: string) => deleteMyBazarEntry(id);
