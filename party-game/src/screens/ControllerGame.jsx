import TappingController from '../games/tapping/TappingController'
import DrawingController from '../games/drawing/DrawingController'

export default function ControllerGame({ gameId }) {
    if (gameId === 'drawing') {
        return <DrawingController />
    }
    return <TappingController />
}