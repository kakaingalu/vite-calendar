import { combineReducers } from '@reduxjs/toolkit';
import mattersReducer from './features/matterSlice';
import clientReducer from './features/clientSlice';
import userReducer from './userSlice';

const rootReducer = combineReducers({
    user: userReducer,
    matters: mattersReducer,
    clients: clientReducer,
});

export default rootReducer;