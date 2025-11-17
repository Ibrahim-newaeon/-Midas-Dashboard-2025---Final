import axios, { AxiosInstance } from 'axios';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  FileUpload,
  FileUploadStatus,
  ImportType,
  FileData,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  FieldMapping,
  ImportResult,
  ApiResponse,
  ApiError,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const MAX_FILE_SIZE = parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '10485760'); // 10MB
const ALLOWED_FILE_TYPES = (import.meta.env.VITE_ALLOWED_FILE_TYPES || 'csv,xlsx,xls,json').split(',');

export class FileUploadService {
  private client: AxiosInstance;
  private uploads: Map<string, FileUpload> = new Map();

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/uploads`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // ==================== FILE UPLOAD ====================

  async uploadFile(
    file: File,
    importType: ImportType,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<FileUpload>> {
    try {
      // Validate file
      this.validateFile(file);

      // Create upload record
      const uploadId = this.generateUploadId();
      const upload: FileUpload = {
        id: uploadId,
        name: file.name,
        size: file.size,
        type: file.type,
        status: FileUploadStatus.PENDING,
        progress: 0,
        importType,
        userId: this.getCurrentUserId(),
        uploadedAt: new Date(),
      };

      this.uploads.set(uploadId, upload);

      // Update status to uploading
      this.updateUploadStatus(uploadId, FileUploadStatus.UPLOADING);

      // Parse file
      const fileData = await this.parseFile(file, (progress) => {
        this.updateUploadProgress(uploadId, progress);
        onProgress?.(progress);
      });

      upload.data = fileData;
      this.updateUploadStatus(uploadId, FileUploadStatus.PROCESSING);

      return {
        success: true,
        data: upload,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== FILE PARSING ====================

  private async parseFile(file: File, onProgress?: (progress: number) => void): Promise<FileData> {
    const extension = file.name.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'csv':
        return this.parseCSV(file, onProgress);
      case 'xlsx':
      case 'xls':
        return this.parseExcel(file, onProgress);
      case 'json':
        return this.parseJSON(file, onProgress);
      default:
        throw new Error(`Unsupported file type: ${extension}`);
    }
  }

  private async parseCSV(file: File, onProgress?: (progress: number) => void): Promise<FileData> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        step: (results, parser) => {
          // Update progress based on current position
          if (onProgress) {
            const progress = (parser.streamer._input.length / file.size) * 100;
            onProgress(Math.min(progress, 100));
          }
        },
        complete: (results) => {
          const headers = results.meta.fields || [];
          const rows = results.data;

          resolve({
            headers,
            rows: rows.map((row: any) => Object.values(row)),
            totalRows: rows.length,
            preview: rows.slice(0, 10),
          });
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        },
      });
    });
  }

  private async parseExcel(file: File, onProgress?: (progress: number) => void): Promise<FileData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      };

      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          // Get first sheet
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];

          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(sheet);
          const headers = Object.keys(jsonData[0] || {});
          const rows = jsonData.map((row: any) => Object.values(row));

          resolve({
            headers,
            rows,
            totalRows: rows.length,
            preview: rows.slice(0, 10),
          });
        } catch (error) {
          reject(new Error(`Excel parsing error: ${error}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read Excel file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  private async parseJSON(file: File, onProgress?: (progress: number) => void): Promise<FileData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      };

      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target?.result as string);
          const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
          const headers = Object.keys(dataArray[0] || {});
          const rows = dataArray.map((row) => Object.values(row));

          resolve({
            headers,
            rows,
            totalRows: rows.length,
            preview: rows.slice(0, 10),
          });
        } catch (error) {
          reject(new Error(`JSON parsing error: ${error}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read JSON file'));
      };

      reader.readAsText(file);
    });
  }

  // ==================== DATA VALIDATION ====================

  async validateData(uploadId: string, importType: ImportType): Promise<ApiResponse<ValidationResult>> {
    try {
      const upload = this.uploads.get(uploadId);
      if (!upload || !upload.data) {
        throw new Error('Upload not found or no data available');
      }

      this.updateUploadStatus(uploadId, FileUploadStatus.VALIDATING);

      const validation = await this.performValidation(upload.data, importType);

      upload.validation = validation;
      this.uploads.set(uploadId, upload);

      return {
        success: true,
        data: validation,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async performValidation(data: FileData, importType: ImportType): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const requiredFields = this.getRequiredFields(importType);

    // Check for missing required columns
    requiredFields.forEach((field) => {
      if (!data.headers.includes(field)) {
        errors.push({
          row: 0,
          column: field,
          value: null,
          message: `Missing required column: ${field}`,
          type: 'required',
        });
      }
    });

    // Validate each row
    data.rows.forEach((row, index) => {
      this.validateRow(row, data.headers, importType, index + 1, errors, warnings);
    });

    const isValid = errors.length === 0;

    return {
      isValid,
      errors,
      warnings,
      summary: {
        totalRows: data.totalRows,
        validRows: data.totalRows - errors.filter((e) => e.type === 'required').length,
        invalidRows: errors.filter((e) => e.type === 'required').length,
        errorCount: errors.length,
        warningCount: warnings.length,
      },
    };
  }

  private validateRow(
    row: any[],
    headers: string[],
    importType: ImportType,
    rowNumber: number,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    headers.forEach((header, colIndex) => {
      const value = row[colIndex];

      // Check required fields
      if (this.isRequiredField(header, importType) && (value === null || value === undefined || value === '')) {
        errors.push({
          row: rowNumber,
          column: header,
          value,
          message: `Required field is empty`,
          type: 'required',
        });
      }

      // Type validation
      const expectedType = this.getFieldType(header, importType);
      if (value !== null && value !== undefined && value !== '') {
        if (!this.validateType(value, expectedType)) {
          errors.push({
            row: rowNumber,
            column: header,
            value,
            message: `Invalid type. Expected ${expectedType}`,
            type: 'type',
          });
        }
      }

      // Range validation for numeric fields
      if (expectedType === 'number' && typeof value === 'number') {
        const range = this.getFieldRange(header, importType);
        if (range && (value < range.min || value > range.max)) {
          warnings.push({
            row: rowNumber,
            column: header,
            value,
            message: `Value outside expected range (${range.min}-${range.max})`,
          });
        }
      }
    });
  }

  // ==================== FIELD MAPPING ====================

  async suggestFieldMapping(uploadId: string, importType: ImportType): Promise<ApiResponse<FieldMapping>> {
    try {
      const upload = this.uploads.get(uploadId);
      if (!upload || !upload.data) {
        throw new Error('Upload not found or no data available');
      }

      this.updateUploadStatus(uploadId, FileUploadStatus.MAPPING);

      const mapping = this.generateFieldMapping(upload.data.headers, importType);

      upload.mapping = mapping;
      this.uploads.set(uploadId, upload);

      return {
        success: true,
        data: mapping,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private generateFieldMapping(headers: string[], importType: ImportType): FieldMapping {
    const mapping: FieldMapping = {};
    const targetFields = this.getTargetFields(importType);

    headers.forEach((header) => {
      const normalized = header.toLowerCase().replace(/[_\s]+/g, '');

      // Find best match
      let bestMatch = '';
      let bestScore = 0;

      targetFields.forEach((target) => {
        const targetNormalized = target.toLowerCase().replace(/[_\s]+/g, '');
        const score = this.calculateSimilarity(normalized, targetNormalized);

        if (score > bestScore) {
          bestScore = score;
          bestMatch = target;
        }
      });

      if (bestScore > 0.5) {
        mapping[header] = bestMatch;
      }
    });

    return mapping;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  // ==================== DATA IMPORT ====================

  async importData(
    uploadId: string,
    mapping: FieldMapping,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<ImportResult>> {
    try {
      const upload = this.uploads.get(uploadId);
      if (!upload || !upload.data) {
        throw new Error('Upload not found or no data available');
      }

      this.updateUploadStatus(uploadId, FileUploadStatus.IMPORTING);

      const result = await this.performImport(upload, mapping, onProgress);

      upload.result = result;
      upload.completedAt = new Date();
      this.updateUploadStatus(uploadId, FileUploadStatus.COMPLETED);

      return {
        success: true,
        data: result,
        timestamp: new Date(),
      };
    } catch (error) {
      this.updateUploadStatus(uploadId, FileUploadStatus.FAILED);
      throw this.handleError(error);
    }
  }

  private async performImport(
    upload: FileUpload,
    mapping: FieldMapping,
    onProgress?: (progress: number) => void
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      createdRecords: [],
      updatedRecords: [],
    };

    const data = upload.data!;
    const totalRows = data.rows.length;

    for (let i = 0; i < totalRows; i++) {
      try {
        const row = data.rows[i];
        const mappedData = this.mapRowData(row, data.headers, mapping);

        // Import record
        const recordId = await this.importRecord(upload.importType, mappedData);

        if (recordId) {
          result.imported++;
          result.createdRecords.push(recordId);
        }

        // Update progress
        const progress = ((i + 1) / totalRows) * 100;
        onProgress?.(progress);
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: i + 1,
          data: data.rows[i],
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    result.success = result.failed === 0;

    return result;
  }

  private mapRowData(row: any[], headers: string[], mapping: FieldMapping): any {
    const mappedData: any = {};

    headers.forEach((header, index) => {
      const targetField = mapping[header];
      if (targetField) {
        mappedData[targetField] = row[index];
      }
    });

    return mappedData;
  }

  private async importRecord(importType: ImportType, data: any): Promise<string> {
    // This would call the appropriate API endpoint based on importType
    const response = await this.client.post(`/import/${importType.toLowerCase()}`, data);
    return response.data.id;
  }

  // ==================== HELPER METHODS ====================

  private validateFile(file: File): void {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Check file type
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !ALLOWED_FILE_TYPES.includes(extension)) {
      throw new Error(`File type .${extension} is not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`);
    }
  }

  private getRequiredFields(importType: ImportType): string[] {
    const requiredFieldsMap: Record<ImportType, string[]> = {
      [ImportType.CAMPAIGNS]: ['name', 'platform', 'objective', 'budget'],
      [ImportType.AUDIENCES]: ['name', 'type', 'size'],
      [ImportType.KEYWORDS]: ['keyword', 'match_type'],
      [ImportType.CREATIVES]: ['name', 'type', 'headline'],
      [ImportType.BUDGETS]: ['campaign_id', 'amount', 'type'],
    };

    return requiredFieldsMap[importType] || [];
  }

  private getTargetFields(importType: ImportType): string[] {
    const targetFieldsMap: Record<ImportType, string[]> = {
      [ImportType.CAMPAIGNS]: [
        'name',
        'platform',
        'objective',
        'status',
        'budget',
        'budget_type',
        'start_date',
        'end_date',
      ],
      [ImportType.AUDIENCES]: ['name', 'type', 'size', 'description'],
      [ImportType.KEYWORDS]: ['keyword', 'match_type', 'bid', 'status'],
      [ImportType.CREATIVES]: ['name', 'type', 'headline', 'description', 'call_to_action'],
      [ImportType.BUDGETS]: ['campaign_id', 'amount', 'type', 'currency'],
    };

    return targetFieldsMap[importType] || [];
  }

  private isRequiredField(field: string, importType: ImportType): boolean {
    return this.getRequiredFields(importType).includes(field);
  }

  private getFieldType(field: string, importType: ImportType): string {
    const numericFields = ['budget', 'amount', 'bid', 'size'];
    const dateFields = ['start_date', 'end_date', 'created_at', 'updated_at'];

    if (numericFields.some((f) => field.toLowerCase().includes(f))) {
      return 'number';
    }

    if (dateFields.some((f) => field.toLowerCase().includes(f))) {
      return 'date';
    }

    return 'string';
  }

  private getFieldRange(field: string, importType: ImportType): { min: number; max: number } | null {
    if (field.toLowerCase().includes('budget') || field.toLowerCase().includes('amount')) {
      return { min: 0, max: 1000000 };
    }

    if (field.toLowerCase().includes('bid')) {
      return { min: 0, max: 100 };
    }

    return null;
  }

  private validateType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'number':
        return typeof value === 'number' || !isNaN(Number(value));
      case 'date':
        return !isNaN(Date.parse(value));
      case 'string':
        return typeof value === 'string';
      default:
        return true;
    }
  }

  private updateUploadStatus(uploadId: string, status: FileUploadStatus): void {
    const upload = this.uploads.get(uploadId);
    if (upload) {
      upload.status = status;
      this.uploads.set(uploadId, upload);
    }
  }

  private updateUploadProgress(uploadId: string, progress: number): void {
    const upload = this.uploads.get(uploadId);
    if (upload) {
      upload.progress = Math.min(progress, 100);
      this.uploads.set(uploadId, upload);
    }
  }

  private generateUploadId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentUserId(): string {
    // Get from auth service or local storage
    return localStorage.getItem('userId') || 'anonymous';
  }

  getUpload(uploadId: string): FileUpload | undefined {
    return this.uploads.get(uploadId);
  }

  getAllUploads(): FileUpload[] {
    return Array.from(this.uploads.values());
  }

  deleteUpload(uploadId: string): void {
    this.uploads.delete(uploadId);
  }

  private handleError(error: any): ApiError {
    const apiError: ApiError = {
      code: error.response?.data?.code || 'UPLOAD_ERROR',
      message: error.response?.data?.message || error.message || 'File upload failed',
      details: error.response?.data,
      statusCode: error.response?.status || 500,
    };

    console.error('[File Upload Service Error]', apiError);
    throw apiError;
  }
}

export default new FileUploadService();
