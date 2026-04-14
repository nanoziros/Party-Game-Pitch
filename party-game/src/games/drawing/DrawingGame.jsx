import { useEffect, useRef } from 'react'
import { isStreamScreen, getState, setState, useMultiplayerState } from 'playroomkit'
import { KEYS } from './useDrawingState'
import { WORDS } from './wordList'

const ROUND_TIME = 45

export default function DrawingGame({ players, onRestart }) {
    const [drawPhase]    = useMultiplayerState(KEYS.phase,       'waiting')
    const [strokes]      = useMultiplayerState(KEYS.strokes,     [])
    const [roundWinner]  = useMultiplayerState(KEYS.roundWinner,  null)
    const [drawRound]    = useMultiplayerState(KEYS.round,        0)
    const [drawScores]   = useMultiplayerState(KEYS.scores,       {})
    const [timeLeft]     = useMultiplayerState(KEYS.timeLeft,     45)
    const [guessEvent]   = useMultiplayerState(KEYS.guessEvent,   null)
    const [currentDrawer]= useMultiplayerState(KEYS.drawer,       null)

    const canvasRef    = useRef(null)
    const timerRef     = useRef(null)
    const countdownRef = useRef(null)
    const deadRef      = useRef(false)
    const roundRef     = useRef(0)
    const lastGuessRef = useRef(null)

    useEffect(() => {
        if (!isStreamScreen()) return
        deadRef.current = false
        setState(KEYS.scores,      {})
        setState(KEYS.strokes,     [])
        setState(KEYS.roundWinner, null)
        const names = players.map(p => p.getProfile().name)
        const order = [...names].sort(() => Math.random() - 0.5)
        setState(KEYS.drawerOrder, order)
        beginRound(0, order)
        return () => {
            deadRef.current = true
            clearTimeout(timerRef.current)
            clearInterval(countdownRef.current)
        }
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.strokeStyle = '#1a1a2e'
        ctx.lineWidth   = 5
        ctx.lineCap     = 'round'
        ctx.lineJoin    = 'round'
        let active = false
        for (const pt of (strokes ?? [])) {
            if (pt.type === 'start') {
                ctx.beginPath()
                ctx.moveTo(pt.x * canvas.width, pt.y * canvas.height)
                active = true
            } else if (pt.type === 'move' && active) {
                ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height)
                ctx.stroke()
            } else if (pt.type === 'end') {
                active = false
            }
        }
    }, [strokes])

    useEffect(() => {
        if (!guessEvent) return
        if (guessEvent.round !== roundRef.current)         return
        if (lastGuessRef.current === guessEvent.timestamp) return
        if (getState(KEYS.phase) !== 'drawing')            return
        lastGuessRef.current = guessEvent.timestamp
        const word   = getState(KEYS.word)   ?? ''
        const drawer = getState(KEYS.drawer) ?? ''
        if (guessEvent.guess.toLowerCase() !== word.toLowerCase()) return
        const name    = guessEvent.name
        const current = getState(KEYS.scores) ?? {}
        const updated = {
            ...current,
            [name]:   (current[name]   ?? 0) + 3,
            [drawer]: (current[drawer] ?? 0) + 2,
        }
        setState(KEYS.scores,      updated)
        setState(KEYS.roundWinner, name)
        endRound(roundRef.current)
    }, [guessEvent])

    function beginRound(r, order) {
        if (deadRef.current) return
        clearTimeout(timerRef.current)
        clearInterval(countdownRef.current)
        roundRef.current = r
        const names  = order ?? getState(KEYS.drawerOrder) ?? []
        const drawer = names[r]
        const word   = WORDS[Math.floor(Math.random() * WORDS.length)]
        setState(KEYS.round,       r)
        setState(KEYS.drawer,      drawer)
        setState(KEYS.word,        word)
        setState(KEYS.strokes,     [])
        setState(KEYS.roundWinner, null)
        setState(KEYS.timeLeft,    ROUND_TIME)
        setState(KEYS.phase,       'drawing')
        let remaining = ROUND_TIME
        countdownRef.current = setInterval(() => {
            remaining -= 1
            setState(KEYS.timeLeft, remaining)
            if (remaining <= 0) {
                clearInterval(countdownRef.current)
                endRound(r)
            }
        }, 1000)
    }

    function endRound(r) {
        if (deadRef.current) return
        clearTimeout(timerRef.current)
        clearInterval(countdownRef.current)
        setState(KEYS.phase, 'reveal')
        const order       = getState(KEYS.drawerOrder) ?? []
        const totalRounds = order.length
        timerRef.current = setTimeout(() => {
            if (deadRef.current) return
            if (r + 1 >= totalRounds) {
                setState(KEYS.phase, 'gameover')
            } else {
                setState(KEYS.phase, 'waiting')
                timerRef.current = setTimeout(() => {
                    if (deadRef.current) return
                    beginRound(r + 1, order)
                }, 2000)
            }
        }, 3000)
    }

    if (drawPhase === 'gameover') {
        const scores   = drawScores ?? {}
        const ranked   = players
            .map(p => ({ name: p.getProfile().name, score: scores[p.getProfile().name] ?? 0 }))
            .sort((a, b) => b.score - a.score)
        const topScore = ranked[0]?.score ?? 0
        const medals   = ['🥇','🥈','🥉']
        return (
            <div style={styles.container}>
                <h1 style={styles.title}>🏆 Final Scores</h1>
                <div style={styles.scoreList}>
                    {ranked.map((p, i) => (
                        <div key={p.name} style={{
                            ...styles.scoreRow,
                            background: p.score === topScore ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.07)',
                            border:     p.score === topScore ? '1px solid rgba(255,215,0,0.4)' : '1px solid transparent',
                        }}>
                            <span style={{ fontSize:26 }}>{medals[i] ?? `#${i+1}`} {p.name}</span>
                            <span style={{ fontSize:22 }}>{p.score} pts</span>
                        </div>
                    ))}
                </div>
                <button style={styles.restartBtn} onClick={onRestart}>Play Again →</button>
            </div>
        )
    }

    const scores      = drawScores ?? {}
    const totalRounds = (getState(KEYS.drawerOrder) ?? []).length || players.length
    const currentWord = drawPhase === 'reveal' ? getState(KEYS.word) : null

    return (
        <div style={styles.container}>

            <div style={styles.topRow}>
                <div style={styles.roundBadge}>Round {drawRound + 1} / {totalRounds}</div>
                <div style={{
                    ...styles.timerBadge,
                    color:      timeLeft <= 10 ? '#FF6B6B' : 'rgba(255,255,255,0.5)',
                    background: timeLeft <= 10 ? 'rgba(255,107,107,0.15)' : 'transparent',
                }}>
                    ⏱ {timeLeft}s
                </div>
            </div>

            {/* Subtle drawer label */}
            {currentDrawer && (
                <p style={styles.drawerInfo}>
                    Drawing player: <span style={styles.drawerName}>{currentDrawer}</span>
                </p>
            )}

            <canvas ref={canvasRef} width={600} height={480} style={styles.canvas} />

            {roundWinner && (
                <div style={styles.winnerBanner}>⚡ {roundWinner} guessed it!</div>
            )}

            {drawPhase === 'reveal' && !roundWinner && (
                <div style={styles.noWinnerBanner}>
                    Time's up! The word was <strong style={{ color:'#C77DFF' }}>{currentWord}</strong>
                </div>
            )}

            <div style={styles.scoreBar}>
                {players.map(p => (
                    <span key={p.id} style={styles.scoreChip}>
            {p.getProfile().name}: {scores[p.getProfile().name] ?? 0}
          </span>
                ))}
            </div>

        </div>
    )
}

