export interface IStorageService {
  saveFile(file: Buffer, filename: string, subfolder?: string): Promise<string>;
  deleteFile(filePath: string): Promise<void>;
  moveFile(currentPath: string, newFilename: string, destinationSubfolder: string): Promise<string>;
  getFileUrl(filePath: string): string;
}

