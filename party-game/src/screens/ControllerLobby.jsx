import { myPlayer } from 'playroomkit'

export default function ControllerLobby() {
    const me = myPlayer()
    return (
        <div style={styles.container}>
            <div style={styles.avatar}>
                {me?.getProfile().name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <h2 style={styles.name}>{me?.getProfile().name ?? 'Loading…'}</h2>
            <p style={styles.hint}>You're in! Waiting for the host to start…</p>
        </div>
    )
}

const styles = {
    container: { minHeight:'100vh', background:'#1a1a2e', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:"'Fredoka One'", gap:20 },
    avatar:    { width:100, height:100, borderRadius:'50%', background:'#FF6B6B', display:'flex', alignItems:'center', justifyContent:'center', fontSize:48, color:'#fff' },
    name:      { fontSize:32, color:'#fff', margin:0 },
    hint:      { fontSize:18, color:'rgba(255,255,255,0.5)', margin:0 },
}