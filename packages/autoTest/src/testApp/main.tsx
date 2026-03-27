import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import ReactDOM from 'react-dom/client'
import App from './App'
import DomApiTest from './domapiTest/domapi'
import ErrorBoundary from './ErrorBoundary'
import './index.css'
import MaterialApiTest from './materialApiTest/materialapi'
import CssApiTest from './CssAPITest/cssapi'
import TransformTest from './transformTest/transformTest'

declare const __XR_ENV_BASE__: string

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/domApiTest" element={<DomApiTest />} />
        <Route path="/materialApiTest" element={<MaterialApiTest />} />
        <Route path="/cssApiTest" element={<CssApiTest />} />
        <Route path="/transformTest" element={<TransformTest />} />
      </Routes>
    </BrowserRouter>
  </ErrorBoundary>,
)
