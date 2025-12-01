import React, { StrictMode } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import ReactDOM from 'react-dom/client'
import App from './App'
import DomApiTest from './domapiTest/domapi'
import './index.css'

declare const __XR_ENV_BASE__: string

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/domApiTest" element={<DomApiTest />} />
    </Routes>
  </BrowserRouter>,
)
