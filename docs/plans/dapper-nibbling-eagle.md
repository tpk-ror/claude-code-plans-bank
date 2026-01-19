# FartMaster - Soundboard App Implementation Plan

## Overview

A cross-platform soundboard app with visionOS-inspired glassmorphism design, using **Tauri** (Rust backend) + **Vanilla HTML/CSS/JS** (frontend).

## Requirements Summary

| Feature | Decision |
|---------|----------|
| Platform | Desktop (Windows, macOS, Linux) via Tauri |
| Design | visionOS glassmorphism (blur, translucency) |
| Layout | 3x3 grid (9 sound buttons) |
| Recording | Hold to record |
| Playback | Layer/overlap sounds |
| Long-press | Toggle loop mode |
| Storage | Local only (JSON + WAV files) |
| MVP Focus | Core functionality first |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (WebView)                │
│  ┌───────────────────────────────────────────────┐ │
│  │  HTML/CSS (visionOS glassmorphism)            │ │
│  │  JavaScript (UI interactions, Tauri invoke)   │ │
│  └───────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│                 Tauri Commands (IPC)                │
├─────────────────────────────────────────────────────┤
│                   Rust Backend                      │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │   Audio     │  │   State     │  │  Storage   │ │
│  │ (rodio/cpal)│  │ Management  │  │ (JSON/WAV) │ │
│  └─────────────┘  └─────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## Project Structure

```
fartmaster/
├── src-tauri/
│   ├── Cargo.toml           # Rust dependencies
│   ├── tauri.conf.json      # Tauri configuration
│   ├── src/
│   │   ├── main.rs          # Entry point + Tauri setup
│   │   ├── commands.rs      # Tauri command handlers
│   │   ├── audio/
│   │   │   ├── mod.rs
│   │   │   ├── player.rs    # Playback with rodio
│   │   │   └── recorder.rs  # Recording with cpal
│   │   ├── state.rs         # App state management
│   │   └── storage.rs       # File persistence
├── src/
│   ├── index.html           # Main HTML structure
│   ├── styles.css           # visionOS glassmorphism
│   └── main.js              # UI logic + Tauri IPC
└── package.json             # (optional, for dev server)
```

---

## Implementation Phases

### Phase 1: Project Setup

**Tasks:**
1. Install Tauri CLI: `cargo install tauri-cli`
2. Create project: `cargo tauri init`
3. Configure `tauri.conf.json` with window settings
4. Add Rust dependencies to `Cargo.toml`:
   - `rodio` (playback)
   - `cpal` (recording)
   - `hound` (WAV encoding)
   - `serde` + `serde_json` (serialization)
   - `uuid` (sound IDs)
   - `dirs` (data directory paths)

**Verify:** `cargo tauri dev` opens an empty window

---

### Phase 2: Static UI

**Tasks:**
1. Create `index.html` with 3x3 button grid structure
2. Implement glassmorphism CSS in `styles.css`:
   - Gradient background
   - `backdrop-filter: blur()` for glass effect
   - Translucent backgrounds with `rgba()`
   - Subtle borders and shadows
   - Smooth hover/active transitions
3. Add placeholder JavaScript for button interactions

**Key CSS:**
```css
.sound-button {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
}
```

**Verify:** App shows beautiful glassmorphism grid

---

### Phase 3: Audio Playback

**Tasks:**
1. Create `audio/player.rs` with rodio:
   - Initialize `OutputStream` and `OutputStreamHandle`
   - Create `Sink` per sound for layered playback
   - Support loop mode via `repeat_infinite()`
2. Create Tauri commands:
   - `play_sound(id)` - play a sound
   - `stop_sound(id)` - stop specific sound
   - `toggle_loop(id)` - toggle loop mode
3. Wire JavaScript to call Tauri commands

**Verify:** Click button, hear test sound play

---

### Phase 4: Audio Recording

**Tasks:**
1. Create `audio/recorder.rs` with cpal:
   - Get default input device
   - Build input stream capturing to buffer
   - Save buffer as WAV with hound
