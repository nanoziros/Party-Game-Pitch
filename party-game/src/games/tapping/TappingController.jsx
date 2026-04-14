import { useMultiplayerState, myPlayer, getState } from 'playroomkit'
import { useState, useEffect } from 'react'

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

export default function TappingController() {
    const [phase]         = useMultiplayerState('phase',    'get-ready')
    const [correct]       = useMultiplayerState('correct',  null)
    const [winner]        = useMultiplayerState('winner',   null)
    const [round]         = useMultiplayerState('round',    0)
    const [, setTapEvent] = useMultiplayerState('tapEvent', null)
    const [tapped, setTapped]   = useState(null)
    const [options, setOptions] = useState([])
    const me     = myPlayer()
    const myName = me?.getProfile().name ?? 'Player'

    useEffect(() => {
        setTapped(null)
        if (!correct) return
        const decoys = shuffle(ALL_PROMPTS.filter(p => p.label !== correct.label)).slice(0, 3)
        setOptions(shuffle([correct, ...decoys]))
    }, [correct, round])

    function handleTap(option) {
        if (phase !== 'tap-now' || tapped) return
        setTapped(option.label)
        setTapEvent({ name: myName, label: option.label, round, timestamp: Date.now() })
    }

    if (phase === 'gameover') {
        const finalScores = getState('scores') ?? {}
        const finalTimes  = getState('times')  ?? {}
        const entries     = Object.entries(finalScores).sort((a, b) => b[1] - a[1] || (finalTimes[a[0]] ?? 0) - (finalTimes[b[0]] ?? 0))
        const myScore     = finalScores[myName] ?? 0
        const myTimeMs    = finalTimes[myName]  ?? 0
        const myRank      = entries.findIndex(([n]) => n === myName) + 1
        const medals      = ['🥇','🥈','🥉']

        return (
            <div style={styles.container}>
                <div style={{ fontSize:72 }}>🎉</div>
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
                        <div style={styles.myStatDivider} />
                        <div style={styles.myStat}>
              <span style={styles.myStatNum}>
                {myTimeMs > 0 ? `${(myTimeMs / 1000).toFixed(2)}s` : '—'}
              </span>
                            <span style={styles.myStatLabel}>total time</span>
                        </div>
                    </div>
                </div>
                <p style={styles.checkScreen}>Check the screen for full results</p>
            </div>
        )
    }

    const waiting = phase === 'get-ready' || !correct

    return (
        <div style={styles.container}>
            <p style={styles.hint}>
                {waiting ? '⏳ Get ready…' : 'Tap the one shown on screen!'}
            </p>
            {winner === myName && tapped && <p style={{ ...styles.feedback, color:'#6BCB77' }}>✅ You got it!</p>}
            {winner && winner !== myName && tapped && <p style={{ ...styles.feedback, color:'rgba(255,100,100,0.8)' }}>Too slow! {winner} got it.</p>}
            <div style={styles.grid}>
                {options.map(option => {
                    const isTapped  = tapped === option.label
                    const isWrong   = isTapped && winner && winner !== myName
                    const isCorrect = isTapped && winner === myName
                    return (
                        <button
                            key={option.label}
                            style={{
                                ...styles.optionBtn,
                                background: isCorrect ? 'rgba(107,203,119,0.25)' : isWrong ? 'rgba(255,100,100,0.2)' : isTapped ? 'rgba(255,255,255,0.2)' : waiting ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)',
                                border:     `2px solid ${isCorrect ? '#6BCB77' : isWrong ? '#FF6B6B' : isTapped ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'}`,
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
    container:     { minHeight:'100vh', background:'#1a1a2e', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:"'Fredoka One'", gap:20, padding:24, userSelect:'none' },
    hint:          { fontSize:22, color:'rgba(255,255,255,0.7)', margin:0, textAlign:'center' },
    feedback:      { fontSize:18, margin:0 },
    grid:          { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, width:'100%', maxWidth:340 },
    optionBtn:     { borderRadius:16, padding:'20px 8px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.12)', border:'2px solid rgba(255,255,255,0.15)', color:'#fff', fontFamily:"'Fredoka One'", transition:'all 0.12s', minHeight:100 },
    doneTitle:     { fontSize:32, color:'#fff', margin:0 },
    myCard:        { background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:24, padding:'24px 32px', display:'flex', flexDirection:'column', alignItems:'center', gap:8, width:'100%', maxWidth:300 },
    myCardLabel:   { fontSize:13, color:'rgba(255,255,255,0.4)', margin:0, letterSpacing:2 },
    myName:        { fontSize:32, color:'#fff', margin:0 },
    myRankRow:     { display:'flex', alignItems:'center', gap:10, marginTop:4 },
    myRankText:    { fontSize:18, color:'rgba(255,255,255,0.6)' },
    myStats:       { display:'flex', alignItems:'center', marginTop:8, width:'100%' },
    myStat:        { flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 },
    myStatNum:     { fontSize:28, color:'#FFD93D' },
    myStatLabel:   { fontSize:13, color:'rgba(255,255,255,0.4)', letterSpacing:1 },
    myStatDivider: { width:1, height:40, background:'rgba(255,255,255,0.1)' },
    checkScreen:   { fontSize:15, color:'rgba(255,255,255,0.35)', margin:0 },
}