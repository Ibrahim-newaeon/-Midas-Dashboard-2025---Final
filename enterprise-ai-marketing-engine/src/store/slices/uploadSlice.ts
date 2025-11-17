import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import FileUploadService from '@/services/FileUploadService';
import { UploadState, FileUpload, ImportType, FieldMapping } from '@/types';

const initialState: UploadState = {
  uploads: [],
  activeUpload: null,
  isUploading: false,
  error: null,
};

// Async thunks
export const uploadFile = createAsyncThunk(
  'upload/uploadFile',
  async (
    { file, importType }: { file: File; importType: ImportType },
    { rejectWithValue }
  ) => {
    try {
      const response = await FileUploadService.uploadFile(file, importType);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const validateData = createAsyncThunk(
  'upload/validateData',
  async (
    { uploadId, importType }: { uploadId: string; importType: ImportType },
    { rejectWithValue }
  ) => {
    try {
      const response = await FileUploadService.validateData(uploadId, importType);
      return { uploadId, validation: response.data };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const suggestMapping = createAsyncThunk(
  'upload/suggestMapping',
  async (
    { uploadId, importType }: { uploadId: string; importType: ImportType },
    { rejectWithValue }
  ) => {
    try {
      const response = await FileUploadService.suggestFieldMapping(uploadId, importType);
      return { uploadId, mapping: response.data };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const importData = createAsyncThunk(
  'upload/importData',
  async (
    { uploadId, mapping }: { uploadId: string; mapping: FieldMapping },
    { rejectWithValue }
  ) => {
    try {
      const response = await FileUploadService.importData(uploadId, mapping);
      return { uploadId, result: response.data };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const uploadSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    setActiveUpload: (state, action: PayloadAction<FileUpload | null>) => {
      state.activeUpload = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    removeUpload: (state, action: PayloadAction<string>) => {
      state.uploads = state.uploads.filter((u) => u.id !== action.payload);
      if (state.activeUpload?.id === action.payload) {
        state.activeUpload = null;
      }
    },
  },
  extraReducers: (builder) => {
    // Upload file
    builder.addCase(uploadFile.pending, (state) => {
      state.isUploading = true;
      state.error = null;
    });
    builder.addCase(uploadFile.fulfilled, (state, action) => {
      state.isUploading = false;
      state.uploads.push(action.payload);
      state.activeUpload = action.payload;
    });
    builder.addCase(uploadFile.rejected, (state, action) => {
      state.isUploading = false;
      state.error = action.payload as string;
    });

    // Validate data
    builder.addCase(validateData.fulfilled, (state, action) => {
      const upload = state.uploads.find((u) => u.id === action.payload.uploadId);
      if (upload) {
        upload.validation = action.payload.validation;
      }
      if (state.activeUpload?.id === action.payload.uploadId) {
        state.activeUpload.validation = action.payload.validation;
      }
    });

    // Suggest mapping
    builder.addCase(suggestMapping.fulfilled, (state, action) => {
      const upload = state.uploads.find((u) => u.id === action.payload.uploadId);
      if (upload) {
        upload.mapping = action.payload.mapping;
      }
      if (state.activeUpload?.id === action.payload.uploadId) {
        state.activeUpload.mapping = action.payload.mapping;
      }
    });

    // Import data
    builder.addCase(importData.pending, (state) => {
      state.isUploading = true;
      state.error = null;
    });
    builder.addCase(importData.fulfilled, (state, action) => {
      state.isUploading = false;
      const upload = state.uploads.find((u) => u.id === action.payload.uploadId);
      if (upload) {
        upload.result = action.payload.result;
      }
      if (state.activeUpload?.id === action.payload.uploadId) {
        state.activeUpload.result = action.payload.result;
      }
    });
    builder.addCase(importData.rejected, (state, action) => {
      state.isUploading = false;
      state.error = action.payload as string;
    });
  },
});

export const { setActiveUpload, clearError, removeUpload } = uploadSlice.actions;
export default uploadSlice.reducer;
