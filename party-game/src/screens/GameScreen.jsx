import { useEffect, useRef } from 'react'
import { useMultiplayerState, getState, setState } from 'playroomkit'

const PROMPTS = [
    { label: '🔴 RED',     color: '#FF6B6B' },
    { label: '🟡 YELLOW',  color: '#FFD93D' },
    { label: '🔵 BLUE',    color: '#4D96FF' },
    { label: '⭐ STAR',    color: '#FFD93D' },
    { label: '🎯 TARGET',  color: '#FF9F1C' },
    { label: '🌈 RAINBOW', color: '#C77DFF' },
    { label: '🔥 FIRE',    color: '#FF6B6B' },
    { label: '💎 GEM',     color: '#4D96FF' },
    { label: '🍀 CLOVER',  color: '#6BCB77' },
    { label: '🎸 GUITAR',  color: '#C77DFF' },
]
const ROUNDS = 5

export default function GameScreen({ players, onRestart }) {
    const [phase,      setPhase]     = useMultiplayerState('phase',      'get-ready')
    const [correct,    setCorrect]   = useMultiplayerState('correct',    null)
    const [winner,     setWinner]    = useMultiplayerState('winner',     null)
    const [round,      setRound]     = useMultiplayerState('round',      0)
    const [roundStart, setRoundStart]= useMultiplayerState('roundStart', 0)
    const [tapEvent]                 = useMultiplayerState('tapEvent',   null)

    const timerRef   = useRef(null)
    const roundRef   = useRef(0)
    const phaseRef   = useRef('get-ready')
    const lastTapRef = useRef(null)
    const deadRef    = useRef(false)

    useEffect(() => { roundRef.current = round   }, [round])
    useEffect(() => { phaseRef.current = phase   }, [phase])

    useEffect(() => {
        deadRef.current = false
        // Reset scores and times at game start
        setState('scores', {})
        setState('times',  {})
        beginRound(0)
        return () => {
            clearTimeout(timerRef.current)
            deadRef.current = true
        }
    }, [])

    function beginRound(r) {
        if (deadRef.current) return
        clearTimeout(timerRef.current)
        roundRef.current = r
        phaseRef.current = 'get-ready'

        const picked = PROMPTS[Math.floor(Math.random() * PROMPTS.length)]
        setCorrect(picked)
        setWinner(null)
        setRound(r)
        setPhase('get-ready')

        timerRef.current = setTimeout(() => {
            if (deadRef.current) return
            const now = Date.now()
            setRoundStart(now)
            phaseRef.current = 'tap-now'
            setPhase('tap-now')

            // Auto-advance after 4s if nobody taps
            timerRef.current = setTimeout(() => {
                if (deadRef.current) return
                doAdvance(roundRef.current)
            }, 4000)
        }, 1800)
    }

    function doAdvance(r) {
        clearTimeout(timerRef.current)
        if (deadRef.current) return
        if (r + 1 >= ROUNDS) {
            deadRef.current = true
            setPhase('gameover')
        } else {
            beginRound(r + 1)
        }
    }

    useEffect(() => {
        if (!tapEvent) return
        if (tapEvent.round !== roundRef.current)      return
        if (lastTapRef.current === tapEvent.timestamp) return
        if (phaseRef.current !== 'tap-now')            return

        lastTapRef.current = tapEvent.timestamp

        const currentCorrect = getState('correct')
        // Wrong answer — ignore, let others tap
        if (tapEvent.label !== currentCorrect?.label) return

        // Correct answer — record score and reaction time
        const reactionMs    = tapEvent.timestamp - (getState('roundStart') ?? tapEvent.timestamp)
        const name          = tapEvent.name

        const currentScores = getState('scores') ?? {}
        const currentTimes  = getState('times')  ?? {}

        setState('scores', {
            ...currentScores,
            [name]: (currentScores[name] ?? 0) + 1,
        })
        setState('times', {
            ...currentTimes,
            [name]: (currentTimes[name] ?? 0) + reactionMs,
        })

        setWinner(name)
        doAdvance(roundRef.current)
    }, [tapEvent])

    // ── Game Over ──
    if (phase === 'gameover') {
        const finalScores = getState('scores') ?? {}
        const finalTimes  = getState('times')  ?? {}

        // Rank by score desc, tiebreak by total time asc
        const ranked = players
            .map(p => ({
                name:   p.getProfile().name,
                score:  finalScores[p.getProfile().name] ?? 0,
                timeMs: finalTimes[p.getProfile().name]  ?? 0,
            }))
            .sort((a, b) => b.score - a.score || a.timeMs - b.timeMs)

        const fastestName = ranked.reduce((best, p) =>
                p.timeMs > 0 && (best === null || p.timeMs < best.timeMs) ? p : best
            , null)?.name

        return (
            <div style={styles.container}>
                <h1 style={styles.title}>🏆 Final Scores</h1>
                <div style={styles.scoreList}>
                    {ranked.map((p, i) => (
                        <div key={p.name} style={{
                            ...styles.scoreRow,
                            background: i === 0 ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.07)',
                            border:     i === 0 ? '1px solid rgba(255,215,0,0.4)' : '1px solid transparent',
                        }}>
              <span style={{ fontSize:28 }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {p.name}
                  {p.name === fastestName && ' ⚡'}
              </span>
                            <div style={{ textAlign:'right' }}>
                                <div style={{ fontSize:24 }}>{p.score} / {ROUNDS} pts</div>
                                <div style={{ fontSize:16, color:'rgba(255,255,255,0.5)' }}>
                                    {p.timeMs > 0 ? `${(p.timeMs / 1000).toFixed(2)}s total` : 'no points'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {fastestName && (
                    <p style={styles.fastestBadge}>⚡ Fastest overall: {fastestName}</p>
                )}
                <button style={styles.restartBtn} onClick={onRestart}>Play Again →</button>
            </div>
        )
    }

    // ── In-game ──
    const scores = getState('scores') ?? {}

    return (
        <div style={styles.container}>
            <div style={styles.roundBadge}>Round {round + 1} / {ROUNDS}</div>

            <div style={styles.promptBox}>
                {phase === 'get-ready' ? (
                    <span style={styles.getReady}>Get ready…</span>
                ) : (
                    <div style={{ textAlign:'center' }}>
                        <div style={styles.promptLabel}>TAP THIS ON YOUR PHONE</div>
                        <div style={{
                            ...styles.promptTarget,
                            color: correct?.color ?? '#fff',
                            textShadow: `0 0 40px ${correct?.color ?? '#fff'}`,
                        }}>
                            {correct?.label}
                        </div>
                    </div>
                )}
            </div>

            {winner && <div style={styles.winnerBanner}>⚡ {winner} was fastest!</div>}

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
    container:    { minHeight:'100vh', background:'#1a1a2e', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:"'Fredoka One', sans-serif", gap:24, padding:32 },
    title:        { fontSize:56, color:'#FFD93D', margin:0 },
    roundBadge:   { background:'rgba(255,255,255,0.1)', color:'#fff', borderRadius:50, padding:'8px 24px', fontSize:20 },
    promptBox:    { minHeight:180, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' },
    promptLabel:  { fontSize:18, color:'rgba(255,255,255,0.5)', letterSpacing:3, marginBottom:8 },
    promptTarget: { fontSize:72, lineHeight:1.1, textAlign:'center', color:'#fff', transition:'color 0.2s' },
    getReady:     { fontSize:48, color:'rgba(255,255,255,0.4)' },
    winnerBanner: { fontSize:28, color:'#6BCB77' },
    scoreBar:     { display:'flex', gap:16, flexWrap:'wrap', justifyContent:'center' },
    scoreChip:    { background:'rgba(255,255,255,0.1)', color:'#fff', borderRadius:50, padding:'8px 20px', fontSize:18 },
    scoreList:    { display:'flex', flexDirection:'column', gap:12, width:'100%', maxWidth:480 },
    scoreRow:     { borderRadius:16, padding:'14px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:16 },
    fastestBadge: { fontSize:22, color:'#FFD93D', margin:0 },
    restartBtn:   { marginTop:8, background:'#FF6B6B', color:'#fff', border:'none', borderRadius:50, padding:'16px 48px', fontSize:24, fontFamily:"'Fredoka One'", cursor:'pointer', boxShadow:'0 6px 24px rgba(255,107,107,0.4)' },
}