2. Create Tauri commands:
   - `start_recording(slot_index)`
   - `stop_recording() -> SoundData`
3. Implement hold-to-record in JavaScript:
   - `mousedown`/`touchstart` - start recording
   - `mouseup`/`touchend` - stop and save

**Verify:** Hold button, record voice, release, then play back

---

### Phase 5: State Management

**Tasks:**
1. Define `Sound` struct in `state.rs`:
   ```rust
   struct Sound {
       id: Uuid,
       name: String,
       file_path: String,
       is_looping: bool,
   }
   ```
2. Define `AppState` with 9 sound slots
3. Create Tauri commands for state:
   - `get_state() -> AppState`
   - `update_slot(index, sound)`
   - `clear_slot(index)`
4. Sync frontend with backend state on load

**Verify:** State persists during app session

---

### Phase 6: File Persistence

**Tasks:**
1. Create `storage.rs`:
   - `get_data_dir()` - cross-platform data path
   - `save_state(state)` - write JSON
   - `load_state()` - read JSON
2. Save recordings to `{data_dir}/recordings/`
3. Auto-save state on changes
4. Load state on app startup

**Verify:** Close app, reopen, sounds persist

---

### Phase 7: Long-Press Loop Toggle

**Tasks:**
1. Implement press duration detection in JS:
   - Track `mousedown` timestamp
   - On `mouseup`: if > 500ms, toggle loop; else play
2. Update UI to show loop indicator (infinity symbol)
3. Toggle `is_looping` in backend state

**Verify:** Long-press shows loop badge, sound loops when played

---

### Phase 8: Polish

**Tasks:**
1. Add visual feedback:
   - Playing state (pulsing glow animation)
   - Recording state (red indicator)
   - Empty slot state (dashed border, + icon)
2. Add recording overlay with timer
3. Handle edge cases:
   - No microphone permission
   - File system errors
4. Test on Windows, macOS, Linux

**Verify:** Smooth, polished user experience

---

## Key Files to Create

| File | Purpose |
|------|---------|
| `src-tauri/src/main.rs` | Tauri app entry, command registration |
| `src-tauri/src/commands.rs` | All Tauri command handlers |
| `src-tauri/src/audio/player.rs` | Rodio playback with layering |
| `src-tauri/src/audio/recorder.rs` | Cpal microphone recording |
| `src-tauri/src/state.rs` | Sound and AppState structs |
| `src-tauri/src/storage.rs` | JSON/WAV file persistence |
| `src/index.html` | 3x3 grid layout |
| `src/styles.css` | visionOS glassmorphism styles |
| `src/main.js` | UI interactions, Tauri IPC |

---

## Rust Dependencies (Cargo.toml)

```toml
[dependencies]
tauri = { version = "2", features = [] }
rodio = { version = "0.21", features = ["wav"] }
cpal = "0.15"
hound = "3.5"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
uuid = { version = "1.0", features = ["v4", "serde"] }
dirs = "5.0"
```

---

## Verification Checklist

| Phase | Test | Expected |
|-------|------|----------|
| 1 | `cargo tauri dev` | Window opens |
| 2 | View app | Glassmorphism grid visible |
| 3 | Click button | Sound plays |
| 3 | Click multiple | Sounds layer |
| 4 | Hold button | Recording overlay |
| 4 | Release | Sound saved to slot |
| 5 | Record multiple | State tracks all |
| 6 | Close + reopen | Sounds persist |
| 7 | Long-press | Loop badge shown |
| 7 | Play looped | Loops until stopped |
| 8 | Full test | Smooth UX |

---

## Sources

- [Tauri Documentation](https://tauri.app/start/)
- [Rodio Audio Playback](https://github.com/RustAudio/rodio)
- [CPAL Audio I/O](https://github.com/RustAudio/cpal)
- [Glassmorphism CSS](https://css.glass/)
- [Dioxus 0.7 Release](https://github.com/DioxusLabs/dioxus/releases/tag/v0.7.0)
- [cpal + dioxus issue](https://github.com/RustAudio/cpal/issues/782)
