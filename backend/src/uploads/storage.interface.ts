export interface UploadableFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface StoredFileResult {
  storagePath: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
}

export interface FileStreamResult {
  stream: NodeJS.ReadableStream;
  contentType: string;
  contentLength?: number;
}
