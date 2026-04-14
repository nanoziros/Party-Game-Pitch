import TappingGame from '../games/tapping/TappingGame'
import DrawingGame from '../games/drawing/DrawingGame'

export default function GameScreen({ players, gameId, onRestart }) {
    if (gameId === 'drawing') {
        return <DrawingGame players={players} onRestart={onRestart} />
    }
    return <TappingGame players={players} onRestart={onRestart} />
}