import { createSlice } from "@reduxjs/toolkit";

const clientSlice = createSlice({
    name: 'client',
    initialState: {
        clients: [],
    },
    reducers: {
        setClients: (state, action) => {
            state.clients = action.payload;
        },
        removeClient: (state, action) => {
            const index = state.clients.findIndex((client) => client.id === action.payload);
            if (index !== -1) {
                state.splice(index, 1);
            }
        },
    },
})
export const { setClients, removeClient } = clientSlice.actions;
export const selectClients = (state) => state.clients.clients;
export default clientSlice.reducer;