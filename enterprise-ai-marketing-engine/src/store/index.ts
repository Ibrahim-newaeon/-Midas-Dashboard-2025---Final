import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './slices/authSlice';
import campaignsReducer from './slices/campaignsSlice';
import uploadReducer from './slices/uploadSlice';
import uiReducer from './slices/uiSlice';
import notificationsReducer from './slices/notificationsSlice';

// Redux persist configuration
const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  whitelist: ['auth', 'ui'], // Only persist auth and ui state
  blacklist: ['campaigns', 'upload', 'notifications'], // Don't persist these
};

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  campaigns: campaignsReducer,
  upload: uploadReducer,
  ui: uiReducer,
  notifications: notificationsReducer,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: import.meta.env.MODE !== 'production',
});

// Create persistor
export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
