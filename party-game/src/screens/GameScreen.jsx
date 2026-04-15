import TappingGame   from '../games/tapping/TappingGame'
import DrawingGame   from '../games/drawing/DrawingGame'
import CountingGame  from '../games/counting/CountingGame'

export default function GameScreen({ players, gameId, onPlayAgain, onBackToMenu }) {
    if (gameId === 'drawing')  return <DrawingGame  players={players} onRestart={onPlayAgain} onBackToMenu={onBackToMenu} />
    if (gameId === 'counting') return <CountingGame players={players} onRestart={onPlayAgain} onBackToMenu={onBackToMenu} />
    return <TappingGame players={players} onRestart={onPlayAgain} onBackToMenu={onBackToMenu} />
}