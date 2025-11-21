import React from 'react'
import ReactDOM from 'react-dom/client'
import { Amplify } from 'aws-amplify'
import awsExportsDev from '../aws-exports-dev'
import App from './App.jsx'
import './index.css'

// Configure Amplify based on environment
const env = import.meta.env.VITE_ENV || 'DEVELOP'
Amplify.configure(env === 'PRODUCTION' ? awsExportsDev : awsExportsDev)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
