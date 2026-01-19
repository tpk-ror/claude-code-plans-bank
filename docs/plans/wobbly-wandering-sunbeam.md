# Cliffhangers Game - Implementation Plan

## Project Overview
Replicate "The Price is Right" Cliffhangers game using p5.js with a retro/classic TV aesthetic.

## Requirements Summary
Based on user responses:
- **Platform**: p5.js, Mobile-first (390x844)
- **Visual Style**: Retro/Classic TV (assets provided match this)
- **Input**: Slider with $1 increments
- **Audio**: Full audio - yodeling during climb, buzzer, victory/loss sounds
- **Animation**: Smooth walking climber up diagonal path
- **Game Over**: Dramatic fall animation when climber exceeds cliff
- **Win**: Celebration animation with confetti
- **Stats**: Win/loss record tracked in localStorage
- **Host**: Text prompts during gameplay ("What do you bid for this...?")
- **Prize Data**: CSV file (maintainable), random 3 prizes per game
- **Prize Images**: AI-generated via placeholder image service

## Existing Assets
- `cliffhanger-board-background.png` - Mountain scene with diagonal gold path
- `cliffhanger.png` - Bavarian climber sprite (walking pose)
- `yoddle.mp3` - Yodeling audio for climbing

---

## File Structure
```
cliff-hangers/
├── index.html              # Main HTML with p5.js setup
├── sketch.js               # Main p5.js game logic
├── prizes.csv              # Maintainable prize data
├── js/
│   ├── game.js             # Game state management
│   ├── climber.js          # Climber animation & movement
│   ├── ui.js               # UI components (slider, host text, buttons)
│   ├── audio.js            # Sound management
│   └── stats.js            # LocalStorage win/loss tracking
├── assets/
│   ├── cliffhanger-board-background.png
│   ├── cliffhanger.png
│   └── yoddle.mp3
└── css/
    └── style.css           # Retro TV styling
```

---

## Implementation Steps

### Phase 1: Project Setup
1. Create `index.html` with p5.js CDN and mobile viewport
2. Create `sketch.js` with basic p5 setup (390x844 canvas)
3. Create `prizes.csv` with sample data structure:
   ```csv
   name,price,category,imageKeyword
   Toaster Oven,47,kitchen,toaster
   Bluetooth Speaker,35,electronics,speaker
   Garden Hose,28,outdoor,hose
   ```
4. Move existing assets into `assets/` folder
5. Create basic CSS for retro TV aesthetic

### Phase 2: Core Game State
1. Create `game.js` with game states:
   - `START` - Title screen with Play button
   - `SHOWING_PRIZE` - Display current prize
   - `BIDDING` - Player uses slider to bid
   - `CLIMBING` - Climber animates up mountain
   - `GAME_OVER` - Fall animation + replay option
   - `WIN` - Celebration animation + replay option
2. Track: current prize (1-3), total error, climber position

### Phase 3: Background & Path
1. Load and display background image scaled to canvas
2. Define climbing path coordinates (diagonal from bottom-left to top-right)
3. Map error values (0-25+) to path positions
4. Mark cliff edge at position 25

### Phase 4: Climber Animation
1. Load climber sprite
2. Create smooth movement along path:
   - Calculate target position based on error
   - Animate climber walking toward target
   - Bob/bounce effect while moving
3. Create fall animation:
   - Rotate climber
   - Accelerate downward off cliff
   - Fade out

### Phase 5: Prize Display
1. Parse CSV file using p5.js `loadTable()`
2. Random selection of 3 unique prizes
3. Display prize with:
   - Prize image (using picsum.photos or placeholder.com with keywords)
   - Prize name
   - Host prompt text: "What do you bid for this [prize name]?"

### Phase 6: Bidding UI
1. Create slider component:
   - Range: $10-$99
   - Increment: $1
   - Large touch-friendly handle
   - Current value display
2. "Lock In Bid" button
3. Retro TV styling (wood grain, bold colors)

### Phase 7: Audio System
1. Load `yoddle.mp3`
2. Create/source additional sounds:
   - Buzzer (wrong bid)
   - Victory fanfare
   - Fall/crash sound
3. Play yodeling during climber movement
4. Duration matches climb distance

### Phase 8: Win/Lose States
1. **Lose (Fall)**:
   - Dramatic fall animation
   - Crash sound
   - "Game Over" text
   - Show total error
   - Replay button
2. **Win (Survived)**:
   - Confetti particle effect
   - Victory sound
   - "You Won!" text
   - Show prizes won
   - Replay button

### Phase 9: Host/Announcer Text
1. Speech bubble or retro TV text box
2. Prompts:
   - "Welcome to Cliffhangers!"
   - "Your first prize is... [name]!"
   - "What do you bid?"
   - "You were $X off!"
   - "Careful! The climber is getting close..."
   - "Congratulations!" / "Oh no!"

### Phase 10: Statistics
1. Create `stats.js` for localStorage:
   - `gamesPlayed`
   - `gamesWon`
   - `gamesLost`
2. Display win/loss record on start screen
3. "Best streak" tracking (optional)

### Phase 11: Polish & Testing
1. Test on mobile viewport
2. Fine-tune animation timing
3. Balance yodel audio duration with climb distance
4. Add touch event handling for mobile
5. Test prize CSV loading
6. Cross-browser testing

---

## Key Technical Decisions

### Climber Path Mapping
The diagonal path in the background runs from bottom-left to top-right. Define waypoints:
```javascript
const PATH_START = { x: 80, y: 650 };   // Base of mountain
const PATH_END = { x: 350, y: 120 };     // Cliff edge
// Linear interpolation based on error percentage (0-25 = 0-100%)
```

### Prize Image Generation
Use placeholder image service:
```javascript
// Example using picsum with seed for consistency
`https://picsum.photos/seed/${prize.imageKeyword}/200/150`
```

### Yodel Duration Sync
Calculate climb time based on error amount:
```javascript
const climbDuration = error * 200; // 200ms per dollar of error
// Fade yodel audio to match
```

---

## Verification Plan
1. **Visual**: Background loads, climber visible at start position
2. **CSV Loading**: Console log prizes loaded from CSV
3. **Slider**: Bid value updates, locked bid registers
4. **Climb Animation**: Climber moves correct distance for error
5. **Fall**: Climber falls when total error > 25
6. **Win**: Climber stops at/before cliff edge, confetti plays
7. **Audio**: Yodel plays during climb, stops at destination
8. **Stats**: localStorage updates after each game
9. **Mobile**: Touch controls work on 390x844 viewport

---

## Notes
- The climber sprite is static (single pose) - animate by moving position + subtle bobbing
- Background already has the path drawn - just need to position climber along it
- May need to adjust path coordinates after seeing scaled background
