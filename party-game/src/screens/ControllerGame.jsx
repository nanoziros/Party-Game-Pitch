import TappingController  from '../games/tapping/TappingController'
import DrawingController  from '../games/drawing/DrawingController'
import CountingController from '../games/counting/CountingController'

export default function ControllerGame({ gameId }) {
    if (gameId === 'drawing')  return <DrawingController />
    if (gameId === 'counting') return <CountingController />
    return <TappingController />
}