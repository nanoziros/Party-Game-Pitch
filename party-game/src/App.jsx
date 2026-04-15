import { useState } from 'react'
import { isStreamScreen, useMultiplayerState, usePlayersList } from 'playroomkit'
import LobbyScreen from './screens/LobbyScreen'
import ControllerLobby from './screens/ControllerLobby'
import MinigameSelector from './screens/MinigameSelector'
import GameScreen from './screens/GameScreen'
import ControllerGame from './screens/ControllerGame'

export default function App() {
    const [gameKey, setGameKey] = useState(0)
    const [phase, setPhase]           = useMultiplayerState('appPhase',    'lobby')
    const [currentGame, setCurrentGame] = useMultiplayerState('currentGame', null)
    const players  = usePlayersList()
    const isHost   = isStreamScreen()
    const realPlayers = players.filter(p => p.getProfile().name !== '')

    // Host-only: which sub-screen within the lobby phase
    const [lobbySubPhase, setLobbySubPhase] = useState('qr')

    function handleConfirmPlayers() {
        setLobbySubPhase('modeSelect')
    }

    function handleStart() {
        setPhase('selecting')
        setGameKey(k => k + 1)
    }

    function handleGameSelected(gameId) {
        setCurrentGame(gameId)
        setPhase('game')
    }

    function handlePlayAgain() {
        setCurrentGame(null)
        setPhase('selecting')
        setGameKey(k => k + 1)
    }

    function handleBackToMenu() {
        setCurrentGame(null)
        setPhase('lobby')
        setLobbySubPhase('modeSelect')
        setGameKey(k => k + 1)
    }

    const watermark = (
        <div style={{
            position: 'fixed',
            bottom: 12,
            left: 16,
            color: 'rgba(255,255,255,0.25)',
            fontSize: 12,
            fontFamily: 'monospace',
            letterSpacing: 1,
            pointerEvents: 'none',
            zIndex: 9999,
            userSelect: 'none',
        }}>
            Crowd Play · Prototype 2026
        </div>
    )

    // ── Selector phase — shown on both host and phones
    if (phase === 'selecting') {
        return (
            <>
                <MinigameSelector key={gameKey} onDone={handleGameSelected} />
                {watermark}
            </>
        )
    }

    // ── Game phase
    if (phase === 'game') {
        if (isHost) {
            return (
                <>
                    <GameScreen
                        key={gameKey}
                        players={realPlayers}
                        gameId={currentGame}
                        onPlayAgain={handlePlayAgain}
                        onBackToMenu={handleBackToMenu}
                    />
                    {watermark}
                </>
            )
        } else {
            return (
                <>
                    <ControllerGame key={gameKey} gameId={currentGame} />
                    {watermark}
                </>
            )
        }
    }

    // ── Lobby phase
    if (isHost) {
        return (
            <>
                <LobbyScreen
                    players={realPlayers}
                    subPhase={lobbySubPhase}
                    onConfirmPlayers={handleConfirmPlayers}
                    onStart={handleStart}
                />
                {watermark}
            </>
        )
    } else {
        return (
            <>
                <ControllerLobby />
                {watermark}
            </>
        )
    }
}