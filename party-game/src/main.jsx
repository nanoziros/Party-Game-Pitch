import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource/fredoka-one'
import { insertCoin } from 'playroomkit'
import App from './App.jsx'

// Wait for Playroom to fully initialize before rendering ANYTHING.
// This is the correct pattern per official Playroom docs.
insertCoin({ streamMode: true }).then(() => {
    ReactDOM.createRoot(document.getElementById('root')).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    )
})