import { useEffect, useRef } from 'react'
import { isStreamScreen, getState, setState, useMultiplayerState } from 'playroomkit'
import * as THREE from 'three'
import { ROUNDS, ANSWER_TIME } from './countingConfig'
import { CKEYS } from './useCountingState'

function makeGeometry(shape) {
    switch (shape) {
        case 'pyramid':  return new THREE.ConeGeometry(0.5, 1.0, 4)
        case 'torus':    return new THREE.TorusGeometry(0.4, 0.18, 16, 40)
        case 'mixed':    return Math.random() > 0.5
            ? new THREE.BoxGeometry(0.8, 0.8, 0.8)
            : new THREE.ConeGeometry(0.5, 1.0, 4)
        case 'cube':
        default:         return new THREE.BoxGeometry(0.85, 0.85, 0.85)
    }
}

export default function CountingGame({ players, onRestart, onBackToMenu }) {
    const [phase]        = useMultiplayerState(CKEYS.phase,        'waiting')
    const [cRound]       = useMultiplayerState(CKEYS.round,         0)
    const [roundWinners] = useMultiplayerState(CKEYS.roundWinners,  [])
    const [cScores]      = useMultiplayerState(CKEYS.scores,        {})
    const [timeLeft]     = useMultiplayerState(CKEYS.timeLeft,      ANSWER_TIME / 1000)
    const [answerEvent]  = useMultiplayerState(CKEYS.answerEvent,   null)
    const [objects]      = useMultiplayerState(CKEYS.objects,       [])

    const mountRef           = useRef(null)
    const sceneRef           = useRef(null)
    const rendererRef        = useRef(null)
    const cameraRef          = useRef(null)
    const meshesRef          = useRef([])
    const animFrameRef       = useRef(null)
    const frozenRef          = useRef(false)
    const timerRef           = useRef(null)
    const countdownRef       = useRef(null)
    const deadRef            = useRef(false)
    const roundRef           = useRef(0)
    const answersRef         = useRef({})   // { playerName: { answer, timestamp } }
    const lastAnsTimestampRef = useRef({})  // { playerName: timestamp } for dedup

    // ── Init Three.js once ──
    useEffect(() => {
        const mount = mountRef.current
        if (!mount) return
        const W = mount.clientWidth
        const H = mount.clientHeight

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setSize(W, H)
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.shadowMap.enabled = true
        mount.appendChild(renderer.domElement)
        rendererRef.current = renderer

        const scene = new THREE.Scene()
        sceneRef.current = scene

        const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100)
        camera.position.set(0, 0, 16)
        cameraRef.current = camera

        // Lighting — warm key + cool fill + rim = clear 3D depth
        const ambient = new THREE.AmbientLight(0xffffff, 0.4)
        scene.add(ambient)
        const key = new THREE.DirectionalLight(0xfff4e0, 1.6)
        key.position.set(6, 8, 6)
        scene.add(key)
        const fill = new THREE.DirectionalLight(0x9ab0ff, 0.5)
        fill.position.set(-6, -4, 4)
        scene.add(fill)
        const rim = new THREE.DirectionalLight(0xff88cc, 0.3)
        rim.position.set(0, -6, -6)
        scene.add(rim)

        let t = 0
        function animate() {
            animFrameRef.current = requestAnimationFrame(animate)
            t += 0.016
            meshesRef.current.forEach(({ mesh, vel, rotSpeed }) => {
                // Always rotate so 3D reads clearly
                mesh.rotation.x += rotSpeed.x
                mesh.rotation.y += rotSpeed.y
                mesh.rotation.z += rotSpeed.z
                if (!frozenRef.current) {
                    mesh.position.x += vel.x
                    mesh.position.y += vel.y
                    if (Math.abs(mesh.position.x) > 7.5) vel.x *= -1
                    if (Math.abs(mesh.position.y) > 4.2) vel.y *= -1
                }
            })
            renderer.render(scene, camera)
        }
        animate()

        const onResize = () => {
            const W2 = mount.clientWidth
            const H2 = mount.clientHeight
            renderer.setSize(W2, H2)
            camera.aspect = W2 / H2
            camera.updateProjectionMatrix()
        }
        window.addEventListener('resize', onResize)

        return () => {
            deadRef.current = true
            cancelAnimationFrame(animFrameRef.current)
            window.removeEventListener('resize', onResize)
            renderer.dispose()
            if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
        }
    }, [])

    // ── Build scene when objects descriptor arrives ──
    useEffect(() => {
        const scene = sceneRef.current
        if (!scene || !objects?.length) return

        meshesRef.current.forEach(({ mesh }) => {
            scene.remove(mesh)
            mesh.geometry.dispose()
            mesh.material.dispose()
        })
        meshesRef.current = []
        frozenRef.current = false

        const config = ROUNDS[cRound] ?? ROUNDS[0]

        objects.forEach(obj => {
            const geo = makeGeometry(config.shape)
            const mat = new THREE.MeshPhongMaterial({
                color:     obj.isRed ? 0xff3333 : 0x3399ff,
                shininess: 120,
                specular:  new THREE.Color(0.4, 0.4, 0.4),
                emissive:  obj.isRed
                    ? new THREE.Color(0.12, 0.0, 0.0)
                    : new THREE.Color(0.0, 0.04, 0.12),
            })
            const mesh = new THREE.Mesh(geo, mat)
            mesh.position.set(obj.x, obj.y, obj.z)

            // Each object gets a random independent rotation speed
            const rotSpeed = {
                x: (Math.random() - 0.5) * 0.04,
                y: (Math.random() - 0.5) * 0.06,
                z: (Math.random() - 0.5) * 0.03,
            }

            const angle = Math.random() * Math.PI * 2
            const spd   = config.speed
            const vel   = config.moving
                ? { x: Math.cos(angle) * spd * 0.04, y: Math.sin(angle) * spd * 0.04 }
                : { x: 0, y: 0 }

            scene.add(mesh)
            meshesRef.current.push({ mesh, vel, rotSpeed, isRed: obj.isRed })
        })

        if (config.freezeAfter) {
            setTimeout(() => { frozenRef.current = true }, config.freezeAfter)
        }
    }, [objects])

    // ── Bootstrap ──
    useEffect(() => {
        if (!isStreamScreen()) return
        deadRef.current = false
        setState(CKEYS.scores, {})
        beginRound(0)
        return () => {
            deadRef.current = true
            clearTimeout(timerRef.current)
            clearInterval(countdownRef.current)
        }
    }, [])

    // ── React to answers — record each player's latest choice ──
    useEffect(() => {
        if (!answerEvent) return
        if (answerEvent.round !== roundRef.current) return
        if (getState(CKEYS.phase) !== 'answering')  return
        // Dedup: ignore if we already processed this exact event for this player
        if (lastAnsTimestampRef.current[answerEvent.name] === answerEvent.timestamp) return
        lastAnsTimestampRef.current[answerEvent.name] = answerEvent.timestamp
        // Overwrite with latest answer — player can change until timer ends
        answersRef.current[answerEvent.name] = {
            answer:    answerEvent.answer,
            timestamp: answerEvent.timestamp,
        }
    }, [answerEvent])

    function buildObjects(config) {
        const total    = config.minCount + Math.floor(Math.random() * (config.maxCount - config.minCount + 1))
        const redCount = config.mixed ? Math.floor(total * 0.45) + 1 : total
        const objs     = Array.from({ length: total }, (_, i) => ({
            x:     (Math.random() - 0.5) * 13,
            y:     (Math.random() - 0.5) * 7.5,
            z:     (Math.random() - 0.5) * 2,
            isRed: i < redCount,
        }))
        return { objs, correctCount: config.mixed ? redCount : total }
    }

    function beginRound(r) {
        if (deadRef.current) return
        clearTimeout(timerRef.current)
        clearInterval(countdownRef.current)
        roundRef.current = r
        answersRef.current = {}
        lastAnsTimestampRef.current = {}

        const config = ROUNDS[r]
        const { objs, correctCount } = buildObjects(config)

        setState(CKEYS.round,         r)
        setState(CKEYS.phase,         'showing')
        setState(CKEYS.correctCount,  correctCount)
        setState(CKEYS.roundWinners,  [])
        setState(CKEYS.roundConfig,   { label: config.label })
        setState(CKEYS.objects,       objs)
        setState(CKEYS.answerEvent,   null)

        timerRef.current = setTimeout(() => {
            if (deadRef.current) return
            const now = Date.now()
            setState(CKEYS.phase,      'answering')
            setState(CKEYS.roundStart, now)
            let remaining = Math.round(ANSWER_TIME / 1000)
            setState(CKEYS.timeLeft, remaining)
            countdownRef.current = setInterval(() => {
                remaining -= 1
                setState(CKEYS.timeLeft, remaining)
                if (remaining <= 0) {
                    clearInterval(countdownRef.current)
                    endRound(r)
                }
            }, 1000)
        }, config.showTime)
    }

    function endRound(r) {
        if (deadRef.current) return
        clearTimeout(timerRef.current)
        clearInterval(countdownRef.current)
        frozenRef.current = true

        // Score all players who submitted an answer this round
        const correct = getState(CKEYS.correctCount)
        const scores  = { ...(getState(CKEYS.scores) ?? {}) }
        const winners = []
        const roundStart = getState(CKEYS.roundStart) ?? 0
        Object.entries(answersRef.current).forEach(([name, { answer, timestamp }]) => {
            if (answer === correct) {
                const elapsed   = timestamp - roundStart
                const maxPts    = 5
                const minPts    = 1
                const timeRatio = Math.min(elapsed / ANSWER_TIME, 1)
                const pts       = Math.max(minPts, Math.round(maxPts - timeRatio * (maxPts - minPts)))
                scores[name]    = (scores[name] ?? 0) + pts
                winners.push(name)
            } else {
                scores[name] = (scores[name] ?? 0) - 1
            }
        })
        setState(CKEYS.scores,       scores)
        setState(CKEYS.roundWinners, winners)

        setState(CKEYS.phase, 'reveal')
        timerRef.current = setTimeout(() => {
            if (deadRef.current) return
            if (r + 1 >= ROUNDS.length) {
                setState(CKEYS.phase, 'gameover')
            } else {
                setState(CKEYS.phase, 'waiting')
                timerRef.current = setTimeout(() => {
                    if (deadRef.current) return
                    beginRound(r + 1)
                }, 1800)
            }
        }, 2500)
    }

    // ── Game over ──
    if (phase === 'gameover') {
        const scores   = cScores ?? {}
        const ranked   = players
            .map(p => ({ name: p.getProfile().name, score: scores[p.getProfile().name] ?? 0 }))
            .sort((a, b) => b.score - a.score)
        const topScore = ranked[0]?.score ?? 0
        const medals   = ['🥇','🥈','🥉']
        return (
            <div style={styles.container}>
                <h1 style={styles.title}>🏆 Final Scores</h1>
                <div style={styles.scoreList}>
                    {ranked.map((p, i) => (
                        <div key={p.name} style={{
                            ...styles.scoreRow,
                            background: p.score === topScore ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.07)',
                            border:     p.score === topScore ? '1px solid rgba(255,215,0,0.4)' : '1px solid transparent',
                        }}>
                            <span style={{ fontSize:26 }}>{medals[i] ?? `#${i+1}`} {p.name}</span>
                            <span style={{ fontSize:22 }}>{p.score} pts</span>
                        </div>
                    ))}
                </div>
                <div style={styles.endBtnRow}>
                    <button style={styles.restartBtn} onClick={onRestart}>Play Again →</button>
                    <button style={styles.menuBtn} onClick={onBackToMenu}>← Back to Menu</button>
                </div>
            </div>
        )
    }

    const config     = ROUNDS[cRound] ?? ROUNDS[0]
    const scores     = cScores ?? {}
    const correctAns = getState(CKEYS.correctCount)

    return (
        <div style={styles.container}>

            <div style={styles.topRow}>
                <div style={styles.roundBadge}>Round {cRound + 1} / {ROUNDS.length}</div>
                {phase === 'answering' && (
                    <div style={{
                        ...styles.timerBadge,
                        color:      timeLeft <= 2 ? '#FF6B6B' : 'rgba(255,255,255,0.5)',
                        background: timeLeft <= 2 ? 'rgba(255,107,107,0.15)' : 'transparent',
                    }}>
                        ⏱ {timeLeft}s
                    </div>
                )}
            </div>

            <p style={styles.promptLabel}>
                {phase === 'showing'   && config.label}
                {phase === 'answering' && config.label}
                {phase === 'reveal'    && `Answer was: ${correctAns}`}
                {phase === 'waiting'   && 'Get ready…'}
            </p>

            <div ref={mountRef} style={styles.canvas3d} />

            {phase === 'reveal' && roundWinners?.length > 0 && (
                <div style={styles.winnerBanner}>
                    ⚡ {roundWinners.join(', ')} got it!
                </div>
            )}
            {phase === 'reveal' && (!roundWinners || roundWinners.length === 0) && (
                <div style={styles.noWinnerBanner}>Nobody answered correctly!</div>
            )}

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
    container:      { minHeight:'100vh', background:'#1a1a2e', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:"'Fredoka One', sans-serif", gap:16, padding:24 },
    title:          { fontSize:52, color:'#FFD93D', margin:0 },
    topRow:         { display:'flex', gap:16, alignItems:'center' },
    roundBadge:     { background:'rgba(255,255,255,0.1)', color:'#fff', borderRadius:50, padding:'8px 24px', fontSize:18 },
    timerBadge:     { borderRadius:50, padding:'8px 20px', fontSize:16, transition:'all 0.3s' },
    promptLabel:    { fontSize:22, color:'rgba(255,255,255,0.8)', margin:0, textAlign:'center', minHeight:32 },
    canvas3d:       { width:'min(700px, 90vw)', height:'min(400px, 48vw)', borderRadius:20, overflow:'hidden', background:'#0d0d1a' },
    winnerBanner:   { fontSize:28, color:'#6BCB77', margin:0 },
    noWinnerBanner: { fontSize:20, color:'rgba(255,255,255,0.4)', margin:0 },
    scoreBar:       { display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center' },
    scoreChip:      { background:'rgba(255,255,255,0.08)', color:'#fff', borderRadius:50, padding:'6px 18px', fontSize:16 },
    scoreList:      { display:'flex', flexDirection:'column', gap:12, width:'100%', maxWidth:480 },
    scoreRow:       { borderRadius:16, padding:'14px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' },
    endBtnRow:      { display:'flex', gap:16, flexWrap:'wrap', justifyContent:'center', marginTop:8 },
    restartBtn:     { background:'#4D96FF', color:'#fff', border:'none', borderRadius:50, padding:'16px 48px', fontSize:24, fontFamily:"'Fredoka One'", cursor:'pointer', boxShadow:'0 6px 24px rgba(77,150,255,0.4)' },
    menuBtn:        { background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:50, padding:'16px 36px', fontSize:20, fontFamily:"'Fredoka One'", cursor:'pointer' },
}