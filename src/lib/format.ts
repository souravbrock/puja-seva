export const ADMIN_EMAIL = 'souravbrock@gmail.com';
export const inr = (n: number | string | null | undefined): string => {
  const v = Number(n || 0);
  return '\u20B9' + v.toLocaleString('en-IN');
};
export const fmtDate = (s: string | null | undefined): string => {
  if (!s) return '-';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
export const fmtDateTime = (s: string | null | undefined): string => {
  if (!s) return '-';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
};
export function timeParts(target: string | null | undefined, now: number) {
  if (!target) return { d: 0, h: 0, m: 0, s: 0, past: true };
  const diff = new Date(target).getTime() - now;
  if (isNaN(diff) || diff <= 0) return { d: 0, h: 0, m: 0, s: 0, past: true };
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s, past: false };
}
export const initials = (name: string | null | undefined): string => {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
};
import { apiGet as get, apiSend as send } from './api';

export async function apiGet(path: string) {
  return get(path);
}
export async function apiSend(path: string, method: string, body?: any) {
  return send(path, method, body);
}
export function resizeImage(file: File, maxDim = 1200, quality = 0.82): Promise<{ base64: string; contentType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      try {
        let w = img.width; let h = img.height;
        const scale = Math.min(1, maxDim / Math.max(w, h));
        w = Math.round(w * scale); h = Math.round(h * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas not supported');
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(objectUrl);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({ base64: dataUrl.split(',')[1], contentType: 'image/jpeg' });
      } catch (e) { reject(e); }
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Could not read image')); };
    img.src = objectUrl;
  });
}
export async function uploadPhoto(file: File, bucket = 'purohit-photos'): Promise<string> {
  // High-quality source (1600px, JPEG q0.92); the server converts to WebP
  // near-lossless (q90) before storing, and returns the .webp URL.
  const { base64, contentType } = await resizeImage(file, 1600, 0.92);
  const base = file.name.replace(/\.[^.]+$/, '') || 'photo';
  const data = await apiSend('/api/upload', 'POST', { fileName: `${base}.jpg`, fileBase64: base64, contentType, bucket });
  return data.url as string;
}
