import { IFileStoragePort, IFileStorage } from "./ports/storage.port";
import { AzureBlobStorageAdapter } from "./adapters/azure-blob.adapter";

let instance: IFileStoragePort | null = null;

export function getStorageService(): IFileStorage {
  if (!instance) {
    instance = new AzureBlobStorageAdapter();
  }
  return instance;
}

export { type IFileStorage, type IFileStoragePort };
