import { IFileStoragePort, IFileStorage } from "./ports/storage.port";
import { AzureBlobStorageAdapter } from "./adapters/azure-blob.adapter";
import { LocalStorageAdapter } from "./adapters/local-storage.adapter";
import logger from "@/lib/logger-winston";

let instance: IFileStoragePort | null = null;

export function getStorageService(): IFileStorage {
  if (!instance) {
    const provider = (process.env.STORAGE_PROVIDER || "").toLowerCase().trim();
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "biogen-avatars";

    if (provider === "azure") {
      const hasAzureCredentials = Boolean(
        process.env.AZURE_STORAGE_CONNECTION_STRING ||
          (process.env.AZURE_STORAGE_ACCOUNT_NAME && process.env.AZURE_STORAGE_ACCOUNT_KEY)
      );

      if (hasAzureCredentials) {
        logger.info("StorageFactory inicializado com AzureBlobStorageAdapter", {
          storageProvider: "azure",
          containerName,
        });
        instance = new AzureBlobStorageAdapter();
      } else {
        logger.warn(
          "Provedor configurado como 'azure', mas sem credenciais definidas. Utilizando LocalStorageAdapter como fallback",
          { storageProvider: "local", requestedProvider: "azure" }
        );
        instance = new LocalStorageAdapter();
      }
    } else if (provider === "local") {
      logger.info("StorageFactory inicializado com LocalStorageAdapter", {
        storageProvider: "local",
      });
      instance = new LocalStorageAdapter();
    } else {
      // Se STORAGE_PROVIDER não foi informado explicitamente:
      const hasAzureCredentials = Boolean(
        process.env.AZURE_STORAGE_CONNECTION_STRING ||
          (process.env.AZURE_STORAGE_ACCOUNT_NAME && process.env.AZURE_STORAGE_ACCOUNT_KEY)
      );

      if (hasAzureCredentials) {
        logger.info("Credenciais Azure Storage detectadas. Utilizando AzureBlobStorageAdapter", {
          storageProvider: "azure",
          containerName,
        });
        instance = new AzureBlobStorageAdapter();
      } else {
        logger.info("Nenhuma credencial Azure detectada. Utilizando LocalStorageAdapter", {
          storageProvider: "local",
        });
        instance = new LocalStorageAdapter();
      }
    }
  }
  return instance;
}

export { type IFileStorage, type IFileStoragePort };
