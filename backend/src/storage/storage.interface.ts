export interface IStorageService {
  saveFile(file: Buffer, filename: string, subfolder?: string): Promise<string>;
  deleteFile(filePath: string): Promise<void>;
  getFileUrl(filePath: string): string;
}

