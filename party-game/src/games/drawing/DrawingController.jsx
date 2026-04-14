import { myPlayer, getState, setState, useMultiplayerState } from 'playroomkit'
import { useRef, useState, useEffect, useCallback } from 'react'
import { KEYS } from './useDrawingState'

export default function DrawingController() {
    const me     = myPlayer()
    const myName = me?.getProfile().name ?? 'Player'

    // Only subscribe to the state values this component needs to re-render on
    const [drawPhase]    = useMultiplayerState(KEYS.phase,       'waiting')
    const [currentDrawer]= useMultiplayerState(KEYS.drawer,      null)
    const [drawRound]    = useMultiplayerState(KEYS.round,        0)
    const [roundWinner]  = useMultiplayerState(KEYS.roundWinner,  null)
    const [timeLeft]     = useMultiplayerState(KEYS.timeLeft,     45)
    const [drawScores]   = useMultiplayerState(KEYS.scores,       {})

    const isMyTurn = currentDrawer === myName

    const [guess, setGuess]         = useState('')
    const [submitted, setSubmitted] = useState(false)
    const canvasRef    = useRef(null)
    const isDrawing    = useRef(false)
    const strokeBatch  = useRef([])
    const flushTimer   = useRef(null)

    // Reset guess each round
    useEffect(() => {
        setGuess('')
        setSubmitted(false)
    }, [drawRound])

    // ── Coordinate helper ──
    function getPos(e) {
        const canvas = canvasRef.current
        if (!canvas) return { x: 0, y: 0 }
        const rect = canvas.getBoundingClientRect()
        const src  = e.touches ? e.touches[0] : e
        return {
            x: (src.clientX - rect.left) / rect.width,
            y: (src.clientY - rect.top)  / rect.height,
        }
    }

    // ── Draw handlers ──
    const startDraw = useCallback((e) => {
        if (!isMyTurn || drawPhase !== 'drawing') return
        e.preventDefault()
        isDrawing.current = true
        const pos = getPos(e)
        strokeBatch.current.push({ type: 'start', ...pos })
        scheduleFlush()
    }, [isMyTurn, drawPhase])

    const moveDraw = useCallback((e) => {
        if (!isDrawing.current || !isMyTurn) return
        e.preventDefault()
        const pos = getPos(e)
        strokeBatch.current.push({ type: 'move', ...pos })
        scheduleFlush()
    }, [isMyTurn])

    const endDraw = useCallback((e) => {
        if (!isMyTurn) return
        e.preventDefault()
        isDrawing.current = false
        strokeBatch.current.push({ type: 'end' })
        scheduleFlush()
    }, [isMyTurn])

    function scheduleFlush() {
        if (flushTimer.current) return
        flushTimer.current = setTimeout(() => {
            flushTimer.current = null
            if (strokeBatch.current.length === 0) return
            const batch   = strokeBatch.current.splice(0)
            const current = getState(KEYS.strokes) ?? []
            setState(KEYS.strokes, [...current, ...batch])
        }, 50)
    }

    // ── Attach touch listeners with passive:false directly on canvas ──
    // React synthetic events cannot set passive:false which is required
    // for preventDefault() to work on mobile touch events
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || !isMyTurn) return

        const opts = { passive: false }
        canvas.addEventListener('touchstart',  startDraw, opts)
        canvas.addEventListener('touchmove',   moveDraw,  opts)
        canvas.addEventListener('touchend',    endDraw,   opts)
        canvas.addEventListener('touchcancel', endDraw,   opts)

        return () => {
            canvas.removeEventListener('touchstart',  startDraw, opts)
            canvas.removeEventListener('touchmove',   moveDraw,  opts)
            canvas.removeEventListener('touchend',    endDraw,   opts)
            canvas.removeEventListener('touchcancel', endDraw,   opts)
        }
    }, [isMyTurn, startDraw, moveDraw, endDraw])

    // ── Render strokes on controller canvas (drawer sees their own drawing) ──
    const [strokes] = useMultiplayerState(KEYS.strokes, [])
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.strokeStyle = '#1a1a2e'
        ctx.lineWidth   = 6
        ctx.lineCap     = 'round'
        ctx.lineJoin    = 'round'
        let active = false
        for (const pt of strokes) {
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

    // ── Guess submit ──
    function handleGuess() {
        const trimmed = guess.trim().toLowerCase()
        if (!trimmed || submitted) return
        setState(KEYS.guessEvent, {
            name:      myName,
            guess:     trimmed,
            round:     drawRound,
            timestamp: Date.now(),
        })
        setSubmitted(true)
        setGuess('')
    }

    // ── Game over ──
    if (drawPhase === 'gameover') {
        const scores  = drawScores ?? {}
        const entries = Object.entries(scores).sort((a, b) => b[1] - a[1])
        const myScore = scores[myName] ?? 0
        const myRank  = entries.findIndex(([n]) => n === myName) + 1
        const medals  = ['🥇','🥈','🥉']
        return (
            <div style={styles.container}>
                <div style={{ fontSize:72 }}>🎨</div>
                <p style={styles.doneTitle}>Game over!</p>
                <div style={styles.myCard}>
                    <p style={styles.myCardLabel}>YOU WERE</p>
                    <p style={styles.myName}>{myName}</p>
                    <div style={styles.myRankRow}>
                        <span style={{ fontSize:36 }}>{medals[myRank - 1] ?? `#${myRank}`}</span>
                        <span style={styles.myRankText}>Place {myRank} of {entries.length}</span>
                    </div>
                    <div style={styles.myStats}>
                        <div style={styles.myStat}>
                            <span style={styles.myStatNum}>{myScore}</span>
                            <span style={styles.myStatLabel}>points</span>
                        </div>
                    </div>
                </div>
                <p style={styles.checkScreen}>Check the screen for full results</p>
            </div>
        )
    }

    // ── Between rounds ──
    if (drawPhase === 'waiting' || drawPhase === 'reveal') {
        return (
            <div style={styles.container}>
                <div style={{ fontSize:64 }}>{drawPhase === 'reveal' ? '⏱️' : '⏳'}</div>
                <p style={styles.hint}>
                    {drawPhase === 'reveal'
                        ? roundWinner ? `⚡ ${roundWinner} guessed it!` : 'Nobody got it…'
                        : 'Get ready for next round…'
                    }
                </p>
            </div>
        )
    }

    // ── Drawer screen ──
    if (isMyTurn) {
        const word = getState(KEYS.word) ?? ''
        return (
            <div style={styles.container}>
                <p style={styles.hint}>You're drawing!</p>
                <div style={styles.wordBadge}>{word}</div>
                <p style={styles.timerText}>⏱ {timeLeft}s left</p>
                <canvas
                    ref={canvasRef}
                    width={600}
                    height={600}
                    style={styles.canvas}
                    // Mouse events for desktop testing
                    onMouseDown={startDraw}
                    onMouseMove={moveDraw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    // Touch events handled via addEventListener above (passive:false)
                />
                <button style={styles.clearBtn} onClick={() => setState(KEYS.strokes, [])}>
                    Clear ✕
                </button>
            </div>
        )
    }

    // ── Guesser screen ──
    return (
        <div style={styles.container}>
            <p style={styles.hint}>
                {drawPhase === 'drawing'
                    ? `${currentDrawer} is drawing…`
                    : '⏳ Get ready…'
                }
            </p>
            <p style={styles.timerText}>⏱ {timeLeft}s left</p>

            {submitted ? (
                <div style={styles.submittedBox}>
                    <p style={{ color:'rgba(255,255,255,0.5)', fontSize:18, margin:0 }}>
                        Guess submitted! Waiting…
                    </p>
                </div>
            ) : (
                <div style={styles.guessBox}>
                    <input
                        style={styles.guessInput}
                        type="text"
                        placeholder="Type your guess…"
                        value={guess}
                        onChange={e => setGuess(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleGuess()}
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                    />
                    <button style={styles.guessBtn} onClick={handleGuess}>
                        Submit
                    </button>
                </div>
            )}

            {roundWinner && (
                <p style={{ color:'#6BCB77', fontSize:20, margin:0 }}>
                    ⚡ {roundWinner} got it!
                </p>
            )}
        </div>
    )
}

const styles = {
    container:   { minHeight:'100vh', background:'#1a1a2e', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:"'Fredoka One'", gap:16, padding:24, userSelect:'none', WebkitUserSelect:'none' },
    hint:        { fontSize:22, color:'rgba(255,255,255,0.7)', margin:0, textAlign:'center' },
    wordBadge:   { background:'rgba(199,125,255,0.2)', border:'2px solid rgba(199,125,255,0.6)', color:'#C77DFF', borderRadius:50, padding:'10px 28px', fontSize:28, letterSpacing:2 },
    timerText:   { fontSize:14, color:'rgba(255,255,255,0.4)', margin:0 },
    canvas:      { background:'#fff', borderRadius:16, display:'block', cursor:'crosshair', touchAction:'none', WebkitTouchCallout:'none', width:'min(75vw, 300px)', height:'min(75vw, 300px)' },
    clearBtn:    { background:'rgba(255,100,100,0.2)', border:'1px solid rgba(255,100,100,0.4)', color:'rgba(255,100,100,0.8)', borderRadius:50, padding:'8px 24px', fontSize:16, fontFamily:"'Fredoka One'", cursor:'pointer' },
    guessBox:    { display:'flex', flexDirection:'column', gap:12, width:'100%', maxWidth:300 },
    guessInput:  { background:'rgba(255,255,255,0.08)', border:'2px solid rgba(255,255,255,0.2)', borderRadius:12, padding:'14px 18px', fontSize:20, color:'#fff', fontFamily:"'Fredoka One'", outline:'none', textAlign:'center' },
    guessBtn:    { background:'#C77DFF', border:'none', borderRadius:50, padding:'14px', fontSize:20, color:'#fff', fontFamily:"'Fredoka One'", cursor:'pointer' },
    submittedBox:{ background:'rgba(255,255,255,0.05)', borderRadius:16, padding:'20px 32px' },
    checkScreen: { fontSize:15, color:'rgba(255,255,255,0.35)', margin:0 },
    myCard:      { background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:24, padding:'24px 32px', display:'flex', flexDirection:'column', alignItems:'center', gap:8, width:'100%', maxWidth:300 },
    myCardLabel: { fontSize:13, color:'rgba(255,255,255,0.4)', margin:0, letterSpacing:2 },
    myName:      { fontSize:32, color:'#fff', margin:0 },
    myRankRow:   { display:'flex', alignItems:'center', gap:10, marginTop:4 },
    myRankText:  { fontSize:18, color:'rgba(255,255,255,0.6)' },
    myStats:     { display:'flex', alignItems:'center', marginTop:8 },
    myStat:      { flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 },
    myStatNum:   { fontSize:28, color:'#FFD93D' },
    myStatLabel: { fontSize:13, color:'rgba(255,255,255,0.4)', letterSpacing:1 },
    doneTitle:   { fontSize:32, color:'#fff', margin:0 },
}