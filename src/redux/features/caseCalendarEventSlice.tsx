import { createSlice } from '@reduxjs/toolkit';

const caseCalendarEventSlice = createSlice({
    name: 'caseCalendarEvents',
    initialState: [],
    reducers: {
        setCaseCalendarEvents(state, action) {
            return action.payload;
        },
        addCaseCalendarEvent(state, action) {
            state.push(action.payload);
        },
        removeCaseCalendarEvent(state, action) {
            const index = state.findIndex(caseCalendarEvent => caseCalendarEvent.id === action.payload);
            if (index !== -1) {
                state.splice(index, 1);
            }
        },
        updateCaseCalendarEvent(state, action) {
            const { id, newData } = action.payload;
            const caseCalendarEvent = state.find(caseCalendarEvent => caseCalendarEvent.id === id);
            if (caseCalendarEvent) {
                Object.assign(caseCalendarEvent, newData);
            }
        },
    },
});

export const { setCaseCalendarEvents, addCaseCalendarEvent, removeCaseCalendarEvent, updateCaseCalendarEvent } = caseCalendarEventSlice.actions;
export const selectCaseCalendarEvents = state => state.caseCalendarEvents;

export default caseCalendarEventSlice.reducer;

