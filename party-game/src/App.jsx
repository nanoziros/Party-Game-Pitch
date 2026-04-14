import { useState } from 'react'
import { isStreamScreen, useMultiplayerState, usePlayersList } from 'playroomkit'
import LobbyScreen from './screens/LobbyScreen'
import ControllerLobby from './screens/ControllerLobby'
import MinigameSelector from './screens/MinigameSelector'
import GameScreen from './screens/GameScreen'
import ControllerGame from './screens/ControllerGame'

export default function App() {
    const [gameKey, setGameKey] = useState(0)
    const [gameStarted, setGameStarted] = useMultiplayerState('gameStarted', false)
    const [selecting, setSelecting]     = useMultiplayerState('selecting',   false)
    const [currentGame, setCurrentGame] = useMultiplayerState('currentGame', null)
    const players  = usePlayersList()
    const isHost   = isStreamScreen()
    const realPlayers = players.filter(p => p.getProfile().name !== '')

    function handleStart() {
        // Go to selector first, not straight to game
        setSelecting(true)
        setGameKey(k => k + 1)
    }

    function handleGameSelected(gameId) {
        setCurrentGame(gameId)
        setSelecting(false)
        setGameStarted(true)
    }

    function handleRestart() {
        setGameStarted(false)
        setSelecting(false)
        setCurrentGame(null)
        setGameKey(k => k + 1)
    }

    // ── Selector phase — shown on both host and phones
    if (selecting) {
        return (
            <MinigameSelector
                key={gameKey}
                onDone={handleGameSelected}
            />
        )
    }

    // ── Game phase
    if (gameStarted) {
        if (isHost) {
            return (
                <GameScreen
                    key={gameKey}
                    players={realPlayers}
                    gameId={currentGame}
                    onRestart={handleRestart}
                />
            )
        } else {
            return <ControllerGame key={gameKey} gameId={currentGame} />
        }
    }

    // ── Lobby phase
    if (isHost) {
        return <LobbyScreen players={realPlayers} onStart={handleStart} />
    } else {
        return <ControllerLobby />
    }
}