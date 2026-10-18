import { IFileStoragePort, IFileStorage } from "./ports/storage.port";
import { AzureBlobStorageAdapter } from "./adapters/azure-blob.adapter";
import { LocalStorageAdapter } from "./adapters/local-storage.adapter";

let instance: IFileStoragePort | null = null;

export function getStorageService(): IFileStorage {
  if (!instance) {
    const provider = (process.env.STORAGE_PROVIDER || "").toLowerCase().trim();

    if (provider === "azure") {
      const hasAzureCredentials = Boolean(
        process.env.AZURE_STORAGE_CONNECTION_STRING ||
          (process.env.AZURE_STORAGE_ACCOUNT_NAME && process.env.AZURE_STORAGE_ACCOUNT_KEY)
      );

      if (hasAzureCredentials) {
        console.log(
          "ℹ️ [StorageFactory] Provedor 'azure' configurado. Utilizando AzureBlobStorageAdapter."
        );
        instance = new AzureBlobStorageAdapter();
      } else {
        console.error(
          "🔴 [StorageFactory] Provedor configurado como 'azure', porém as credenciais necessárias (AZURE_STORAGE_CONNECTION_STRING ou AZURE_STORAGE_ACCOUNT_NAME + AZURE_STORAGE_ACCOUNT_KEY) não estão definidas. Utilizando LocalStorageAdapter como fallback."
        );
        instance = new LocalStorageAdapter();
      }
    } else if (provider === "local") {
      console.log(
        "ℹ️ [StorageFactory] Provedor 'local' configurado. Utilizando LocalStorageAdapter."
      );
      instance = new LocalStorageAdapter();
    } else {
      // Se STORAGE_PROVIDER não foi informado explicitamente:
      const hasAzureCredentials = Boolean(
        process.env.AZURE_STORAGE_CONNECTION_STRING ||
          (process.env.AZURE_STORAGE_ACCOUNT_NAME && process.env.AZURE_STORAGE_ACCOUNT_KEY)
      );

      if (hasAzureCredentials) {
        console.log(
          "ℹ️ [StorageFactory] Credenciais do Azure detectadas. Utilizando AzureBlobStorageAdapter."
        );
        instance = new AzureBlobStorageAdapter();
      } else {
        console.log(
          "ℹ️ [StorageFactory] Nenhuma credencial do Azure detectada. Utilizando LocalStorageAdapter."
        );
        instance = new LocalStorageAdapter();
      }
    }
  }
  return instance;
}

export { type IFileStorage, type IFileStoragePort };
