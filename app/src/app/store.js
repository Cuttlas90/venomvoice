import { configureStore } from '@reduxjs/toolkit';
import cryptoVoiceReducer from '../features/cryptoVoice/cryptoVoiceSlice';

export const store = configureStore({
  reducer: {
    cryptoVoice: cryptoVoiceReducer,
  },
});
