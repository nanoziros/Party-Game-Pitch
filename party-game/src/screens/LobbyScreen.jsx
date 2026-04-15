import { useState } from 'react'
import { getRoomCode } from 'playroomkit'
import { QRCode } from 'react-qr-code'

const COLORS = ['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#C77DFF','#FF9F1C']
const EMOJIS  = ['🎮','🕹️','👾','🎯','🏆','⭐']

export default function LobbyScreen({ players, subPhase, onConfirmPlayers, onStart }) {
    const [boardHovered, setBoardHovered] = useState(false)
    const roomCode = getRoomCode()
    const joinUrl  = roomCode
        ? `${window.location.origin}?roomCode=${roomCode}`
        : 'loading…'

    // ── Sub-phase: QR code first screen ──────────────────────────────────────
    if (subPhase === 'qr') {
        return (
            <div style={styles.container}>
                <h1 style={styles.title}>Crowd Play</h1>
                <p style={styles.subtitle}>Scan to join on your phone</p>

                <div style={styles.qrWrapper}>
                    {roomCode
                        ? <QRCode value={joinUrl} size={220} />
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
                        ...styles.confirmBtn,
                        opacity: players.length >= 1 ? 1 : 0.35,
                        cursor:  players.length >= 1 ? 'pointer' : 'not-allowed',
                    }}
                    disabled={players.length < 1}
                    onClick={onConfirmPlayers}
                >
                    {players.length >= 1 ? "Everyone's in! →" : 'Need at least 1 player'}
                </button>
            </div>
        )
    }

    // ── Sub-phase: Mode selection ─────────────────────────────────────────────
    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Choose Mode</h1>
            <p style={styles.subtitle}>What are we playing?</p>

            <div style={styles.modeGrid}>

                <button style={styles.modeBtn} onClick={onStart}>
                    <span style={styles.modeIcon}>⚡</span>
                    <span style={styles.modeLabel}>Quick Play</span>
                    <span style={styles.modeDesc}>Grab your phones and jump in</span>
                </button>

                {/* Board Game — locked with hover preview */}
                <div
                    style={styles.modeBtnLocked}
                    onMouseEnter={() => setBoardHovered(true)}
                    onMouseLeave={() => setBoardHovered(false)}
                >
                    <div style={styles.lockedBadge}>UPCOMING</div>
                    <span style={styles.modeIcon}>🗺️</span>
                    <span style={styles.modeLabel}>Board Game</span>
                    <span style={styles.modeDesc}>Strategic map, items &amp; events — coming soon</span>

                    <div style={{
                        ...styles.previewPopup,
                        opacity:   boardHovered ? 1 : 0,
                        transform: boardHovered
                            ? 'translateX(-50%) translateY(-8px) scale(1)'
                            : 'translateX(-50%) translateY(0px) scale(0.95)',
                        pointerEvents: 'none',
                    }}>
                        <img
                            src="/boardgame-preview.png"
                            alt="Board game preview"
                            style={styles.previewImg}
                        />
                        <p style={styles.previewLabel}>Sneak peek 👀</p>
                    </div>
                </div>
            </div>

            {/* Small QR for late joiners */}
            {roomCode && (
                <div style={styles.lateJoinRow}>
                    <div style={styles.lateQrWrap}>
                        <QRCode value={joinUrl} size={72} />
                    </div>
                    <div style={styles.lateJoinText}>
                        <span style={styles.lateJoinLabel}>Join late?</span>
                        <span style={styles.lateJoinCode}>{roomCode}</span>
                    </div>
                </div>
            )}

            {/* Late-joiner player chips */}
            {players.length > 0 && (
                <div style={styles.playerGridSmall}>
                    {players.map((p, i) => (
                        <div key={p.id} style={{ ...styles.playerChipSmall, background: COLORS[i % COLORS.length] }}>
                            <span style={styles.playerEmojiSmall}>{EMOJIS[i % EMOJIS.length]}</span>
                            <span style={styles.playerNameSmall}>{p.getProfile().name}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

const styles = {
    container:        { minHeight:'100vh', background:'#1a1a2e', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:"'Fredoka One', sans-serif", gap:28, padding:32, position:'relative' },
    title:            { fontSize:58, color:'#fff', margin:0, textShadow:'0 4px 20px rgba(255,107,107,0.5)' },
    subtitle:         { fontSize:20, color:'rgba(255,255,255,0.6)', margin:0 },

    // QR screen
    qrWrapper:        { background:'#fff', borderRadius:20, padding:28, display:'flex', flexDirection:'column', alignItems:'center', gap:12 },
    qrPlaceholder:    { width:220, height:220, display:'flex', alignItems:'center', justifyContent:'center', fontSize:48 },
    roomCode:         { fontFamily:'monospace', fontSize:32, fontWeight:'bold', letterSpacing:10, color:'#1a1a2e', margin:0 },
    playerGrid:       { display:'flex', flexWrap:'wrap', gap:12, justifyContent:'center', maxWidth:640 },
    playerChip:       { borderRadius:50, padding:'10px 20px', display:'flex', alignItems:'center', gap:8, boxShadow:'0 4px 12px rgba(0,0,0,0.3)' },
    playerEmoji:      { fontSize:22 },
    playerName:       { fontSize:18, color:'#fff', fontWeight:'bold' },
    waiting:          { color:'rgba(255,255,255,0.4)', fontSize:18 },
    confirmBtn:       { background:'#6BCB77', color:'#fff', border:'none', borderRadius:50, padding:'16px 48px', fontSize:24, fontFamily:"'Fredoka One'", boxShadow:'0 6px 24px rgba(107,203,119,0.4)', transition:'opacity 0.2s', cursor:'pointer' },

    // Mode select screen
    modeGrid:         { display:'flex', gap:24, flexWrap:'wrap', justifyContent:'center', marginTop:8 },
    modeBtn:          { width:240, minHeight:200, borderRadius:24, border:'2px solid rgba(255,107,107,0.6)', background:'rgba(255,107,107,0.12)', color:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, cursor:'pointer', transition:'all 0.18s', padding:24, boxShadow:'0 0 32px rgba(255,107,107,0.15)', fontFamily:"'Fredoka One'" },
    modeBtnLocked:    { width:240, minHeight:200, borderRadius:24, border:'2px dashed rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.35)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, cursor:'not-allowed', padding:24, position:'relative' },
    lockedBadge:      { position:'absolute', top:14, right:14, background:'linear-gradient(135deg,#C77DFF,#4D96FF)', color:'#fff', fontSize:11, fontWeight:'bold', letterSpacing:2, padding:'4px 10px', borderRadius:50 },
    modeIcon:         { fontSize:52 },
    modeLabel:        { fontSize:26 },
    modeDesc:         { fontSize:14, textAlign:'center', lineHeight:1.4, opacity:0.8 },
    previewPopup:     { position:'absolute', bottom:'calc(100% + 12px)', left:'50%', background:'#0f0f1e', border:'1px solid rgba(255,255,255,0.12)', borderRadius:16, padding:12, display:'flex', flexDirection:'column', alignItems:'center', gap:8, width:280, transition:'opacity 0.2s ease, transform 0.2s ease', zIndex:10 },
    previewImg:       { width:'100%', borderRadius:10, display:'block' },
    previewLabel:     { fontSize:14, color:'rgba(255,255,255,0.5)', margin:0 },

    // Late-join QR row
    lateJoinRow:      { display:'flex', alignItems:'center', gap:16, background:'rgba(255,255,255,0.05)', borderRadius:16, padding:'12px 20px', border:'1px solid rgba(255,255,255,0.08)' },
    lateQrWrap:       { background:'#fff', borderRadius:10, padding:6 },
    lateJoinText:     { display:'flex', flexDirection:'column', gap:4 },
    lateJoinLabel:    { fontSize:14, color:'rgba(255,255,255,0.45)' },
    lateJoinCode:     { fontSize:22, color:'#fff', fontFamily:'monospace', letterSpacing:6 },

    // Player chips (small, on mode select screen)
    playerGridSmall:  { display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', maxWidth:640 },
    playerChipSmall:  { borderRadius:50, padding:'6px 14px', display:'flex', alignItems:'center', gap:6, boxShadow:'0 2px 8px rgba(0,0,0,0.3)' },
    playerEmojiSmall: { fontSize:16 },
    playerNameSmall:  { fontSize:14, color:'#fff', fontWeight:'bold' },
}