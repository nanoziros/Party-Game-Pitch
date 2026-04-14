import { useEffect, useState } from "react"
import { insertCoin, isStreamScreen, onPlayerJoin } from "playroomkit"
import LobbyScreen from "./screens/LobbyScreen"
import ControllerLobby from "./screens/ControllerLobby"
import GameScreen from "./screens/GameScreen"
import ControllerGame from "./screens/ControllerGame"

export default function App() {
    const [started, setStarted] = useState(false)
    const [players, setPlayers] = useState([])
    const [gameKey, setGameKey] = useState(0)
    const isHost = isStreamScreen()

    useEffect(() => {
        insertCoin({ streamMode: true }, () => {
            setStarted(true)
        })

        onPlayerJoin((player) => {
            // isStreamScreen() on a player object tells you if it's the host screen — skip it
            if (player.isStreamScreen) return

            setPlayers(prev => [...prev, player])
            player.onQuit(() => {
                setPlayers(prev => prev.filter(p => p.id !== player.id))
            })
        })
    }, [])

    function handleStart() {
        setStarted(true)
        setGameKey(k => k + 1) // force GameScreen to remount fresh each game
    }

    function handleRestart() {
        setStarted(false)
        setGameKey(k => k + 1)
    }

    if (isHost) {
        return started
            ? <GameScreen key={gameKey} players={players} onRestart={handleRestart} />
            : <LobbyScreen players={players} onStart={handleStart} />
    } else {
        return started ? <ControllerGame /> : <ControllerLobby />
    }
}