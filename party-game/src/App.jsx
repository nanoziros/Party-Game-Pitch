import { isStreamScreen, useMultiplayerState, usePlayersList, onPlayerJoin } from 'playroomkit'
import { useState, useEffect } from 'react'
import LobbyScreen from './screens/LobbyScreen'
import ControllerLobby from './screens/ControllerLobby'
import GameScreen from './screens/GameScreen'
import ControllerGame from './screens/ControllerGame'

export default function App() {
    const [gameKey, setGameKey] = useState(0)
    const [gameStarted, setGameStarted] = useMultiplayerState('gameStarted', false)
    const players = usePlayersList()
    const isHost = isStreamScreen()

    // Ghost player has name: "" — real players always have a name from Playroom's join flow
    const realPlayers = players.filter(p => p.getProfile().name !== "")

    function handleStart() {
        setGameStarted(true)
        setGameKey(k => k + 1)
    }

    function handleRestart() {
        setGameStarted(false)
        setGameKey(k => k + 1)
    }

    if (isHost) {
        return gameStarted
            ? <GameScreen key={gameKey} players={realPlayers} onRestart={handleRestart} />
            : <LobbyScreen players={realPlayers} onStart={handleStart} />
    } else {
        return gameStarted
            ? <ControllerGame key={gameKey} />
            : <ControllerLobby />
    }
}