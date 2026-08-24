/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { supabasePublic, PHOTOS_BUCKET } from './supabaseClient';

export interface Photo {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  isFeatured: boolean;
  isPublished: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  exif?: {
    camera?: string;
    lens?: string;
    iso?: string;
    shutterSpeed?: string;
    aperture?: string;
    focalLength?: string;
  };
}

export interface Category {
  id: string;
  name: string;
  order?: number;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

class StorageManager {
  public isLocalMode: boolean = false;

  private cachedPhotos: Photo[] = [];
  private cachedCategories: Category[] = [];
  private cachedMessages: ContactSubmission[] = [];
  private cachedAboutPhotoUrl: string | null = null;

  async init(): Promise<void> {
    try {
      const res = await fetch('/api/get-db', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        this.cachedPhotos = data.photos || [];
        this.cachedCategories = data.categories?.length ? data.categories : this.getDefaultCategoriesFallback();
        this.cachedMessages = data.messages || [];
        this.cachedAboutPhotoUrl = data.aboutPhotoUrl ?? null;

        // Fast browser cache purely for snappy reloads — the server is the source of truth.
        localStorage.setItem('manx_cached_photos_admin', JSON.stringify(this.cachedPhotos));
        localStorage.setItem('manx_cached_photos_public', JSON.stringify(this.cachedPhotos.filter(p => p.isPublished)));
        localStorage.setItem('manx_cached_categories', JSON.stringify(this.cachedCategories));
        localStorage.setItem('manx_cached_messages', JSON.stringify(this.cachedMessages));
        if (this.cachedAboutPhotoUrl) {
          localStorage.setItem('manx_cached_about_photo', this.cachedAboutPhotoUrl);
        } else {
          localStorage.removeItem('manx_cached_about_photo');
        }
        this.isLocalMode = false;
        return;
      }
    } catch (err) {
      console.warn('StorageManager: Failed to fetch state from backend server. Using client cache fallback.', err);
    }

    this.isLocalMode = true;
    const cachedAdmin = localStorage.getItem('manx_cached_photos_admin');
    if (cachedAdmin) {
      try {
        this.cachedPhotos = JSON.parse(cachedAdmin);
      } catch (_) {
        this.cachedPhotos = [];
      }
    }

    const cachedCats = localStorage.getItem('manx_cached_categories');
    if (cachedCats) {
      try {
        this.cachedCategories = JSON.parse(cachedCats);
      } catch (_) {
        this.cachedCategories = this.getDefaultCategoriesFallback();
      }
    } else {
      this.cachedCategories = this.getDefaultCategoriesFallback();
    }

    const cachedMsgs = localStorage.getItem('manx_cached_messages');
    if (cachedMsgs) {
      try {
        this.cachedMessages = JSON.parse(cachedMsgs);
      } catch (_) {
        this.cachedMessages = [];
      }
    }

    this.cachedAboutPhotoUrl = localStorage.getItem('manx_cached_about_photo');
  }

  getDefaultCategoriesFallback(): Category[] {
    return [
      { id: 'cat_1', name: 'Landscapes', order: 1 },
      { id: 'cat_2', name: 'Automotive', order: 2 },
      { id: 'cat_3', name: 'Portraits', order: 3 },
      { id: 'cat_4', name: 'Commercial', order: 4 }
    ];
  }

  // Legacy URL upgrade helper (old AWS S3-hosted images, if any exist from before this rebuild)
  transformS3Url(url: string): string {
    if (!url) return url;
    const s3Regex = /\.amazonaws\.com\/(.+)$/;
    const match = url.match(s3Regex);
    if (match) {
      return `/api/image/${decodeURIComponent(match[1])}`;
    }
    return url;
  }

  // PORTFOLIO PHOTOS
  async getAllPhotos(isAdmin: boolean = false): Promise<Photo[]> {
    const photos = isAdmin ? this.cachedPhotos : this.cachedPhotos.filter(p => p.isPublished);
    return photos.map(p => ({ ...p, imageUrl: this.transformS3Url(p.imageUrl) }));
  }

  async savePhoto(photo: Photo): Promise<void> {
    const index = this.cachedPhotos.findIndex(p => p.id === photo.id);
    const now = new Date().toISOString();
    const updatedPhoto = { ...photo };

    if (index === -1) {
      updatedPhoto.createdAt = now;
      updatedPhoto.updatedAt = now;
      this.cachedPhotos.push(updatedPhoto);
    } else {
      updatedPhoto.createdAt = this.cachedPhotos[index].createdAt || now;
      updatedPhoto.updatedAt = now;
      this.cachedPhotos[index] = updatedPhoto;
    }

    this.cachedPhotos.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    try {
      localStorage.setItem('manx_cached_photos_admin', JSON.stringify(this.cachedPhotos));
      localStorage.setItem('manx_cached_photos_public', JSON.stringify(this.cachedPhotos.filter(p => p.isPublished)));
    } catch (e) {}

    await this.syncToBackend();
  }

