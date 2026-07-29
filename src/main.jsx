import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import RoastPrototype from './prototypes/RoastPrototype.jsx'
import './index.css'

const prototypeMode = window.location.pathname.startsWith('/prototype/')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {prototypeMode ? <RoastPrototype /> : <App />}
  </React.StrictMode>,
)
