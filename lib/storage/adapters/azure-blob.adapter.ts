import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  BlobSASPermissions,
} from "@azure/storage-blob";
import {
  IFileStoragePort,
  UploadUrlResult,
  DownloadUrlResult,
} from "../ports/storage.port";
import logger from "@/lib/logger-winston";

export class AzureBlobStorageAdapter implements IFileStoragePort {
  readonly providerName = "azure-blob";
  private blobServiceClient: BlobServiceClient | null = null;
  private containerName: string;

  constructor() {
    this.containerName =
      process.env.AZURE_STORAGE_CONTAINER_NAME || "biogen-avatars";
    this.initClient();
  }

  private initClient(): void {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

    if (connectionString) {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    } else if (accountName && accountKey) {
      const credential = new StorageSharedKeyCredential(accountName, accountKey);
      this.blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        credential
      );
    } else {
      logger.warn(
        "Nenhuma credencial do Azure Storage configurada. O serviço de upload funcionará em modo fallback",
        { storageProvider: "azure", container: this.containerName }
      );
    }
  }

  private getContainerClient() {
    if (!this.blobServiceClient) {
      this.initClient();
    }
    if (!this.blobServiceClient) {
      throw new Error(
        "Azure Blob Storage não está configurado. Defina AZURE_STORAGE_CONNECTION_STRING ou AZURE_STORAGE_ACCOUNT_NAME e AZURE_STORAGE_ACCOUNT_KEY nas variáveis de ambiente."
      );
    }
    return this.blobServiceClient.getContainerClient(this.containerName);
  }

  async generateUploadUrl(
    fileName: string,
    contentType: string,
    userId: string,
    _baseUrl?: string
  ): Promise<UploadUrlResult> {
    const containerClient = this.getContainerClient();

    // Sanitiza e formata a chave do arquivo
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = sanitizedFileName.startsWith(`${userId}/`)
      ? sanitizedFileName
      : `${userId}/${sanitizedFileName}`;

    const blockBlobClient = containerClient.getBlockBlobClient(key);

    const expiresInSeconds = 900; // 15 minutos
    const expiresOn = new Date(Date.now() + expiresInSeconds * 1000);

    const uploadUrl = await blockBlobClient.generateSasUrl({
      permissions: BlobSASPermissions.parse("cw"), // Create + Write
      expiresOn,
      contentType: contentType || "application/octet-stream",
    });

    logger.info("SAS token gerado com sucesso para avatar", {
      operation: "upload",
      userId,
      key,
      contentType: contentType || "application/octet-stream",
      expiresInSeconds,
      storageProvider: "azure",
      container: this.containerName,
    });

    return {
      uploadUrl,
      key,
      publicUrl: blockBlobClient.url,
      expiresInSeconds,
    };
  }

  async generateDownloadUrl(
    key: string,
    expiresInSeconds = 3600,
    _baseUrl?: string
  ): Promise<DownloadUrlResult> {
    const containerClient = this.getContainerClient();
    const blockBlobClient = containerClient.getBlockBlobClient(key);

    const expiresOn = new Date(Date.now() + expiresInSeconds * 1000);

    const downloadUrl = await blockBlobClient.generateSasUrl({
      permissions: BlobSASPermissions.parse("r"), // Read
      expiresOn,
    });

    logger.info("SAS token gerado com sucesso para download de avatar", {
      operation: "download",
      key,
      expiresInSeconds,
      storageProvider: "azure",
      container: this.containerName,
    });

    return {
      downloadUrl,
      key,
      expiresInSeconds,
    };
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      const containerClient = this.getContainerClient();
      const blockBlobClient = containerClient.getBlockBlobClient(key);
      const res = await blockBlobClient.deleteIfExists();
      logger.info("Arquivo removido no Azure Blob Storage", {
        operation: "delete",
        key,
        succeeded: res.succeeded,
        storageProvider: "azure",
      });
      return res.succeeded;
    } catch (error: any) {
      logger.error("Erro ao deletar arquivo no Azure Blob Storage", {
        operation: "delete",
        key,
        storageProvider: "azure",
        error: error?.message || String(error),
      });
      return false;
    }
  }
}
