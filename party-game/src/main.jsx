import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource/fredoka-one'
import { insertCoin } from 'playroomkit'
import App from './App.jsx'

const params = new URLSearchParams(window.location.search)
const roomCode = params.get('roomCode')

insertCoin({
    streamMode: true,
    skipLobby: true,
    roomCode: roomCode ?? undefined,  // if present, joins that room; otherwise creates new
}).then(() => {
    ReactDOM.createRoot(document.getElementById('root')).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    )
}).catch(err => console.error('insertCoin failed:', err))