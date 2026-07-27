import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import RoastPrototype from './prototypes/RoastPrototype.jsx'
import './index.css'
import './prototypes/prototype.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {window.location.pathname.startsWith('/prototype/')
      ? <RoastPrototype mode={window.location.pathname.endsWith('/spatial') ? 'spatial' : 'bounded'} />
      : <App />}
  </React.StrictMode>,
)
