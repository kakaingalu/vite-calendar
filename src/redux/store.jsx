// store.js
import { configureStore } from '@reduxjs/toolkit';
import { persistStore,
    persistReducer,
    FLUSH,
      REHYDRATE,
      PAUSE,
      PERSIST,
      PURGE,
      REGISTER,
    } from 'redux-persist'
import userReducer from './userSlice';
import matterReducer from './features/matterSlice';
import clientReducer from './features/clientSlice';
import casesReducer from './features/casesSlice';
import employeeReducer from './features/employeeSlice';
import taskReducer from './features/taskSlice';
import calendarEventsReducer from './features/calendarEventSlice';
import scheduleReducer from './features/scheduleSlice';
import caseCalendarEventReducer from './features/caseCalendarEventSlice';
import storage from 'redux-persist/lib/storage';
import rootReducer from './reducer';
import fileManagerReducer from './features/fileManagerSlice';
import invoiceReducer from './features/invoiceSlice';
import aiLegalOptionsReducer from './features/aiLegalOptionsSlice';
import formTemplatesReducer from './features/formTemplateSlice';
// import clientReducer from './clientSlice';


const persistConfig = {
  key: 'root',
  storage,
};
// const rootReducer = combineReducers({
//   user: userReducer,
//   clients: clientReducer, // Add more reducers here if needed
// });

const persistedReducer = persistReducer(persistConfig, userReducer, clientReducer, rootReducer);

export const store = configureStore({
  reducer: {
    // user: userReducer,
    user: persistedReducer, 
    matters: matterReducer,
    clients: clientReducer,
    cases: casesReducer,
    invoices: invoiceReducer,
    employees: employeeReducer,
    task: taskReducer,
    files: fileManagerReducer,
    calendarEvents: calendarEventsReducer,
    schedule: scheduleReducer,
    activeCaseCalendarEvents: caseCalendarEventReducer,
    ai_legal_options: aiLegalOptionsReducer,
    form_templates: formTemplatesReducer,
  },
  middleware: (getDefaultMiddleware) =>
  getDefaultMiddleware({
    serializableCheck: {
      ignoreActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
    },
  }),
});

export let persistor = persistStore(store);
