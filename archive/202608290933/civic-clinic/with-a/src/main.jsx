import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Bundled, self-hosted, open-licensed. Public Sans is the typeface drawn for
// US public-service interfaces; Archivo carries a width axis used for the
// signage-scale status line.
import '@fontsource-variable/public-sans'
import '@fontsource-variable/archivo/wdth.css'

import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
