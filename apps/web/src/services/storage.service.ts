import { api } from '../api/client';

export interface StorageUploadResponse {
  success: boolean;
  storage: 'cloudflare_r2' | 'local_fallback';
  url: string;
  key: string;
  filename: string;
  size: number;
  notice?: string;
}

export interface R2ConfigDto {
  accountId?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucketName?: string;
  publicDomain?: string;
}

export const storageService = {
  async uploadFile(file: File, folder = 'products'): Promise<StorageUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const res = await api.post<StorageUploadResponse>('/storage/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async getStatus(): Promise<{
    isConfigured: boolean;
    accountId: string;
    bucketName: string;
    publicDomain: string;
  }> {
    const res = await api.get('/storage/status');
    return res.data;
  },

  async testConnection(config: R2ConfigDto): Promise<{ success: boolean; message: string }> {
    const res = await api.post('/storage/test', config);
    return res.data;
  },

  async saveConfig(config: R2ConfigDto): Promise<any> {
    const res = await api.post('/storage/config', config);
    return res.data;
  },
};
