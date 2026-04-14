import { useMultiplayerState, myPlayer } from 'playroomkit'
import { useState, useEffect, useMemo } from 'react'

const ALL_PROMPTS = [
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

function shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5)
}

export default function ControllerGame() {
    const [phase]         = useMultiplayerState('phase',    'get-ready')
    const [correct]       = useMultiplayerState('correct',  null)
    const [winner]        = useMultiplayerState('winner',   null)
    const [round]         = useMultiplayerState('round',    0)
    const [, setTapEvent] = useMultiplayerState('tapEvent', null)

    const [tapped,       setTapped]       = useState(null)  // label they tapped, or null
    const [options,      setOptions]      = useState([])
    const me = myPlayer()

    // Regenerate options every time the correct answer or round changes
    useEffect(() => {
        setTapped(null)
        if (!correct) return
        const decoys = shuffle(ALL_PROMPTS.filter(p => p.label !== correct.label)).slice(0, 3)
        setOptions(shuffle([correct, ...decoys]))
    }, [correct, round])

    function handleTap(option) {
        if (phase !== 'tap-now' || tapped) return
        const name = me?.getProfile().name ?? 'Player'
        setTapped(option.label)
        setTapEvent({
            name:      name,
            label:     option.label,    // host checks this against the correct answer
            round:     round,
            timestamp: Date.now(),      // phone-side timestamp for reaction time
        })
    }

    if (phase === 'gameover') {
        return (
            <div style={styles.container}>
                <div style={{ fontSize:80 }}>🎉</div>
                <p style={styles.doneText}>Game over!<br />Check the screen for results.</p>
            </div>
        )
    }

    const waiting = phase === 'get-ready' || !correct

    return (
        <div style={styles.container}>
            <p style={styles.hint}>
                {waiting ? '⏳ Get ready…' : 'Tap the one shown on screen!'}
            </p>

            {tapped && (
                <p style={styles.feedback}>
                    {winner === me?.getProfile().name ? '✅ Correct!' : tapped ? '⏳ Waiting…' : ''}
                </p>
            )}
            {winner && winner !== me?.getProfile().name && tapped && (
                <p style={{ ...styles.feedback, color:'rgba(255,100,100,0.8)' }}>
                    Too slow! {winner} got it.
                </p>
            )}

            <div style={styles.grid}>
                {options.map(option => {
                    const isTapped  = tapped === option.label
                    const isWrong   = tapped && isTapped && winner && winner !== me?.getProfile().name
                    const isCorrect = isTapped && winner === me?.getProfile().name

                    return (
                        <button
                            key={option.label}
                            style={{
                                ...styles.optionBtn,
                                background:  isCorrect ? '#6BCB77'
                                    : isWrong   ? 'rgba(255,100,100,0.3)'
                                        : isTapped  ? 'rgba(255,255,255,0.2)'
                                            : waiting   ? 'rgba(255,255,255,0.06)'
                                                :             'rgba(255,255,255,0.12)',
                                border: `2px solid ${isCorrect ? '#6BCB77' : isWrong ? '#FF6B6B' : isTapped ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'}`,
                                transform:  isTapped ? 'scale(0.95)' : 'scale(1)',
                                opacity:    waiting ? 0.4 : 1,
                                cursor:     waiting || tapped ? 'default' : 'pointer',
                            }}
                            onClick={() => handleTap(option)}
                            disabled={!!waiting || !!tapped}
                        >
                            <span style={{ fontSize:32 }}>{option.label.split(' ')[0]}</span>
                            <span style={{ fontSize:16, color:'rgba(255,255,255,0.8)', marginTop:4 }}>
                {option.label.split(' ').slice(1).join(' ')}
              </span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

const styles = {
    container: { minHeight:'100vh', background:'#1a1a2e', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:"'Fredoka One'", gap:20, padding:24, userSelect:'none' },
    hint:      { fontSize:22, color:'rgba(255,255,255,0.7)', margin:0, textAlign:'center' },
    feedback:  { fontSize:18, color:'rgba(255,255,255,0.6)', margin:0 },
    doneText:  { fontSize:26, color:'#fff', textAlign:'center', lineHeight:1.5, margin:0 },
    grid:      { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, width:'100%', maxWidth:340 },
    optionBtn: { borderRadius:16, padding:'20px 8px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.12)', border:'2px solid rgba(255,255,255,0.15)', color:'#fff', fontFamily:"'Fredoka One'", transition:'all 0.12s', minHeight:100 },
}