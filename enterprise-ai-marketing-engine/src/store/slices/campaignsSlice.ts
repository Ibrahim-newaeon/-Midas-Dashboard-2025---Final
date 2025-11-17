import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import CampaignService from '@/services/CampaignService';
import { CampaignState, Campaign, CampaignFilters, Platform } from '@/types';

const initialState: CampaignState = {
  campaigns: [],
  selectedCampaign: null,
  isLoading: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    pageSize: 25,
    total: 0,
  },
};

// Async thunks
export const fetchCampaigns = createAsyncThunk(
  'campaigns/fetchCampaigns',
  async (filters: CampaignFilters | undefined, { rejectWithValue }) => {
    try {
      const response = await CampaignService.getCampaigns(filters);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCampaign = createAsyncThunk(
  'campaigns/fetchCampaign',
  async ({ campaignId, platform }: { campaignId: string; platform: Platform }, { rejectWithValue }) => {
    try {
      const response = await CampaignService.getCampaign(campaignId, platform);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createCampaign = createAsyncThunk(
  'campaigns/createCampaign',
  async ({ platform, campaignData }: { platform: Platform; campaignData: Partial<Campaign> }, { rejectWithValue }) => {
    try {
      const response = await CampaignService.createCampaign(platform, campaignData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateCampaign = createAsyncThunk(
  'campaigns/updateCampaign',
  async (
    { campaignId, platform, updates }: { campaignId: string; platform: Platform; updates: Partial<Campaign> },
    { rejectWithValue }
  ) => {
    try {
      const response = await CampaignService.updateCampaign(campaignId, platform, updates);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteCampaign = createAsyncThunk(
  'campaigns/deleteCampaign',
  async ({ campaignId, platform }: { campaignId: string; platform: Platform }, { rejectWithValue }) => {
    try {
      await CampaignService.deleteCampaign(campaignId, platform);
      return campaignId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const pauseCampaign = createAsyncThunk(
  'campaigns/pauseCampaign',
  async ({ campaignId, platform }: { campaignId: string; platform: Platform }, { rejectWithValue }) => {
    try {
      const response = await CampaignService.pauseCampaign(campaignId, platform);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const activateCampaign = createAsyncThunk(
  'campaigns/activateCampaign',
  async ({ campaignId, platform }: { campaignId: string; platform: Platform }, { rejectWithValue }) => {
    try {
      const response = await CampaignService.activateCampaign(campaignId, platform);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const syncCampaigns = createAsyncThunk(
  'campaigns/syncCampaigns',
  async (_, { rejectWithValue }) => {
    try {
      const response = await CampaignService.syncAllCampaigns();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const campaignsSlice = createSlice({
  name: 'campaigns',
  initialState,
  reducers: {
    setSelectedCampaign: (state, action: PayloadAction<Campaign | null>) => {
      state.selectedCampaign = action.payload;
    },
    setFilters: (state, action: PayloadAction<CampaignFilters>) => {
      state.filters = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setPagination: (state, action: PayloadAction<{ page: number; pageSize: number }>) => {
      state.pagination.page = action.payload.page;
      state.pagination.pageSize = action.payload.pageSize;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateCampaignInList: (state, action: PayloadAction<Campaign>) => {
      const index = state.campaigns.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.campaigns[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch campaigns
    builder.addCase(fetchCampaigns.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchCampaigns.fulfilled, (state, action) => {
      state.isLoading = false;
      state.campaigns = action.payload;
      state.pagination.total = action.payload.length;
    });
    builder.addCase(fetchCampaigns.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch single campaign
    builder.addCase(fetchCampaign.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchCampaign.fulfilled, (state, action) => {
      state.isLoading = false;
      state.selectedCampaign = action.payload;

      // Update in list if exists
      const index = state.campaigns.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.campaigns[index] = action.payload;
      }
    });
    builder.addCase(fetchCampaign.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Create campaign
    builder.addCase(createCampaign.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(createCampaign.fulfilled, (state, action) => {
      state.isLoading = false;
      state.campaigns.unshift(action.payload);
      state.pagination.total += 1;
    });
    builder.addCase(createCampaign.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Update campaign
    builder.addCase(updateCampaign.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(updateCampaign.fulfilled, (state, action) => {
      state.isLoading = false;
      const index = state.campaigns.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.campaigns[index] = action.payload;
      }
      if (state.selectedCampaign?.id === action.payload.id) {
        state.selectedCampaign = action.payload;
      }
    });
    builder.addCase(updateCampaign.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Delete campaign
    builder.addCase(deleteCampaign.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(deleteCampaign.fulfilled, (state, action) => {
      state.isLoading = false;
      state.campaigns = state.campaigns.filter((c) => c.id !== action.payload);
      state.pagination.total -= 1;
      if (state.selectedCampaign?.id === action.payload) {
        state.selectedCampaign = null;
      }
    });
    builder.addCase(deleteCampaign.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Pause campaign
    builder.addCase(pauseCampaign.fulfilled, (state, action) => {
      const index = state.campaigns.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.campaigns[index] = action.payload;
      }
      if (state.selectedCampaign?.id === action.payload.id) {
        state.selectedCampaign = action.payload;
      }
    });

    // Activate campaign
    builder.addCase(activateCampaign.fulfilled, (state, action) => {
      const index = state.campaigns.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.campaigns[index] = action.payload;
      }
      if (state.selectedCampaign?.id === action.payload.id) {
        state.selectedCampaign = action.payload;
      }
    });

    // Sync campaigns
    builder.addCase(syncCampaigns.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(syncCampaigns.fulfilled, (state) => {
      state.isLoading = false;
    });
    builder.addCase(syncCampaigns.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const {
  setSelectedCampaign,
  setFilters,
  clearFilters,
  setPagination,
  clearError,
  updateCampaignInList,
} = campaignsSlice.actions;

export default campaignsSlice.reducer;
