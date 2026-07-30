import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Prototype from './Prototype.jsx'
import './index.css'

const prototypeMode = window.location.pathname === '/prototype/best'
  ? 'best'
  : window.location.pathname === '/prototype/bold'
    ? 'bold'
    : null

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {prototypeMode ? <Prototype mode={prototypeMode} /> : <App />}
  </React.StrictMode>,
)