  async deletePhoto(id: string): Promise<void> {
    const photoToDelete = this.cachedPhotos.find(p => p.id === id);

    if (photoToDelete?.imageUrl && !photoToDelete.imageUrl.startsWith('data:')) {
      fetch('/api/delete-file', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: photoToDelete.imageUrl })
      }).catch(err => console.warn('Failed to delete original storage file:', err));
    }

    this.cachedPhotos = this.cachedPhotos.filter(p => p.id !== id);

    try {
      localStorage.setItem('manx_cached_photos_admin', JSON.stringify(this.cachedPhotos));
      localStorage.setItem('manx_cached_photos_public', JSON.stringify(this.cachedPhotos.filter(p => p.isPublished)));
    } catch (e) {}

    await this.syncToBackend();
  }

  // CATEGORIES / ALBUMS
  async getAllCategories(): Promise<Category[]> {
    if (this.cachedCategories.length === 0) {
      this.cachedCategories = this.getDefaultCategoriesFallback();
    }
    return this.cachedCategories;
  }

  async saveCategory(category: Category): Promise<void> {
    const index = this.cachedCategories.findIndex(c => c.id === category.id);
    if (index === -1) {
      this.cachedCategories.push(category);
    } else {
      this.cachedCategories[index] = category;
    }

    this.cachedCategories.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    localStorage.setItem('manx_cached_categories', JSON.stringify(this.cachedCategories));

    await this.syncToBackend();
  }

  async deleteCategory(id: string): Promise<void> {
    this.cachedCategories = this.cachedCategories.filter(c => c.id !== id);
    localStorage.setItem('manx_cached_categories', JSON.stringify(this.cachedCategories));

    await this.syncToBackend();
  }

  // CONTACT SUBMISSIONS

  async getAllMessages(): Promise<ContactSubmission[]> {
    return this.cachedMessages;
  }

  /** Public: called from the contact form. Does NOT require admin login. */
  async submitContactMessage(msg: Omit<ContactSubmission, 'id' | 'isRead'>): Promise<void> {
    const res = await fetch('/api/submit-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit message.');
    }
  }

  /** Admin only: mark a message as read. */
  async markMessageRead(id: string): Promise<void> {
    const index = this.cachedMessages.findIndex(m => m.id === id);
    if (index !== -1) {
      this.cachedMessages[index] = { ...this.cachedMessages[index], isRead: true };
    }
    localStorage.setItem('manx_cached_messages', JSON.stringify(this.cachedMessages));
    await this.syncToBackend();
  }

  /** Admin only. */
  async deleteMessage(id: string): Promise<void> {
    this.cachedMessages = this.cachedMessages.filter(m => m.id !== id);
    localStorage.setItem('manx_cached_messages', JSON.stringify(this.cachedMessages));
    await this.syncToBackend();
  }

  // ABOUT PAGE PORTRAIT PHOTO
  getAboutPhoto(): string | null {
    return this.cachedAboutPhotoUrl;
  }

  /** Admin only. */
  async saveAboutPhoto(url: string | null): Promise<void> {
    this.cachedAboutPhotoUrl = url;
    if (url) {
      localStorage.setItem('manx_cached_about_photo', url);
    } else {
      localStorage.removeItem('manx_cached_about_photo');
    }
    await this.syncToBackend();
  }

  // Full-state sync — admin actions only (server rejects this without a valid session cookie).
  private async syncToBackend(): Promise<void> {
    try {
      const res = await fetch('/api/save-db', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photos: this.cachedPhotos,
          categories: this.cachedCategories,
          messages: this.cachedMessages,
          aboutPhotoUrl: this.cachedAboutPhotoUrl
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.warn('StorageManager: Backend rejected sync:', err.error);
      }
    } catch (err) {
      console.warn('StorageManager: Failed to sync current state to server:', err);
    }
  }

  // IMAGE UPLOADS (Supabase Storage, via a signed URL our own admin-gated API issues)
  async uploadImage(fileData: File | string, filename?: string): Promise<string> {
    try {
      let file: File | Blob;
      let name = filename || 'image.jpg';
      let type = 'image/jpeg';

      if (typeof fileData === 'string' && fileData.startsWith('data:')) {
        const response = await fetch(fileData);
        file = await response.blob();
        const mimeMatch = fileData.match(/^data:([^;]+);/);
        if (mimeMatch) {
          type = mimeMatch[1];
        }
      } else {
        file = fileData as File;
        name = (file as any).name || name;
        type = (file as any).type || type;
      }

      if (!supabasePublic) {
        throw new Error('Storage is not configured (missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).');
      }

      // 1. Ask our admin-gated API for a signed upload slot.
      const apiRes = await fetch(`/api/upload-url?filename=${encodeURIComponent(name)}`, {
        credentials: 'include'
      });
      if (!apiRes.ok) {
        const errDetails = await apiRes.json().catch(() => ({}));
        throw new Error(errDetails.error || `Failed to fetch upload URL: ${apiRes.statusText}`);
      }
      const { token, downloadUrl, path } = await apiRes.json();

      // 2. Upload directly to Supabase Storage using that signed token.
      const { error } = await supabasePublic.storage.from(PHOTOS_BUCKET).uploadToSignedUrl(path, token, file, {
        contentType: type
      });
      if (error) {
        throw new Error(error.message);
      }

      return downloadUrl;
    } catch (err) {
      console.warn('Storage upload failed, falling back to embedded base64:', err);
      if (typeof fileData === 'string') {
        return fileData;
      } else {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(fileData as File);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });
      }
    }
  }
}

export const storage = new StorageManager();
