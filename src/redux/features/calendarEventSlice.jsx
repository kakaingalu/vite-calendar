import { createSlice } from '@reduxjs/toolkit';

const calendarEventSlice = createSlice({
    name: 'calendarEvents',
    initialState: [],
    reducers: {
        setCalendarEvents(state, action) {
            return action.payload;
        },
        addCalendarEvent(state, action) {
            state.push(action.payload);
        },
        removeCalendarEvent(state, action) {
            const index = state.findIndex(calendarEvent => calendarEvent.id === action.payload);
            if (index !== -1) {
                state.splice(index, 1);
            }
        },
        updateCalendarEvent(state, action) {
            const { id, newData } = action.payload;
            const calendarEvent = state.find(calendarEvent => calendarEvent.id === id);
            if (calendarEvent) {
                Object.assign(calendarEvent, newData);
            }
        },
    },
});

export const { setCalendarEvents, addCalendarEvent, removeCalendarEvent, updateCalendarEvent } = calendarEventSlice.actions;
export const selectCalendarEvents = state => state.calendarEvents;

export default calendarEventSlice.reducer;
