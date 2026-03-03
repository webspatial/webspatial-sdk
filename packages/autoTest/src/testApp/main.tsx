import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import ReactDOM from 'react-dom/client'
import App from './App'
import DomApiTest from './domapiTest/domapi'
import ErrorBoundary from './ErrorBoundary'
import './index.css'

declare const __XR_ENV_BASE__: string

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/domApiTest" element={<DomApiTest />} />
      </Routes>
    </BrowserRouter>
  </ErrorBoundary>,
)
