import { myPlayer, getState, setState, useMultiplayerState } from 'playroomkit'
import { useState, useEffect } from 'react'
import { CKEYS } from './useCountingState'
import { ROUNDS, ANSWER_TIME } from './countingConfig'

const PAD = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export default function CountingController() {
    const me     = myPlayer()
    const myName = me?.getProfile().name ?? 'Player'

    const [phase]       = useMultiplayerState(CKEYS.phase,       'waiting')
    const [cRound]      = useMultiplayerState(CKEYS.round,        0)
    const [roundWinner] = useMultiplayerState(CKEYS.roundWinner,  null)
    const [timeLeft]    = useMultiplayerState(CKEYS.timeLeft,     ANSWER_TIME / 1000)
    const [cScores]     = useMultiplayerState(CKEYS.scores,       {})

    const [picked,   setPicked]   = useState(null)
    const [feedback, setFeedback] = useState(null)

    useEffect(() => {
        setPicked(null)
        setFeedback(null)
    }, [cRound])

    function handlePick(num) {
        if (phase !== 'answering' || picked !== null) return
        setPicked(num)
        setState(CKEYS.answerEvent, {
            name:      myName,
            answer:    num,
            round:     cRound,
            timestamp: Date.now(),
        })
    }

    useEffect(() => {
        if (phase !== 'reveal' || picked === null) return
        const correct = getState(CKEYS.correctCount)
        setFeedback(picked === correct ? 'correct' : 'wrong')
    }, [phase])

    const config    = ROUNDS[cRound] ?? ROUNDS[0]
    const totalSecs = ANSWER_TIME / 1000

    if (phase === 'gameover') {
        const scores  = cScores ?? {}
        const entries = Object.entries(scores).sort((a, b) => b[1] - a[1])
        const myScore = scores[myName] ?? 0
        const myRank  = entries.findIndex(([n]) => n === myName) + 1
        const medals  = ['🥇','🥈','🥉']
        return (
            <div style={styles.container}>
                <div style={{ fontSize:72 }}>🔢</div>
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

    if (phase === 'waiting' || phase === 'showing') {
        return (
            <div style={styles.container}>
                <div style={{ fontSize:64 }}>👀</div>
                <p style={styles.hint}>
                    {phase === 'showing' ? config.label : 'Get ready…'}
                </p>
                <p style={styles.subHint}>Watch the screen carefully!</p>
            </div>
        )
    }

    if (phase === 'reveal') {
        return (
            <div style={styles.container}>
                <div style={{ fontSize:64 }}>
                    {feedback === 'correct' ? '✅' : feedback === 'wrong' ? '❌' : '⏱️'}
                </div>
                <p style={styles.hint}>
                    {feedback === 'correct' ? 'Correct!'
                        : feedback === 'wrong' ? `Wrong! You said ${picked}`
                            : "Time's up!"}
                </p>
                {roundWinner && (
                    <p style={{ color:'#6BCB77', fontSize:18, margin:0 }}>⚡ {roundWinner} got it first!</p>
                )}
            </div>
        )
    }

    const canAnswer = phase === 'answering' && picked === null

    return (
        <div style={styles.container}>
            <p style={styles.hint}>{config.label}</p>

            {/* Timer bar */}
            <div style={styles.timerTrack}>
                <div style={{
                    ...styles.timerFill,
                    width:      `${(timeLeft / totalSecs) * 100}%`,
                    background: timeLeft <= 2 ? '#FF6B6B' : '#4D96FF',
                }} />
            </div>

            {picked !== null ? (
                <div style={styles.pickedBadge}>
                    You answered: <strong>{picked}</strong>
                </div>
            ) : (
                <div style={styles.pad}>
                    {PAD.map(num => (
                        <button
                            key={num}
                            style={{
                                ...styles.padBtn,
                                opacity:    canAnswer ? 1 : 0.35,
                                cursor:     canAnswer ? 'pointer' : 'default',
                                background: canAnswer ? 'rgba(77,150,255,0.18)' : 'rgba(255,255,255,0.04)',
                                border:     `2px solid ${canAnswer ? 'rgba(77,150,255,0.5)' : 'rgba(255,255,255,0.08)'}`,
                                transform:  canAnswer ? 'scale(1)' : 'scale(0.97)',
                            }}
                            onClick={() => handlePick(num)}
                            disabled={!canAnswer}
                        >
                            {num}
                        </button>
                    ))}
                </div>
            )}

            {roundWinner && (
                <p style={{ color:'#6BCB77', fontSize:18, margin:0 }}>
                    ⚡ {roundWinner} got it!
                </p>
            )}
        </div>
    )
}

const styles = {
    container:   { minHeight:'100vh', background:'#1a1a2e', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:"'Fredoka One'", gap:20, padding:24, userSelect:'none' },
    hint:        { fontSize:20, color:'rgba(255,255,255,0.8)', margin:0, textAlign:'center', padding:'0 16px' },
    subHint:     { fontSize:14, color:'rgba(255,255,255,0.3)', margin:0 },
    timerTrack:  { width:'100%', maxWidth:300, height:6, background:'rgba(255,255,255,0.08)', borderRadius:3, overflow:'hidden' },
    timerFill:   { height:'100%', borderRadius:3, transition:'width 1s linear, background 0.3s' },
    pad:         { display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:10, width:'100%', maxWidth:310 },
    padBtn:      { borderRadius:12, padding:'16px 0', fontSize:24, color:'#fff', fontFamily:"'Fredoka One'", transition:'all 0.1s', textAlign:'center', border:'none' },
    pickedBadge: { background:'rgba(77,150,255,0.12)', border:'2px solid rgba(77,150,255,0.35)', color:'#4D96FF', borderRadius:14, padding:'14px 28px', fontSize:20 },
    doneTitle:   { fontSize:32, color:'#fff', margin:0 },
    myCard:      { background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:24, padding:'24px 32px', display:'flex', flexDirection:'column', alignItems:'center', gap:8, width:'100%', maxWidth:300 },
    myCardLabel: { fontSize:13, color:'rgba(255,255,255,0.4)', margin:0, letterSpacing:2 },
    myName:      { fontSize:32, color:'#fff', margin:0 },
    myRankRow:   { display:'flex', alignItems:'center', gap:10, marginTop:4 },
    myRankText:  { fontSize:18, color:'rgba(255,255,255,0.6)' },
    myStats:     { display:'flex', alignItems:'center', marginTop:8 },
    myStat:      { flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 },
    myStatNum:   { fontSize:28, color:'#FFD93D' },
    myStatLabel: { fontSize:13, color:'rgba(255,255,255,0.4)', letterSpacing:1 },
    checkScreen: { fontSize:15, color:'rgba(255,255,255,0.35)', margin:0 },
}