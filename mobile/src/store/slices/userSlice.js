import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  name: 'Rahul Kumar',
  email: 'rahul.kumar@example.com',
  testsTaken: 12,
  accuracy: 85,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Test count badhane ke liye action
    incrementTestCount: (state) => {
      state.testsTaken += 1;
    },
    // User ka naam update karne ke liye action
    updateUserName: (state, action) => {
      state.name = action.payload;
    },
  },
});

export const { incrementTestCount, updateUserName } = userSlice.actions;
export default userSlice.reducer;