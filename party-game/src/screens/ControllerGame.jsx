import { useMultiplayerState, myPlayer } from 'playroomkit'
import { useState, useRef } from 'react'

export default function ControllerGame() {
    const [phase]          = useMultiplayerState('phase',    'get-ready')
    const [prompt]         = useMultiplayerState('prompt',   '')
    const [winner]         = useMultiplayerState('winner',   null)
    const [round]          = useMultiplayerState('round',    0)
    const [, setTapEvent]  = useMultiplayerState('tapEvent', null)
    const [tapped, setTapped] = useState(false)
    const lastRoundRef = useRef(-1)
    const me = myPlayer()

    if (round !== lastRoundRef.current) {
        lastRoundRef.current = round
        if (tapped) setTapped(false)
    }

    function handleTap() {
        if (phase !== 'tap-now' || winner || tapped) return
        const name = me?.getProfile().name ?? 'Player'
        setTapped(true)
        setTapEvent({ name, round, id: `${name}-${round}-${Date.now()}` })
    }

    const canTap = phase === 'tap-now' && !winner && !tapped

    if (phase === 'gameover') {
        return (
            <div style={styles.container}>
                <div style={styles.doneEmoji}>🎉</div>
                <p style={styles.doneText}>Game over!<br/>Check the screen for results.</p>
            </div>
        )
    }

    return (
        <div style={styles.container} onClick={handleTap}>
            <p style={styles.hint}>
                {phase === 'get-ready' ? '⏳ Get ready…' : prompt}
            </p>
            <div style={{
                ...styles.tapBtn,
                background:  canTap ? '#FF6B6B' : tapped ? '#6BCB77' : 'rgba(255,255,255,0.08)',
                transform:   canTap ? 'scale(1.05)' : 'scale(0.93)',
                boxShadow:   canTap ? '0 0 48px rgba(255,107,107,0.5)' : '0 8px 32px rgba(0,0,0,0.4)',
            }}>
                {tapped ? '✓' : winner ? '😬' : canTap ? 'TAP!' : '…'}
            </div>
            {tapped && <p style={styles.feedback}>Nice! Waiting for next round…</p>}
            {winner && !tapped && <p style={styles.feedback}>Too slow! Next round coming…</p>}
        </div>
    )
}

const styles = {
    container: { minHeight:'100vh', background:'#1a1a2e', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:"'Fredoka One'", gap:32, userSelect:'none' },
    hint:      { fontSize:28, color:'rgba(255,255,255,0.7)', margin:0, textAlign:'center', padding:'0 24px' },
    tapBtn:    { width:220, height:220, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:52, color:'#fff', transition:'all 0.15s', cursor:'pointer' },
    feedback:  { fontSize:18, color:'rgba(255,255,255,0.45)', margin:0 },
    doneEmoji: { fontSize:80 },
    doneText:  { fontSize:26, color:'#fff', textAlign:'center', lineHeight:1.5, margin:0 },
}