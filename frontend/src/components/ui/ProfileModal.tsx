import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import type { ChangeEvent } from "react";
import { useAuth } from "../../context/AuthContext";

function resizeImage(file: File, maxPx = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const ratio  = Math.min(maxPx / img.width, maxPx / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Could not load image")); };
    img.src = objectUrl;
  });
}

const AVATAR_COLORS = [
  "from-indigo-500 to-violet-600",
  "from-rose-500 to-pink-600",
  "from-green-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-blue-600",
];

interface Props {
  onClose: () => void;
}

export function ProfileModal({ onClose }: Props) {
  const { user, updateProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const meta        = user?.user_metadata as Record<string, unknown> | undefined;
  const initName    = (meta?.full_name    as string | undefined) ?? "";
  const initPhone   = (meta?.phone_number as string | undefined) ?? "";
  const initAvatar  = (meta?.avatar_url   as string | undefined) ?? "";

  const [name,     setName]     = useState(initName);
  const [phone,    setPhone]    = useState(initPhone);
  const [avatar,   setAvatar]   = useState(initAvatar);
  const [preview,  setPreview]  = useState(initAvatar);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [onClose]);

  const handleFile = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select an image file."); return; }
    try {
      const dataUrl = await resizeImage(file, 200);
      setAvatar(dataUrl);
      setPreview(dataUrl);
      setImgError(false);
    } catch {
      setError("Could not process image. Try another file.");
    }
  }, []);

  async function handleSave() {
    if (!name.trim()) { setError("Display name is required."); return; }
    setSaving(true); setError(null); setSuccess(false);
    try {
      await updateProfile({ fullName: name.trim(), phoneNumber: phone.trim(), avatarUrl: avatar });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile.");
    } finally { setSaving(false); }
  }

  function removeAvatar() {
    setAvatar("");
    setPreview("");
    setImgError(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  const initial      = (name || user?.email || "U").charAt(0).toUpperCase();
  const colorClass   = AVATAR_COLORS[(user?.email?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
  const showFallback = !preview || imgError;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/70 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[#181818] border border-[#2A2A2A] shadow-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A] bg-gradient-to-r from-red-950 to-[#181818] rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-red-900/30">
              <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-white">Edit Profile</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-[#222222] transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Avatar section */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {showFallback ? (
                <div className={`h-20 w-20 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white text-2xl font-bold shadow-md`}>
                  {initial}
                </div>
              ) : (
                <img
                  src={preview}
                  alt="Profile"
                  className="h-20 w-20 rounded-full object-cover shadow-md border-2 border-[#2A2A2A] ring-2 ring-red-900/30"
                  onError={() => setImgError(true)}
                />
              )}
              {/* Camera button overlay */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-red-600 text-white shadow-md flex items-center justify-center hover:bg-red-700 transition-colors border-2 border-[#181818]"
                title="Change photo"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-xs font-medium text-red-400 hover:text-red-300 hover:underline"
              >
                Upload photo
              </button>
              {!showFallback && (
                <>
                  <span className="text-[#2A2A2A]">|</span>
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="text-xs font-medium text-red-500 hover:text-red-400 hover:underline"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFile}
            />
            <p className="text-xs text-gray-500">JPG, PNG or GIF · max 5 MB</p>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Email</label>
            <div className="flex items-center gap-2 rounded-xl border border-[#2A2A2A] bg-[#111111] px-3 py-2.5">
              <svg className="h-4 w-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <span className="text-sm text-gray-400 truncate">{user?.email}</span>
              <span className="ml-auto text-xs text-gray-500 shrink-0">Read-only</span>
            </div>
          </div>

          {/* Display name */}
          <div>
            <label htmlFor="profile-name" className="block text-xs font-semibold text-gray-400 mb-1.5">
              Display Name <span className="text-red-400">*</span>
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="w-full rounded-xl border border-[#2A2A2A] bg-[#111111] px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
            />
          </div>

          {/* Phone number */}
          <div>
            <label htmlFor="profile-phone" className="block text-xs font-semibold text-gray-400 mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </div>
              <input
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+880 1700 000000"
                className="w-full rounded-xl border border-[#2A2A2A] bg-[#111111] pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Error / success */}
          {error && (
            <p className="text-sm text-red-400 bg-red-950/50 border border-red-800 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-400 bg-green-950/50 border border-green-800 rounded-xl px-3 py-2 flex items-center gap-2">
              <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              Profile saved!
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#2A2A2A]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#2A2A2A] px-4 py-2 text-sm font-medium text-gray-300 hover:bg-[#222222] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {saving ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving…
              </>
            ) : "Save Changes"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
