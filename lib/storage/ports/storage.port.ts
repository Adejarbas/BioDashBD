export interface UploadUrlResult {
  uploadUrl: string;
  key: string;
  publicUrl?: string;
  expiresInSeconds?: number;
}

export interface DownloadUrlResult {
  downloadUrl: string;
  key: string;
  expiresInSeconds?: number;
}

export interface IFileStoragePort {
  readonly providerName: string;
  generateUploadUrl(fileName: string, contentType: string, userId: string): Promise<UploadUrlResult>;
  generateDownloadUrl(key: string, expiresInSeconds?: number): Promise<DownloadUrlResult>;
  deleteFile(key: string): Promise<boolean>;
}

export type IFileStorage = IFileStoragePort;
