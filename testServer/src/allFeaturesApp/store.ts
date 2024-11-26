import { createSlice, combineReducers } from '@reduxjs/toolkit'
import { withReduxStateSync } from 'redux-state-sync'

const countSlice = createSlice({
  name: 'count',
  initialState: {
    value: 0,
  },
  reducers: {
    increment: state => {
      state.value = state.value + 1
    },
    decrement: state => {
      state.value = state.value - 1
    },
  },
})

import {
  createStateSyncMiddleware,
  initMessageListener,
} from 'redux-state-sync'
import { configureStore, Tuple } from '@reduxjs/toolkit'

var mw = [createStateSyncMiddleware({}) as any]

var rootReducer = withReduxStateSync(
  combineReducers({ count: countSlice.reducer }),
)

export const { increment, decrement } = countSlice.actions
export const reducer = withReduxStateSync(countSlice.reducer)
export default configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware => getDefaultMiddleware().concat(mw),
})
