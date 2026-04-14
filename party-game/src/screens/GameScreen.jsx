import { useState, useEffect, useRef } from 'react'
import { useMultiplayerState } from 'playroomkit'

const PROMPTS = ['🔴 TAP RED','🟡 TAP YELLOW','🔵 TAP BLUE','⭐ TAP STAR','🎯 TAP TARGET','🌈 TAP RAINBOW','🔥 TAP FIRE']
const ROUNDS = 5

export default function GameScreen({ players, onRestart }) {
    const [phase,    setPhase]  = useMultiplayerState('phase',    'get-ready')
    const [prompt,   setPrompt] = useMultiplayerState('prompt',   '')
    const [winner,   setWinner] = useMultiplayerState('winner',   null)
    const [scores,   setScores] = useMultiplayerState('scores',   {})
    const [round,    setRound]  = useMultiplayerState('round',    0)
    const [tapEvent]            = useMultiplayerState('tapEvent', null)

    const timerRef   = useRef(null)
    const roundRef   = useRef(0)
    const phaseRef   = useRef('get-ready')
    const lastTapRef = useRef(null)
    const deadRef    = useRef(false)

    useEffect(() => { roundRef.current = round }, [round])
    useEffect(() => { phaseRef.current = phase }, [phase])

    useEffect(() => {
        deadRef.current = false
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
        const p = PROMPTS[Math.floor(Math.random() * PROMPTS.length)]
        setPrompt(p)
        setWinner(null)
        setRound(r)
        setPhase('get-ready')
        timerRef.current = setTimeout(() => {
            if (deadRef.current) return
            phaseRef.current = 'tap-now'
            setPhase('tap-now')
            timerRef.current = setTimeout(() => {
                if (deadRef.current) return
                doAdvance(roundRef.current)
            }, 3000)
        }, 1500)
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
        if (tapEvent.round !== roundRef.current) return
        if (lastTapRef.current === tapEvent.id) return
        if (phaseRef.current !== 'tap-now') return
        lastTapRef.current = tapEvent.id
        setWinner(tapEvent.name)
        setScores(prev => ({ ...prev, [tapEvent.name]: (prev[tapEvent.name] ?? 0) + 1 }))
        doAdvance(roundRef.current)
    }, [tapEvent])

    if (phase === 'gameover') {
        const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1])
        const topScore = sorted[0]?.[1] ?? 0
        return (
            <div style={styles.container}>
                <h1 style={styles.title}>🏆 Game Over!</h1>
                <div style={styles.scoreList}>
                    {sorted.length === 0 && <p style={{ color:'rgba(255,255,255,0.5)', fontSize:22 }}>No points scored.</p>}
                    {sorted.map(([name, score], i) => (
                        <div key={name} style={{
                            ...styles.scoreRow,
                            background: score === topScore ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.07)',
                            border: score === topScore ? '1px solid rgba(255,215,0,0.4)' : '1px solid transparent',
                        }}>
                            <span>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {name}</span>
                            <span>{score} / {ROUNDS} pts</span>
                        </div>
                    ))}
                </div>
                <button style={styles.restartBtn} onClick={onRestart}>Play Again →</button>
            </div>
        )
    }

    return (
        <div style={styles.container}>
            <div style={styles.roundBadge}>Round {round + 1} / {ROUNDS}</div>
            <div style={styles.promptBox}>
                {phase === 'get-ready'
                    ? <span style={styles.getReady}>Get ready…</span>
                    : <span style={styles.prompt}>{prompt}</span>
                }
            </div>
            {winner && <div style={styles.winnerBanner}>⚡ {winner} was first!</div>}
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
    container:    { minHeight:'100vh', background:'#1a1a2e', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:"'Fredoka One', sans-serif", gap:28, padding:32 },
    title:        { fontSize:64, color:'#FFD93D', margin:0 },
    roundBadge:   { background:'rgba(255,255,255,0.1)', color:'#fff', borderRadius:50, padding:'8px 24px', fontSize:20 },
    promptBox:    { minHeight:160, display:'flex', alignItems:'center', justifyContent:'center' },
    getReady:     { fontSize:48, color:'rgba(255,255,255,0.4)' },
    prompt:       { fontSize:80, lineHeight:1.1, textAlign:'center', color:'#fff', textShadow:'0 0 40px rgba(255,255,255,0.3)' },
    winnerBanner: { fontSize:32, color:'#6BCB77' },
    scoreBar:     { display:'flex', gap:16, flexWrap:'wrap', justifyContent:'center' },
    scoreChip:    { background:'rgba(255,255,255,0.1)', color:'#fff', borderRadius:50, padding:'8px 20px', fontSize:18 },
    scoreList:    { display:'flex', flexDirection:'column', gap:12, width:'100%', maxWidth:440 },
    scoreRow:     { borderRadius:16, padding:'16px 28px', fontSize:26, display:'flex', justifyContent:'space-between', gap:32 },
    restartBtn:   { marginTop:8, background:'#FF6B6B', color:'#fff', border:'none', borderRadius:50, padding:'16px 48px', fontSize:24, fontFamily:"'Fredoka One'", cursor:'pointer', boxShadow:'0 6px 24px rgba(255,107,107,0.4)' },
}