import TappingGame   from '../games/tapping/TappingGame'
import DrawingGame   from '../games/drawing/DrawingGame'
import CountingGame  from '../games/counting/CountingGame'

export default function GameScreen({ players, gameId, onRestart }) {
    if (gameId === 'drawing')  return <DrawingGame  players={players} onRestart={onRestart} />
    if (gameId === 'counting') return <CountingGame players={players} onRestart={onRestart} />
    return <TappingGame players={players} onRestart={onRestart} />
}