const styles = {
    container:      { minHeight:'100vh', background:'#1a1a2e', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:"'Fredoka One', sans-serif", gap:20, padding:32 },
    title:          { fontSize:52, color:'#FFD93D', margin:0 },
    topRow:         { display:'flex', gap:16, alignItems:'center' },
    roundBadge:     { background:'rgba(255,255,255,0.1)', color:'#fff', borderRadius:50, padding:'8px 24px', fontSize:18 },
    timerBadge:     { borderRadius:50, padding:'8px 20px', fontSize:16, transition:'all 0.3s' },
    drawerInfo:     { fontSize:14, color:'rgba(255,255,255,0.3)', margin:0, letterSpacing:1 },
    drawerName:     { color:'rgba(199,125,255,0.6)', fontSize:14 },
    canvas:         { background:'#fff', borderRadius:20, maxWidth:'100%' },
    winnerBanner:   { fontSize:28, color:'#6BCB77' },
    noWinnerBanner: { fontSize:22, color:'rgba(255,255,255,0.6)' },
    scoreBar:       { display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center' },
    scoreChip:      { background:'rgba(255,255,255,0.08)', color:'#fff', borderRadius:50, padding:'6px 18px', fontSize:16 },
    scoreList:      { display:'flex', flexDirection:'column', gap:12, width:'100%', maxWidth:480 },
    scoreRow:       { borderRadius:16, padding:'14px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' },
    restartBtn:     { marginTop:8, background:'#C77DFF', color:'#fff', border:'none', borderRadius:50, padding:'16px 48px', fontSize:24, fontFamily:"'Fredoka One'", cursor:'pointer', boxShadow:'0 6px 24px rgba(199,125,255,0.4)' },
}