import { useState } from 'react'
import { getRoomCode } from 'playroomkit'
import { QRCode } from 'react-qr-code'

const COLORS = ['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#C77DFF','#FF9F1C']
const EMOJIS  = ['🎮','🕹️','👾','🎯','🏆','⭐']

export default function LobbyScreen({ players, onStart }) {
    const [mode, setMode] = useState(null)
    const roomCode = getRoomCode()
    const joinUrl  = roomCode
        ? `${window.location.origin}?roomCode=${roomCode}`
        : 'loading…'

    if (!mode) {
        return (
            <div style={styles.container}>
                <h1 style={styles.title}>🎉 Party Time!</h1>
                <p style={styles.subtitle}>Choose your game mode</p>

                <div style={styles.modeGrid}>

                    <button style={styles.modeBtn} onClick={() => setMode('quick')}>
                        <span style={styles.modeIcon}>⚡</span>
                        <span style={styles.modeLabel}>Quick Play</span>
                        <span style={styles.modeDesc}>Grab your phones and jump in</span>
                    </button>

                    <div style={styles.modeBtnLocked}>
                        <div style={styles.lockedBadge}>UPCOMING</div>
                        <span style={styles.modeIcon}>🗺️</span>
                        <span style={styles.modeLabel}>Board Game</span>
                        <span style={styles.modeDesc}>Strategic map, items &amp; events — coming soon</span>
                    </div>

                </div>
            </div>
        )
    }

    return (
        <div style={styles.container}>
            <button style={styles.backBtn} onClick={() => setMode(null)}>← Back</button>

            <h1 style={styles.title}>⚡ Quick Play</h1>
            <p style={styles.subtitle}>Scan to join on your phone</p>

            <div style={styles.qrWrapper}>
                {roomCode
                    ? <QRCode value={joinUrl} size={180} />
                    : <div style={styles.qrPlaceholder}>⏳</div>
                }
                <p style={styles.roomCode}>{roomCode ?? '…'}</p>
            </div>

            <div style={styles.playerGrid}>
                {players.length === 0 && (
                    <p style={styles.waiting}>Waiting for players to scan…</p>
                )}
                {players.map((p, i) => (
                    <div key={p.id} style={{ ...styles.playerChip, background: COLORS[i % COLORS.length] }}>
                        <span style={styles.playerEmoji}>{EMOJIS[i % EMOJIS.length]}</span>
                        <span style={styles.playerName}>{p.getProfile().name}</span>
                    </div>
                ))}
            </div>

            <button
                style={{
                    ...styles.startBtn,
                    opacity: players.length >= 1 ? 1 : 0.35,
                    cursor:  players.length >= 1 ? 'pointer' : 'not-allowed',
                }}
                disabled={players.length < 1}
                onClick={onStart}
            >
                {players.length >= 1 ? 'Start Game →' : 'Need at least 1 player'}
            </button>
        </div>
    )
}

const styles = {
    container:     { minHeight:'100vh', background:'#1a1a2e', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:"'Fredoka One', sans-serif", gap:28, padding:32, position:'relative' },
    title:         { fontSize:58, color:'#fff', margin:0, textShadow:'0 4px 20px rgba(255,107,107,0.5)' },
    subtitle:      { fontSize:20, color:'rgba(255,255,255,0.6)', margin:0 },
    modeGrid:      { display:'flex', gap:24, flexWrap:'wrap', justifyContent:'center', marginTop:8 },
    modeBtn:       { width:240, minHeight:200, borderRadius:24, border:'2px solid rgba(255,107,107,0.6)', background:'rgba(255,107,107,0.12)', color:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, cursor:'pointer', transition:'all 0.18s', padding:24, boxShadow:'0 0 32px rgba(255,107,107,0.15)', fontFamily:"'Fredoka One'" },
    modeBtnLocked: { width:240, minHeight:200, borderRadius:24, border:'2px dashed rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.35)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, cursor:'not-allowed', padding:24, position:'relative' },
    lockedBadge:   { position:'absolute', top:14, right:14, background:'linear-gradient(135deg,#C77DFF,#4D96FF)', color:'#fff', fontSize:11, fontWeight:'bold', letterSpacing:2, padding:'4px 10px', borderRadius:50 },
    modeIcon:      { fontSize:52 },
    modeLabel:     { fontSize:26 },
    modeDesc:      { fontSize:14, textAlign:'center', lineHeight:1.4, opacity:0.8 },
    backBtn:       { position:'absolute', top:24, left:24, background:'rgba(255,255,255,0.08)', border:'none', color:'rgba(255,255,255,0.6)', fontFamily:"'Fredoka One'", fontSize:16, borderRadius:50, padding:'8px 20px', cursor:'pointer' },
    qrWrapper:     { background:'#fff', borderRadius:20, padding:24, display:'flex', flexDirection:'column', alignItems:'center', gap:12 },
    qrPlaceholder: { width:180, height:180, display:'flex', alignItems:'center', justifyContent:'center', fontSize:48 },
    roomCode:      { fontFamily:'monospace', fontSize:28, fontWeight:'bold', letterSpacing:8, color:'#1a1a2e', margin:0 },
    playerGrid:    { display:'flex', flexWrap:'wrap', gap:12, justifyContent:'center', maxWidth:600 },
    playerChip:    { borderRadius:50, padding:'10px 20px', display:'flex', alignItems:'center', gap:8, boxShadow:'0 4px 12px rgba(0,0,0,0.3)' },
    playerEmoji:   { fontSize:22 },
    playerName:    { fontSize:18, color:'#fff', fontWeight:'bold' },
    waiting:       { color:'rgba(255,255,255,0.4)', fontSize:18 },
    startBtn:      { background:'#FF6B6B', color:'#fff', border:'none', borderRadius:50, padding:'16px 48px', fontSize:24, fontFamily:"'Fredoka One'", boxShadow:'0 6px 24px rgba(255,107,107,0.4)', transition:'opacity 0.2s' },
}