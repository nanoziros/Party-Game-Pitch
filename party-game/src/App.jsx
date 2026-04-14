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

    // ---- TEMPORARY DEBUG - remove after ----
    useEffect(() => {
        console.log('=== APP MOUNTED ===')
        console.log('isStreamScreen:', isStreamScreen())
        onPlayerJoin(p => {
            console.log('onPlayerJoin fired:', p.id, p.getProfile())
        })
    }, [])

    useEffect(() => {
        console.log('players list changed, count:', players.length)
        players.forEach((p, i) => console.log(`  player[${i}]:`, p.id, p.getProfile()))
    }, [players])

    useEffect(() => {
        console.log('gameStarted changed:', gameStarted)
    }, [gameStarted])
    // ---- END DEBUG ----

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
            ? <GameScreen key={gameKey} players={players} onRestart={handleRestart} />
            : <LobbyScreen players={players} onStart={handleStart} />
    } else {
        return gameStarted
            ? <ControllerGame key={gameKey} />
            : <ControllerLobby />
    }
}