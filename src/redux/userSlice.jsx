// userSlice.js
import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: [],
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },



    addUser: (state, action) => {
      state.user.push(action.payload);
    },
    // Add additional actions if needed (e.g., clearUser for logout)
    //   removeUser: (state, action) => {
    //         const userIdToRemove = action.payload;
    //     state.user = state.user.filter(users => users.id !== userIdToRemove)
    //  },
    removeUser: (state, action) => {
      const userIdToRemove = action.payload;
      // Check if state.user is an array before filtering
      if (Array.isArray(state.user)) {
          state.user = state.user.filter(user => user.id !== userIdToRemove);
      } else {
          // If state.user is not an array, convert it to an array with a single item or set it to an empty array
          if (state.user) {
              state.user = [state.user].filter(user => user.id !== userIdToRemove);
          } else {
              state.user = [];
          }
      }
  },
  },
});

export const { setUser, removeUser} = userSlice.actions;
export const selectUser = (state) => state.user.user;


export default userSlice.reducer;
