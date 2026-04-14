import { useEffect, useRef, useState } from 'react'
import { useMultiplayerState, isStreamScreen, usePlayersList } from 'playroomkit'

const GAMES = [
    {
        id:         'tapping',
        icon:       '⚡',
        label:      'Quick Tap',
        desc:       'Tap the right one first',
        color:      '#FF6B6B',
        glow:       'rgba(255,107,107,0.4)',
        border:     'rgba(255,107,107,0.8)',
        minPlayers: 1,
    },
    {
        id:         'drawing',
        icon:       '🎨',
        label:      'Draw & Steal',
        desc:       'Draw it, steal it',
        color:      '#C77DFF',
        glow:       'rgba(199,125,255,0.4)',
        border:     'rgba(199,125,255,0.8)',
        minPlayers: 3,
    },
    {
        id:         'counting',
        icon:       '🔢',
        label:      'Count & Claim',
        desc:       'Count the objects, be fastest',
        color:      '#4D96FF',
        glow:       'rgba(77,150,255,0.4)',
        border:     'rgba(77,150,255,0.8)',
        minPlayers: 1,
    },
]

function getNextGame(playerCount) {
    const valid    = GAMES.filter(g => playerCount >= g.minPlayers)
    const ids      = valid.map(g => g.id)
    const last     = localStorage.getItem('lastGame')
    const lastIdx  = ids.indexOf(last)
    const next     = valid[(lastIdx + 1) % valid.length]
    localStorage.setItem('lastGame', next.id)
    return next.id
}

export default function MinigameSelector({ onDone }) {
    const [selectedGame,   setSelectedGame]   = useMultiplayerState('selectedGame',   null)
    const [selectorPhase,  setSelectorPhase]  = useMultiplayerState('selectorPhase',  'spinning')
    const [highlightIndex, setHighlightIndex] = useState(0)
    const [revealed,       setRevealed]       = useState(false)

    const isHost      = isStreamScreen()
    const allPlayers  = usePlayersList()
    const playerCount = allPlayers.filter(p => p.getProfile().name !== '').length

    const intervalRef  = useRef(null)
    const tickDelayRef = useRef(80)
    const tickCountRef = useRef(0)
    const targetRef    = useRef(null)

    useEffect(() => {
        if (!isHost) return

        const target      = getNextGame(playerCount)
        const targetIndex = GAMES.findIndex(g => g.id === target)
        targetRef.current = targetIndex

        // Build a roulette sequence that only lands on valid games
        // but still cycles through ALL cards visually (including locked)
        // We stop the cursor only when it reaches a valid target index
        function tick() {
            tickCountRef.current += 1
            const canLand      = tickCountRef.current >= 14
            const currentDelay = tickDelayRef.current

            setHighlightIndex(prev => {
                const next = (prev + 1) % GAMES.length
                // Only stop if we can land AND this is our predetermined valid target
                if (canLand && next === targetRef.current) {
                    clearInterval(intervalRef.current)
                    setTimeout(() => {
                        setSelectedGame(GAMES[targetRef.current].id)
                        setSelectorPhase('revealed')
                        setRevealed(true)
                        setTimeout(() => {
                            onDone(GAMES[targetRef.current].id)
                        }, 2500)
                    }, 400)
                }
                return next
            })

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
                {revealed ? "🎉 Tonight's game is…" : '🎲 Selecting minigame…'}
            </h1>

            <div style={styles.cardRow}>
                {GAMES.map((game, i) => {
                    const isHighlighted = highlightIndex === i
                    const isWinner      = revealed && game.id === selectedGame
                    const isLocked      = playerCount < game.minPlayers

                    return (
                        <div
                            key={game.id}
                            style={{
                                ...styles.card,
                                border: `3px solid ${
                                    isWinner        ? game.border
                                        : isHighlighted && !isLocked ? game.border
                                            :                 'rgba(255,255,255,0.08)'
                                }`,
                                background: isWinner
                                    ? `rgba(${hexToRgb(game.color)}, 0.25)`
                                    : isHighlighted && !isLocked
                                        ? `rgba(${hexToRgb(game.color)}, 0.18)`
                                        : 'rgba(255,255,255,0.03)',
                                boxShadow: isWinner
                                    ? `0 0 60px ${game.glow}, 0 0 120px ${game.glow}`
                                    : isHighlighted && !isLocked
                                        ? `0 0 32px ${game.glow}`
                                        : 'none',
                                transform: isWinner
                                    ? 'scale(1.12)'
                                    : isHighlighted && !isLocked
                                        ? 'scale(1.05)'
                                        : 'scale(1)',
                                opacity:   isLocked ? 0.4 : 1,
                                filter:    isLocked ? 'grayscale(0.5)' : 'none',
                            }}
                        >
                            <span style={styles.cardIcon}>{game.icon}</span>

                            <span style={{
                                ...styles.cardLabel,
                                color: isWinner || (isHighlighted && !isLocked)
                                    ? '#fff'
                                    : 'rgba(255,255,255,0.4)',
                            }}>
                {game.label}
              </span>

                            <span style={{
                                ...styles.cardDesc,
                                color: isWinner || (isHighlighted && !isLocked)
                                    ? 'rgba(255,255,255,0.7)'
                                    : 'rgba(255,255,255,0.2)',
                            }}>
                {game.desc}
              </span>

                            {isLocked && (
                                <div style={styles.lockedBadge}>
                                    🔒 Needs {game.minPlayers}+ players
                                </div>
                            )}

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

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `${r}, ${g}, ${b}`
}

const styles = {
    container:    { minHeight:'100vh', background:'#1a1a2e', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:"'Fredoka One', sans-serif", gap:40, padding:32 },
    title:        { fontSize:42, color:'#fff', margin:0, textAlign:'center', textShadow:'0 4px 20px rgba(255,255,255,0.2)' },
    cardRow:      { display:'flex', gap:32, flexWrap:'wrap', justifyContent:'center', alignItems:'stretch' },
    card:         { width:220, borderRadius:28, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, padding:'28px 20px', transition:'all 0.12s ease', textAlign:'center' },
    cardIcon:     { fontSize:64 },
    cardLabel:    { fontSize:26, transition:'color 0.12s', textAlign:'center', width:'100%' },
    cardDesc:     { fontSize:14, textAlign:'center', lineHeight:1.4, width:'100%', transition:'color 0.12s' },
    lockedBadge:  { marginTop:6, borderRadius:50, padding:'5px 14px', fontSize:12, color:'rgba(255,255,255,0.35)', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', letterSpacing:1 },
    winnerBadge:  { marginTop:6, borderRadius:50, padding:'5px 18px', fontSize:12, color:'#fff', letterSpacing:2 },
    revealSub:    { fontSize:22, margin:0 },
    phoneWaiting: { display:'flex', flexDirection:'column', alignItems:'center', gap:16 },
    spinnerEmoji: { fontSize:80 },
    phoneHint:    { fontSize:28, color:'#fff', margin:0 },
    phoneSubHint: { fontSize:18, color:'rgba(255,255,255,0.5)', margin:0 },
}