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
      console.warn(
        "[AzureBlobStorage] Nenhuma credencial do Azure Storage configurada (AZURE_STORAGE_CONNECTION_STRING ou AZURE_STORAGE_ACCOUNT_NAME + AZURE_STORAGE_ACCOUNT_KEY). O serviço de upload funcionará em modo fallback."
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
    userId: string
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

    return {
      uploadUrl,
      key,
      publicUrl: blockBlobClient.url,
      expiresInSeconds,
    };
  }

  async generateDownloadUrl(
    key: string,
    expiresInSeconds = 3600
  ): Promise<DownloadUrlResult> {
    const containerClient = this.getContainerClient();
    const blockBlobClient = containerClient.getBlockBlobClient(key);

    const expiresOn = new Date(Date.now() + expiresInSeconds * 1000);

    const downloadUrl = await blockBlobClient.generateSasUrl({
      permissions: BlobSASPermissions.parse("r"), // Read
      expiresOn,
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
      return res.succeeded;
    } catch (error) {
      console.error("[AzureBlobStorage] Erro ao deletar arquivo:", error);
      return false;
    }
  }
}
