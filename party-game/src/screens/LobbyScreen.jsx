import { getRoomCode } from "playroomkit"
import QRCode from "react-qr-code"

const COLORS = ["#FF6B6B","#FFD93D","#6BCB77","#4D96FF","#C77DFF","#FF9F1C"]
const EMOJIS  = ["🎮","🕹️","👾","🎯","🏆","⭐"]

export default function LobbyScreen({ players, onStart }) {
    const roomCode = getRoomCode()
    const joinUrl  = roomCode
        ? `https://joinplayroom.com/${roomCode}`
        : "loading…"

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>🎉 Party Time!</h1>
            <p style={styles.subtitle}>Scan to join on your phone</p>

            <div style={styles.qrWrapper}>
                {roomCode
                    ? <QRCode value={joinUrl} size={180} />
                    : <div style={styles.qrPlaceholder}>⏳</div>
                }
                <p style={styles.roomCode}>{roomCode ?? "…"}</p>
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
                    cursor: players.length >= 1 ? "pointer" : "not-allowed",
                }}
                disabled={players.length < 1}
                onClick={onStart}
            >
                {players.length >= 1 ? "Start Game →" : "Need at least 1 player"}
            </button>
        </div>
    )
}

const styles = {
    container:      { minHeight:"100vh", background:"#1a1a2e", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'Fredoka One', sans-serif", gap:24, padding:32 },
    title:          { fontSize:64, color:"#fff", margin:0, textShadow:"0 4px 20px rgba(255,107,107,0.5)" },
    subtitle:       { fontSize:22, color:"rgba(255,255,255,0.6)", margin:0 },
    qrWrapper:      { background:"#fff", borderRadius:20, padding:24, display:"flex", flexDirection:"column", alignItems:"center", gap:12 },
    qrPlaceholder:  { width:180, height:180, display:"flex", alignItems:"center", justifyContent:"center", fontSize:48 },
    roomCode:       { fontFamily:"monospace", fontSize:28, fontWeight:"bold", letterSpacing:8, color:"#1a1a2e", margin:0 },
    playerGrid:     { display:"flex", flexWrap:"wrap", gap:12, justifyContent:"center", maxWidth:600 },
    playerChip:     { borderRadius:50, padding:"10px 20px", display:"flex", alignItems:"center", gap:8, boxShadow:"0 4px 12px rgba(0,0,0,0.3)" },
    playerEmoji:    { fontSize:22 },
    playerName:     { fontSize:18, color:"#fff", fontWeight:"bold" },
    waiting:        { color:"rgba(255,255,255,0.4)", fontSize:18 },
    startBtn:       { background:"#FF6B6B", color:"#fff", border:"none", borderRadius:50, padding:"16px 48px", fontSize:24, fontFamily:"'Fredoka One'", boxShadow:"0 6px 24px rgba(255,107,107,0.4)", transition:"opacity 0.2s" },
}