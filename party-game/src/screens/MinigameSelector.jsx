import { useEffect, useRef, useState } from 'react'
import { useMultiplayerState, isStreamScreen } from 'playroomkit'

const GAMES = [
    {
        id:      'tapping',
        icon:    '⚡',
        label:   'Quick Tap',
        desc:    'Tap the right one first',
        color:   '#FF6B6B',
        glow:    'rgba(255,107,107,0.4)',
        border:  'rgba(255,107,107,0.8)',
    },
    {
        id:      'drawing',
        icon:    '🎨',
        label:   'Draw & Steal',
        desc:    'Draw it, steal it',
        color:   '#C77DFF',
        glow:    'rgba(199,125,255,0.4)',
        border:  'rgba(199,125,255,0.8)',
    },
]

// Alternates between games, stored locally on host machine
function getNextGame() {
    const last = localStorage.getItem('lastGame')
    const next = last === 'tapping' ? 'drawing' : 'tapping'
    localStorage.setItem('lastGame', next)
    return next
}

export default function MinigameSelector({ onDone }) {
    const [selectedGame, setSelectedGame] = useMultiplayerState('selectedGame', null)
    const [selectorPhase, setSelectorPhase] = useMultiplayerState('selectorPhase', 'spinning')
    const [highlightIndex, setHighlightIndex] = useState(0)
    const [revealed, setRevealed] = useState(false)
    const isHost = isStreamScreen()
    const intervalRef = useRef(null)
    const tickDelayRef = useRef(80)
    const tickCountRef = useRef(0)
    const targetRef = useRef(null)

    useEffect(() => {
        if (!isHost) return

        const target = getNextGame()
        const targetIndex = GAMES.findIndex(g => g.id === target)
        targetRef.current = targetIndex

        // We'll do a minimum of 12 ticks before we can land
        // Each tick the delay grows by 12% — looks like natural slowdown
        function tick() {
            tickCountRef.current += 1
            const canLand = tickCountRef.current >= 14
            const currentDelay = tickDelayRef.current

            setHighlightIndex(prev => {
                const next = (prev + 1) % GAMES.length
                // If we can land and the next index is our target, stop
                if (canLand && next === targetRef.current) {
                    clearInterval(intervalRef.current)
                    // Brief pause then reveal
                    setTimeout(() => {
                        setSelectedGame(GAMES[targetRef.current].id)
                        setSelectorPhase('revealed')
                        setRevealed(true)
                        // After 2.5s transition to game
                        setTimeout(() => {
                            onDone(GAMES[targetRef.current].id)
                        }, 2500)
                    }, 400)
                }
                return next
            })

            // Grow delay — slow down the roulette
            if (tickCountRef.current >= 8) {
                tickDelayRef.current = Math.min(currentDelay * 1.18, 700)
                clearInterval(intervalRef.current)
                intervalRef.current = setInterval(tick, tickDelayRef.current)
            }
        }

        intervalRef.current = setInterval(tick, tickDelayRef.current)
        return () => clearInterval(intervalRef.current)
    }, [])

    // Phone waiting screen
    if (!isHost) {
        return (
            <div style={styles.container}>
                <div style={styles.phoneWaiting}>
                    <div style={styles.spinnerEmoji}>🎲</div>
                    <p style={styles.phoneHint}>Selecting minigame…</p>
                    <p style={styles.phoneSubHint}>Get ready!</p>
                </div>
            </div>
        )
    }

    const revealedGame = revealed ? GAMES.find(g => g.id === selectedGame) : null

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>
                {revealed ? '🎉 Tonight\'s game is…' : '🎲 Selecting minigame…'}
            </h1>

            <div style={styles.cardRow}>
                {GAMES.map((game, i) => {
                    const isHighlighted = highlightIndex === i
                    const isWinner = revealed && game.id === selectedGame

                    return (
                        <div
                            key={game.id}
                            style={{
                                ...styles.card,
                                border: `3px solid ${isWinner ? game.border : isHighlighted ? game.border : 'rgba(255,255,255,0.1)'}`,
                                background: isWinner
                                    ? `rgba(${hexToRgb(game.color)}, 0.25)`
                                    : isHighlighted
                                        ? `rgba(${hexToRgb(game.color)}, 0.18)`
                                        : 'rgba(255,255,255,0.04)',
                                boxShadow: isWinner
                                    ? `0 0 60px ${game.glow}, 0 0 120px ${game.glow}`
                                    : isHighlighted
                                        ? `0 0 32px ${game.glow}`
                                        : 'none',
                                transform: isWinner
                                    ? 'scale(1.12)'
                                    : isHighlighted
                                        ? 'scale(1.05)'
                                        : 'scale(1)',
                            }}
                        >
                            <span style={styles.cardIcon}>{game.icon}</span>
                            <span style={{
                                ...styles.cardLabel,
                                color: isWinner || isHighlighted ? '#fff' : 'rgba(255,255,255,0.45)',
                            }}>
                {game.label}
              </span>
                            <span style={{
                                ...styles.cardDesc,
                                color: isWinner || isHighlighted ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)',
                            }}>
                {game.desc}
              </span>

                            {isWinner && (
                                <div style={{ ...styles.winnerBadge, background: game.color }}>
                                    SELECTED
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {revealed && revealedGame && (
                <p style={{ ...styles.revealSub, color: revealedGame.color }}>
                    Get ready — starting in a moment…
                </p>
            )}
        </div>
    )
}

// Helper to convert hex to rgb values for rgba()
function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `${r}, ${g}, ${b}`
}

const styles = {
    container:    { minHeight:'100vh', background:'#1a1a2e', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:"'Fredoka One', sans-serif", gap:40, padding:32 },
    title:        { fontSize:42, color:'#fff', margin:0, textAlign:'center', textShadow:'0 4px 20px rgba(255,255,255,0.2)' },
    cardRow:      { display:'flex', gap:40, flexWrap:'wrap', justifyContent:'center' },
    card:         { width:260, minHeight:260, borderRadius:28, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, padding:32, position:'relative', transition:'all 0.12s ease' },
    cardIcon:     { fontSize:72 },
    cardLabel:    { fontSize:28, transition:'color 0.12s' },
    cardDesc:     { fontSize:15, textAlign:'center', transition:'color 0.12s' },
    winnerBadge:  { position:'absolute', bottom:16, borderRadius:50, padding:'4px 16px', fontSize:13, color:'#fff', letterSpacing:2 },
    revealSub:    { fontSize:22, margin:0 },
    // Phone
    phoneWaiting: { display:'flex', flexDirection:'column', alignItems:'center', gap:16 },
    spinnerEmoji: { fontSize:80, animation:'spin 1s linear infinite' },
    phoneHint:    { fontSize:28, color:'#fff', margin:0 },
    phoneSubHint: { fontSize:18, color:'rgba(255,255,255,0.5)', margin:0 },
}