# Pikes Peak Derby - Technical Documentation

## Table of Contents
1. [Project Architecture](#project-architecture)
2. [Module Breakdown](#module-breakdown)
3. [Data Flow](#data-flow)
4. [Algorithms & Systems](#algorithms--systems)
5. [Performance Optimizations](#performance-optimizations)
6. [State Management](#state-management)

---

## Project Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         index.html                          │
│  - DOM structure, audio elements, UI overlays               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                          main.js                            │
│  - Entry point, module coordination, initialization         │
└──┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬────────┘
   │      │      │      │      │      │      │      │
   ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│scene │ │models│ │player│ │aiCar │ │controls│ │countdown│ │finish│
│.js   │ │.js   │ │Car.js│ │.js   │ │.js   │ │.js   │ │.js   │
└──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘
   │         │        │        │        │        │        │
   └─────────┴────────┴────────┴────────┴────────┴────────┘
                              │
                              ▼
                      ┌──────────────┐
                      │animation.js  │
                      │(render loop) │
                      └──────────────┘
```

### Technology Stack

- **Three.js v0.160.0**: 3D rendering engine
- **ES6 Modules**: Modular JavaScript architecture
- **Web Serial API**: Micro:bit hardware integration
- **HTML5 Audio API**: Multi-track audio management
- **Raycasting**: Physics and collision detection

---

## Module Breakdown

### 1. main.js
**Purpose**: Application entry point and orchestration

**Responsibilities**:
- Initialize all modules in correct order
- Start instrumental background music
- Set up micro:bit UI handlers
- Load all 3D models (terrain, racetrack, cars)
- Load AI path data
- Start animation loop
- Expose debugging functions to window object

**Key Exports**:
- None (entry point)

**Key Imports**:
- All other modules

**Code Flow**:
```javascript
1. Import all modules
2. Play instrumental.mp3 with autoplay fallback
3. setupMicrobitUI()
4. loadTerrain(), loadRacetrack()
5. loadPlayerCar(), loadAICar()
6. loadPathData() (AI replay data)
7. animate() (start render loop)
8. Expose window.exportMovementLog, etc.
```

---

### 2. scene.js
**Purpose**: Three.js scene, camera, and renderer setup

**Responsibilities**:
- Create and configure Three.js scene
- Set up perspective camera with proper FOV and clipping planes
- Configure WebGL renderer with antialiasing and tone mapping
- Load background texture
- Handle window resize events

**Key Exports**:
- `scene`: THREE.Scene instance
- `camera`: THREE.PerspectiveCamera instance
- `renderer`: THREE.WebGLRenderer instance

**Configuration**:
```javascript
Camera:
  - FOV: 60 degrees
  - Near plane: 1 unit
  - Far plane: 2,000,000 units
  - Aspect ratio: window dimensions

Renderer:
  - Antialiasing: enabled
  - Shadow maps: disabled (performance)
  - Tone mapping: ACESFilmicToneMapping
  - Exposure: 1.2
```

---

### 3. lighting.js
**Purpose**: Scene illumination setup

**Responsibilities**:
- Configure ambient lighting
- Set up directional lights from multiple angles
- Add hemisphere light for outdoor atmosphere

**Lighting Configuration**:
```javascript
1. Ambient Light:
   - Color: 0xffffff (white)
   - Intensity: 1.5

2. Directional Light #1:
   - Position: (50000, 100000, 30000)
   - Intensity: 2.0
   - Shadows: disabled

3. Directional Light #2:
   - Position: (-50000, 80000, -30000)
   - Intensity: 1.5

4. Hemisphere Light:
   - Sky color: 0x87CEEB (sky blue)
   - Ground color: 0xd4a574 (sandy brown)
   - Intensity: 1.0
```

---

### 4. models.js
**Purpose**: 3D model loading and terrain management

**Responsibilities**:
- Load terrain GLB model
- Load racetrack GLB model
- Remove terrain vertices that intersect with racetrack
- Track loading progress
- Trigger ready state when all models loaded

**Key Exports**:
- `terrain`: Loaded terrain mesh
- `racetrack`: Loaded racetrack mesh
- `loadTerrain()`: Async terrain loader
- `loadRacetrack()`: Async racetrack loader
- `updateLoadingStatus()`: Loading progress tracker

**Loading Algorithm**:
```
Total models to load: 4 (terrain, racetrack, playerCar, aiCar)

For each model loaded:
  1. Increment modelsLoaded counter
  2. If modelsLoaded === 4:
     - Hide loading overlay
     - Show info panel
     - Position car on track
     - Show ready message
```

**Terrain Removal Algorithm**:
```javascript
1. Calculate racetrack bounding box
2. Expand bounding box by 50 units (buffer zone)
3. For each terrain mesh:
   a. Check if mesh bounding box intersects expanded track box
   b. If yes: hide mesh immediately
   c. If no: sample every 5th vertex
      - If any vertex inside expanded box: hide mesh
4. This creates smooth road without terrain poking through
```

---

### 5. playerCar.js
**Purpose**: Player car physics, movement, and controls

**Responsibilities**:
- Load player car 3D model
- Handle car movement based on keyboard/micro:bit input
- Implement acceleration and deceleration physics
- Terrain following with raycasting
- Track boundary detection (slide-along-edge)
- Car-to-car collision detection
- Camera follow logic
- Speedometer updates
- Movement logging for AI replay

**Key Exports**:
- `playerCar`: THREE.Object3D instance
- `carRotation`: Current Y-axis rotation
- `carSpeed`: Maximum speed constant (1.0)
- `carRotateSpeed`: Keyboard rotation speed (0.02)
- `microbitRotateSpeed`: Micro:bit rotation speed (0.02)
- `loadPlayerCar()`: Model loader
- `movePlayerCar(keys, racetrack, terrain, controlMode)`: Physics update
- `updateCameraFollowCar()`: Camera positioning
- `exportMovementLog()`: Get recorded path data
- `setLogging(enabled)`: Enable/disable movement recording

**Movement Physics**:
```javascript
Acceleration system:
  - currentSpeed starts at 0
  - When forward key pressed:
    currentSpeed += 0.05 (up to max 1.0)
  - When forward key released:
    currentSpeed -= 0.02 (down to 0)
  - On collision:
    currentSpeed *= 0.5 (50% speed penalty)

Rotation:
  - Keyboard: ±0.02 radians per frame
  - Micro:bit: ±0.02 radians per frame
  - Applied to carRotation (Y-axis)

Movement direction:
  direction = (0, 0, currentSpeed)
  direction.applyAxisAngle(Y_AXIS, carRotation)
  carPosition += direction
```

**Terrain Following Algorithm**:
```javascript
Performance-optimized raycasting (every 2 frames):

Frame N (raycast):
  1. Cast ray from (carX, carY + 50, carZ) downward
  2. Limit raycast distance to 100 units
  3. Check intersection with racetrack
  4. Check intersection with terrain
  5. targetY = max(trackY, terrainY) + 1.0 (clearance)
  6. Store in cachedTerrainHeight

Frame N+1 (use cache):
  1. Use cachedTerrainHeight from previous frame

Both frames:
  carY += (cachedTerrainHeight - carY) * 0.3 (lerp)
```

**Track Boundary Detection** (Slide-Along-Edge):
```javascript
Sensors placed at 4 car corners:
  - Front-right: (1.5, 0, 2)
  - Front-left: (-1.5, 0, 2)
  - Back-right: (1.5, 0, -2)
  - Back-left: (-1.5, 0, -2)

For each sensor (rotated with car):
  1. Cast ray downward from sensor position
  2. If no track intersection (off-track):
     - Calculate push vector from sensor to car center
     - Add to correction vector
  3. Apply correction * 0.5 to car position

This creates smooth sliding along track edges.
```

**Collision Detection**:
```javascript
Quick AABB check:
  if (|carX - aiCarX| < 20 && |carZ - aiCarZ| < 20):
    Precise collision check:
      distance = Math.hypot(carX - aiCarX, carZ - aiCarZ)
      if (distance < 7):  // Collision radius
        1. Calculate push direction (horizontal only)
        2. Normalize push direction
        3. pushStrength = (7 - distance) * 2.0
        4. Push car away
        5. Sync Y positions (prevent under/over)
        6. Reduce speed by 50%
```

**Camera Follow System**:
```javascript
Camera offset from car: (0, 8, -15)
  - 8 units above
  - 15 units behind

Every frame:
  1. Rotate offset by carRotation
  2. targetPosition = carPosition + rotatedOffset
  3. On first frame:
     camera.position = targetPosition (instant)
  4. On subsequent frames:
     camera.position.lerp(targetPosition, 0.1) (smooth)
  5. Look at point 3 units above car center
```

---

### 6. aiCar.js
**Purpose**: AI opponent using path replay

**Responsibilities**:
- Load AI car 3D model
- Replay pre-recorded movement path
- Handle collision with player car
- Smooth Y interpolation for terrain following

**Key Exports**:
- `aiCar`: THREE.Object3D instance
- `loadAICar()`: Model loader
- `moveAICar(raceStarted)`: Path replay logic
- `loadPreRecordedPath(pathData)`: Load movement data
- `getAICarPosition()`: Position getter
- `resetAICar()`: Reset to starting position

**Path Replay Algorithm**:
```javascript
preRecordedPath = [{x, y, z, rotation}, ...]
currentFrame = 0

Every frame (when race started):
  1. If currentFrame >= pathData.length:
     currentFrame = 0 (loop)

  2. frameData = preRecordedPath[currentFrame]

  3. Set exact X, Z from recording:
     aiCar.position.x = frameData.x
     aiCar.position.z = frameData.z

  4. Smooth Y interpolation (prevent hopping):
     aiCar.position.y += (frameData.y - aiCar.position.y) * 0.15

  5. Set rotation:
     aiCar.rotation.y = frameData.rotation

  6. Check collision with player car (same as playerCar.js)

  7. currentFrame++
```

**AI Collision Handling**:
- Same horizontal distance check as player car
- Pushes AI car away from player (strength: 1.5)
- Syncs Y position to prevent clipping

---

### 7. controls.js
**Purpose**: Input handling and control mode management

**Responsibilities**:
- Capture keyboard input
- Manage Web Serial connection to micro:bit
- Parse micro:bit accelerometer data
- Maintain control mode state (keyboard/micro:bit)
- Expose race state getters/setters

**Key Exports**:
- `controls`: OrbitControls instance (disabled)
- `raceStarted`: Boolean race state
- `controlMode`: 'keyboard' or 'microbit'
- `keys`: {forward, rotateLeft, rotateRight}
- `setRaceStarted(value)`: Race state setter
- `getRaceStarted()`: Race state getter
- `setControlMode(mode)`: Mode switcher
- `getControlMode()`: Mode getter
- `connectMicrobit()`: Async Web Serial connection
- `disconnectMicrobit()`: Async serial disconnect

**Keyboard Input Mapping**:
```javascript
Keydown events:
  ' ' (Space): keys.forward = true
  'ArrowLeft': keys.rotateLeft = true
  'ArrowRight': keys.rotateRight = true

Keyup events:
  ' ' (Space): keys.forward = false
  'ArrowLeft': keys.rotateLeft = false
  'ArrowRight': keys.rotateRight = false
```

**Micro:bit Integration**:
```javascript
Connection flow:
  1. navigator.serial.requestPort()
  2. port.open({baudRate: 115200})
  3. setControlMode('microbit')
  4. Start reading serial data
  5. keys.forward = true (auto-drive mode)

Serial data parsing:
  1. Create TextDecoderStream
  2. Read lines from serial port
  3. Parse each line as float (-1.0 to 1.0)
  4. Update keys based on threshold (0.15):
     rotation < -0.15: rotateLeft = true
     rotation > 0.15: rotateRight = true
     else: both false
  5. Always keep forward = true in micro:bit mode
```

---

### 8. animation.js
**Purpose**: Main render loop

**Responsibilities**:
- Request animation frames
- Update camera position
- Update car physics (if race started)
- Check finish line conditions
- Render scene

**Key Exports**:
- `animate()`: Render loop function

**Render Loop**:
```javascript
function animate() {
  requestAnimationFrame(animate)

  // Always update camera (follows car even before race)
  updateCameraFollowCar()

  if (getRaceStarted()) {
    // Move player car
    movePlayerCar(keys, racetrack, terrain, getControlMode())

    // Move AI car
    moveAICar(getRaceStarted())

    // Check finish lines
    if (playerCar) checkFinish(playerCar.position)
    if (aiCar) checkAIFinish(aiCar.position)
  }

  // Render scene
  renderer.render(scene, camera)
}
```

**Frame Rate**: Unbounded (browser's requestAnimationFrame, typically 60 FPS)

---

### 9. countdown.js
**Purpose**: Race start sequence and music management

**Responsibilities**:
- Show ready message after loading
- Handle spacebar to start race
- Play countdown sequence (3, 2, 1, GO!)
- Manage music transitions

**Key Exports**:
- `showReadyMessage()`: Display ready screen
- `triggerRaceStart()`: Begin countdown
- `startRaceCountdown()`: Countdown logic

**Ready Screen Flow**:
```javascript
When all models loaded:
  1. Show countdown overlay
  2. Display "Pikes Peak Derby" title
  3. Add "Click SPACE to start race" message
  4. Listen for spacebar press
  5. On spacebar:
     - Remove start message
     - Call triggerRaceStart()
```

**Music Sequence**:
```javascript
Page load:
  ▶ instrumental.mp3 (loop)

Spacebar pressed / micro:bit connected:
  ▶ mariokart.mp3(countdown music)
  ▶ instrumental.mp3 continues

mariokart.mp3 ends:
  ▶ racecar.mp3 (racing background)
  ▶ instrumental.mp3 continues

Race finishes:
  ⏸ racecar.mp3 stops
  ▶ finish.mp3 plays
  ▶ instrumental.mp3 continues
```

**Countdown Sequence**:
```javascript
count = 3

Every 1000ms:
  if (count > 0):
    Display count with pulse animation
    count--
  else:
    Display "GO!" with green color
    setRaceStarted(true)
    Hide countdown after 800ms
```

---

### 10. finish.js
**Purpose**: Finish line detection and race completion

**Responsibilities**:
- Check player/AI distance from finish line
- Prevent false positives at race start
- Trigger winner announcement
- Stop race and play finish music

**Key Exports**:
- `checkFinish(carPosition)`: Player finish check
- `checkAIFinish(carPosition)`: AI finish check
- `resetFinish()`: Reset race state
- `isRaceFinished()`: Finish state getter

**Finish Line Detection Algorithm**:
```javascript
Finish line position: (-50, ?, -140)
Tolerance: 10 units

State tracking:
  - raceFinished: boolean
  - playerStartedOnce: boolean
  - aiStartedOnce: boolean

For each car:
  1. Calculate 2D distance to finish line:
     distance = Math.hypot(carX - finishX, carZ - finishZ)

  2. Start detection (prevent instant finish):
     if (!startedOnce && distance > 50):
       startedOnce = true

  3. Finish detection:
     if (startedOnce && distance <= 10):
       triggerFinish('player' or 'ai')
       return true
```

**Finish Trigger Flow**:
```javascript
triggerFinish(whoWon):
  1. Set raceFinished = true
  2. setRaceStarted(false) (stop cars)
  3. Stop background music (racecar.mp3)
  4. Play finish.mp3
  5. showFinishMessage(whoWon):
     - "YOU WIN!" (gold color) or
     - "AI WINS!" (red color)
     - Pulse animation
     - Keep visible (no auto-hide)
```

---

### 11. microbitUI.js
**Purpose**: Micro:bit button handlers and UI updates

**Responsibilities**:
- Connect/disconnect button handlers
- Control mode switching buttons
- Update UI visibility based on control mode
- Trigger race start on micro:bit connection

**Key Exports**:
- `setupMicrobitUI()`: Initialize button handlers

**UI State Management**:
```javascript
Keyboard mode (default):
  - "Connect micro:bit" button: visible
  - "Disconnect micro:bit" button: hidden
  - "Switch to Keyboard" button: hidden
  - "Switch to micro:bit" button: hidden
  - Keyboard controls display: visible
  - Micro:bit controls display: hidden

Micro:bit connected:
  - "Connect micro:bit" button: hidden
  - "Disconnect micro:bit" button: visible
  - "Switch to Keyboard" button: visible
  - "Switch to micro:bit" button: hidden
  - Keyboard controls display: hidden
  - Micro:bit controls display: visible
  - Auto-trigger race countdown
```

---

### 12. dataLoader.js
**Purpose**: Load AI path data from file

**Responsibilities**:
- Fetch data.txt file
- Parse JSON path data
- Load into AI car system

**Key Exports**:
- `loadPathData()`: Async data loader

**Loading Flow**:
```javascript
async loadPathData():
  1. Fetch 'data.txt'
  2. Check response.ok
  3. Parse response as text
  4. JSON.parse(text) → pathData array
  5. loadPreRecordedPath(pathData)
  6. Catch and log errors
```

**Data Format**:
```json
[
  {"x": -50.0, "y": 20.5, "z": -140.0, "rotation": 3.14159},
  {"x": -50.1, "y": 20.6, "z": -140.8, "rotation": 3.14159},
  ...
]
```

---

## Data Flow

### Game Initialization Flow

```
User loads page
    │
    ▼
main.js executes
    │
    ├─► scene.js: Create scene, camera, renderer
    ├─► lighting.js: Add lights to scene
    ├─► controls.js: Set up input listeners
    ├─► models.js: Load terrain & racetrack
    ├─► playerCar.js: Load player car model
    ├─► aiCar.js: Load AI car model
    ├─► dataLoader.js: Load AI path data
    ├─► microbitUI.js: Set up UI handlers
    └─► animation.js: Start render loop
    │
    ▼
All 4 models loaded
    │
    ▼
models.js: updateLoadingStatus()
    │
    ├─► Hide loading overlay
    ├─► Show info panel
    ├─► Position car on track
    └─► countdown.js: showReadyMessage()
              │
              ▼
        Display "Pikes Peak Derby"
        Wait for spacebar...
```

### Race Start Flow

```
User presses spacebar OR connects micro:bit
    │
    ▼
countdown.js: triggerRaceStart()
    │
    ├─► Play mariokart.mp3
    ├─► Start countdown (3, 2, 1, GO!)
    └─► controls.js: setRaceStarted(true)
              │
              ▼
    animation.js: Render loop now processes:
        │
        ├─► movePlayerCar() every frame
        ├─► moveAICar() every frame
        ├─► checkFinish() every frame
        └─► checkAIFinish() every frame
```

### Input Processing Flow

#### Keyboard Input
```
User presses key
    │
    ▼
controls.js: keydown event
    │
    ▼
Update keys object
    │
    ▼
animation.js: Pass keys to movePlayerCar()
    │
    ▼
playerCar.js: Calculate movement
    │
    ├─► Acceleration/deceleration
    ├─► Rotation
    ├─► Position update
    ├─► Collision detection
    └─► Terrain following
```

#### Micro:bit Input
```
Micro:bit sends tilt data
    │
    ▼
controls.js: Serial port reads line
    │
    ▼
Parse float value (-1.0 to 1.0)
    │
    ▼
updateKeysFromMicrobit(rotation)
    │
    ├─► If rotation < -0.15: rotateLeft = true
    ├─► If rotation > 0.15: rotateRight = true
    └─► Always: forward = true
    │
    ▼
animation.js: Pass keys to movePlayerCar()
    │
    ▼
playerCar.js: Process with microbitRotateSpeed
```

### Collision Detection Flow

```
animation.js: Every frame
    │
    ├─► movePlayerCar()
    │      │
    │      ▼
    │   Quick AABB check
    │      │
    │      ▼
    │   Horizontal distance check
    │      │
    │      ▼
    │   If collision (< 7 units):
    │      ├─► Push player away
    │      ├─► Sync Y positions
    │      └─► Reduce speed 50%
    │
    └─► moveAICar()
           │
           ▼
        Quick AABB check
           │
           ▼
        Horizontal distance check
           │
           ▼
        If collision (< 7 units):
           ├─► Push AI away
           └─► Sync Y positions
```

### Finish Detection Flow

```
animation.js: Every frame (if race started)
    │
    ├─► checkFinish(playerCar.position)
    │      │
    │      ▼
    │   Calculate distance to finish line
    │      │
    │      ▼
    │   If distance > 50: playerStartedOnce = true
    │      │
    │      ▼
    │   If startedOnce && distance <= 10:
    │      │
    │      ▼
    │   finish.js: triggerFinish('player')
    │      │
    │      ├─► Stop race
    │      ├─► Stop music
    │      ├─► Play finish.mp3
    │      └─► Show "YOU WIN!"
    │
    └─► checkAIFinish(aiCar.position)
           │
           └─► [Same logic for AI]
```

---

## Algorithms & Systems

### 1. Terrain Following (Raycasting)

**Purpose**: Keep car positioned correctly on track/terrain surface

**Algorithm**:
```
Input: carPosition, racetrack mesh, terrain mesh
Output: Updated car Y position

1. Performance optimization (every 2 frames):
   frameCounter++
   if (frameCounter % 2 !== 0):
     Skip raycasting, use cached value
     Go to step 5

2. Create downward raycast:
   origin = (carX, carY + 50, carZ)
   direction = (0, -1, 0)
   maxDistance = 100

3. Check track intersection:
   intersects = raycast(origin, direction, racetrack)
   if (intersects.length > 0):
     targetY = intersects[0].point.y + 1.0

4. Check terrain intersection:
   intersects = raycast(origin, direction, terrain)
   if (intersects.length > 0):
     targetY = max(targetY, intersects[0].point.y + 1.0)

   cachedTerrainHeight = targetY

5. Smooth interpolation:
   carY += (cachedTerrainHeight - carY) * 0.3
```

**Time Complexity**: O(T) where T = number of triangles in terrain/track
**Optimization**: Frame skipping reduces checks by 50%

---

### 2. Track Boundary Detection (Slide-Along-Edge)

**Purpose**: Prevent car from driving off track while allowing smooth sliding

**Algorithm**:
```
Input: carPosition, carRotation, racetrack mesh
Output: Corrected car position

1. Define sensor offsets (car-local coordinates):
   sensors = [
     (1.5, 0, 2),    // front-right
     (-1.5, 0, 2),   // front-left
     (1.5, 0, -2),   // back-right
     (-1.5, 0, -2)   // back-left
   ]

2. Initialize correction vector:
   correction = (0, 0, 0)

3. For each sensor:
   a. Transform to world coordinates:
      worldOffset = rotateAroundY(sensor, carRotation)
      sensorWorldPos = carPosition + worldOffset + (0, 50, 0)

   b. Cast ray downward:
      intersects = raycast(sensorWorldPos, (0, -1, 0), racetrack)

   c. If no intersection (off track):
      pushBack = (carPosition - sensorWorldPos)
      pushBack.y = 0
      correction += pushBack

4. Apply correction:
   carPosition += correction * 0.5
```

**Result**: Car slides smoothly along track edges instead of stopping

---

### 3. Car-to-Car Collision

**Purpose**: Realistic collision between player and AI cars

**Algorithm**:
```
Input: playerCar, aiCar positions
Output: Updated positions, reduced speed

1. Quick rejection test (AABB):
   if (|playerX - aiX| >= 20 OR |playerZ - aiZ| >= 20):
     return (no collision)

2. Precise distance check (horizontal only):
   distance = sqrt((playerX - aiX)² + (playerZ - aiZ)²)

   if (distance >= 7):
     return (no collision)

3. Calculate push direction:
   pushDir = (playerPos - aiPos)
   pushDir.y = 0
   pushDir = normalize(pushDir)

4. Calculate push strength:
   overlap = 7 - distance
   pushStrength = overlap * 2.0 (player) or 1.5 (AI)

5. Apply physics:
   playerPos += pushDir * pushStrength
   aiPos -= pushDir * (pushStrength * 0.75)

6. Sync vertical positions:
   playerY = aiY
   aiY = playerY

7. Speed penalty (player only):
   playerSpeed *= 0.5
```

**Time Complexity**: O(1) per frame
**Space Complexity**: O(1)

---

### 4. Camera Follow System

**Purpose**: Smooth third-person camera that follows player car

**Algorithm**:
```
Input: carPosition, carRotation
Output: Updated camera position and look target

1. Define camera offset (car-local):
   offset = (0, 8, -15)
   // 8 units above, 15 units behind

2. Rotate offset by car rotation:
   rotatedOffset = rotateAroundY(offset, carRotation)

3. Calculate target position:
   targetPos = carPosition + rotatedOffset

4. Smooth camera movement:
   if (firstFrame):
     cameraPos = targetPos (instant)
   else:
     cameraPos = lerp(cameraPos, targetPos, 0.1)

5. Calculate look target:
   lookTarget = carPosition + (0, 3, 0)

6. Update camera:
   camera.position = cameraPos
   camera.lookAt(lookTarget)
```

**Lerp Factor**: 0.1 = smooth but slightly laggy
**Higher values** = more responsive but less smooth

---

### 5. Acceleration/Deceleration Physics

**Purpose**: Realistic speed control with momentum

**Algorithm**:
```
Input: keys.forward, currentSpeed
Output: Updated currentSpeed

Constants:
  MAX_SPEED = 1.0
  ACCELERATION_RATE = 0.05
  DECELERATION_RATE = 0.02
  COLLISION_PENALTY = 0.5

if (keys.forward):
  currentSpeed += ACCELERATION_RATE
  currentSpeed = min(currentSpeed, MAX_SPEED)
else:
  currentSpeed -= DECELERATION_RATE
  currentSpeed = max(currentSpeed, 0)

if (collision):
  currentSpeed *= COLLISION_PENALTY

Movement:
  direction = (0, 0, currentSpeed)
  direction = rotateAroundY(direction, carRotation)
  carPosition += direction
```

**Graph of speed over time**:
```
Speed
1.0 ┤     ╭─────────╮
    │    ╱          │
    │   ╱           │
0.5 ┤  ╱            ╰╮
    │ ╱              ╰╮
0.0 ┼─────────────────╰────
    0   2   4   6   8   10
    │   │   │   │   │   │
    │   │   │   │   │   Collision
    │   │   │   Forward released
    │   │   Forward pressed
    Forward pressed
    Start
```

---

### 6. AI Path Replay

**Purpose**: Deterministic AI opponent movement

**Algorithm**:
```
Input: preRecordedPath[], currentFrame
Output: Updated aiCar position/rotation

Data structure:
  preRecordedPath = [
    {x: float, y: float, z: float, rotation: float},
    ...
  ]

Every frame:
  1. Boundary check:
     if (currentFrame >= preRecordedPath.length):
       currentFrame = 0 (loop)

  2. Get frame data:
     frameData = preRecordedPath[currentFrame]

  3. Set exact horizontal position:
     aiCar.x = frameData.x
     aiCar.z = frameData.z

  4. Smooth vertical interpolation:
     aiCar.y += (frameData.y - aiCar.y) * 0.15

  5. Set rotation:
     aiCar.rotation.y = frameData.rotation

  6. Increment frame:
     currentFrame++
```

**Recording new paths**:
```
In browser console:
  window.setLogging(true)
  [Complete a lap]
  const data = window.exportMovementLog()
  console.log(JSON.stringify(data))
  [Copy to data.txt]
```

---

### 7. Finish Line Detection

**Purpose**: Accurate race completion detection

**Algorithm**:
```
Input: carPosition
Output: Boolean (finished or not)

Constants:
  FINISH_LINE = (-50, ?, -140)
  TOLERANCE = 10
  START_DISTANCE = 50

State:
  startedOnce = false
  raceFinished = false

Every frame:
  1. Calculate 2D distance:
     distance = sqrt(
       (carX - finishX)² +
       (carZ - finishZ)²
     )

  2. Anti-false-positive check:
     if (!startedOnce && distance > START_DISTANCE):
       startedOnce = true
       return false

  3. Finish detection:
     if (startedOnce && distance <= TOLERANCE):
       if (!raceFinished):
         triggerFinish()
         raceFinished = true
         return true

  4. Otherwise:
     return false
```

**Why START_DISTANCE check?**
- Cars start at finish line position
- Without this, race would end immediately
- Car must move 50+ units away first

---

## Performance Optimizations

### 1. Raycasting Frequency Reduction

**Before**: Raycast every frame (60 FPS = 60 raycasts/sec)
**After**: Raycast every 2 frames (60 FPS = 30 raycasts/sec)
**Savings**: 50% reduction in expensive raycasting

**Implementation**:
```javascript
let frameCounter = 0;
let cachedTerrainHeight = 0;

if (frameCounter % 2 === 0) {
  // Do expensive raycast
  cachedTerrainHeight = calculateTerrainHeight();
}
// Always use cached value for smooth interpolation
carY += (cachedTerrainHeight - carY) * 0.3;
frameCounter++;
```

---

### 2. Raycast Distance Limiting

**Before**: Unlimited raycast distance (checks all geometry)
**After**: Limited to 100 units

**Implementation**:
```javascript
const raycaster = new THREE.Raycaster(origin, direction);
raycaster.far = 100; // Only check within 100 units
```

**Savings**: Reduces geometry traversal in large scenes

---

### 3. Collision Detection AABB Pre-check

**Before**: Always calculate precise distance with sqrt()
**After**: Quick axis-aligned check first

**Implementation**:
```javascript
// Quick rejection (cheap)
if (Math.abs(carX - aiCarX) >= 20 ||
    Math.abs(carZ - aiCarZ) >= 20) {
  return; // No collision possible
}

// Precise check (expensive)
const distance = Math.hypot(carX - aiCarX, carZ - aiCarZ);
if (distance < 7) {
  // Handle collision
}
```

**Savings**: Skips expensive sqrt() when cars are far apart

---

### 4. Shadow Rendering Disabled

**Before**: Shadow maps enabled (major GPU cost)
**After**: Shadows completely disabled

**Implementation**:
```javascript
renderer.shadowMap.enabled = false;
```

**Savings**: Significant frame rate improvement

---

### 5. Vertex Sampling in Terrain Removal

**Before**: Check every vertex for terrain/track overlap
**After**: Sample every 5th vertex

**Implementation**:
```javascript
for (let i = 0; i < positions.count; i += 5) {
  // Only check 20% of vertices
}
```

**Savings**: 80% reduction in vertex checks during loading

---

### 6. Horizontal-Only Distance Calculation

**Purpose**: Collision detection ignores vertical component

**Before**:
```javascript
const distance = playerCar.position.distanceTo(aiCar.position);
// Includes Y component: sqrt(dx² + dy² + dz²)
```

**After**:
```javascript
const distance = Math.hypot(
  playerCar.position.x - aiCar.position.x,
  playerCar.position.z - aiCar.position.z
);
// Only horizontal: sqrt(dx² + dz²)
```

**Benefit**: Prevents cars from going under/over each other

---

## State Management

### Race States

```javascript
States:
  1. LOADING
     - Loading overlay visible
     - Models being loaded
     - No user input active

  2. READY
     - All models loaded
     - "Pikes Peak Derby" title shown
     - Waiting for spacebar or micro:bit
     - instrumental.mp3 playing

  3. COUNTDOWN
     - Countdown overlay showing (3, 2, 1, GO!)
     - mariokart.mp3 playing
     - Cars stationary
     - raceStarted = false

  4. RACING
     - raceStarted = true
     - Cars moving
     - racecar.mp3 playing
     - Checking finish conditions
     - raceFinished = false

  5. FINISHED
     - raceStarted = false
     - raceFinished = true
     - finish.mp3 playing
     - Winner displayed
     - Cars frozen
```

### Control Mode States

```javascript
States:
  1. KEYBOARD (default)
     - controlMode = 'keyboard'
     - keys updated from keyboard events
     - keys.forward controlled by spacebar
     - Rotation speed: 0.02

  2. MICROBIT
     - controlMode = 'microbit'
     - keys updated from serial data
     - keys.forward always true
     - Rotation speed: 0.02
     - Serial port connected
```

### Loading Progress Tracking

```javascript
modelsLoaded = 0
totalModels = 4

When each model loads:
  modelsLoaded++
  if (modelsLoaded === totalModels):
    Hide loading overlay
    Show ready screen
```

---

## Module Dependency Graph

```
main.js (entry point)
  ├─ imports scene.js
  ├─ imports lighting.js
  ├─ imports controls.js
  ├─ imports models.js
  │    └─ imports scene.js
  │    └─ imports countdown.js
  │         └─ imports controls.js
  │    └─ imports playerCar.js
  │         └─ imports scene.js
  │         └─ imports models.js
  │         └─ imports aiCar.js
  ├─ imports playerCar.js
  ├─ imports aiCar.js
  │    └─ imports scene.js
  │    └─ imports models.js
  │    └─ imports playerCar.js
  ├─ imports animation.js
  │    └─ imports scene.js
  │    └─ imports controls.js
  │    └─ imports models.js
  │    └─ imports playerCar.js
  │    └─ imports aiCar.js
  │    └─ imports finish.js
  │         └─ imports controls.js
  ├─ imports microbitUI.js
  │    └─ imports controls.js
  │    └─ imports countdown.js
  └─ imports dataLoader.js
       └─ imports aiCar.js
```

**No circular dependencies detected**

---

## Audio System

### Audio State Machine

```
State 1: Page Load
  ▶ instrumental.mp3 (loop, volume 0.5)

State 2: Countdown Triggered
  ▶ instrumental.mp3 (continues)
  ▶ mariokart.mp3 (volume 0.5)

State 3: mariokart.mp3 Ends
  ▶ instrumental.mp3 (continues)
  ▶ racecar.mp3 (loop, volume 0.5)

State 4: Race Finishes
  ⏸ racecar.mp3 (stop)
  ▶ instrumental.mp3 (continues)
  ▶ finish.mp3 (volume 0.5)

State 5: Finish Music Ends
  ▶ instrumental.mp3 (continues looping)
```

### Audio Elements

```html
<audio id="instrumental-music" loop>
  - Plays: On page load
  - Volume: 0.5
  - Loop: true
  - Never stops

<audio id="race-music">
  - File: mariokart.mp3
  - Plays: On countdown start
  - Volume: 0.5
  - One-shot

<audio id="background-music" loop>
  - File: racecar.mp3
  - Plays: When mariokart.mp3 ends
  - Volume: 0.5
  - Loop: true
  - Stops: On race finish

<audio id="finish-music">
  - Plays: On race finish
  - Volume: 0.5
  - One-shot
```

---

## Future Optimization Opportunities

1. **Object Pooling**: Reuse raycaster objects instead of creating new ones
2. **Spatial Partitioning**: Octree for collision detection
3. **LOD (Level of Detail)**: Lower quality terrain meshes when far from camera
4. **Frustum Culling**: Don't render objects outside camera view
5. **Texture Compression**: Use compressed texture formats (KTX2, Basis)
6. **Web Workers**: Move physics calculations off main thread
7. **Instanced Rendering**: If adding multiple AI cars
8. **Bounding Volume Hierarchy**: For faster raycasting

---

## Debugging Tools

### Console Commands

```javascript
// Enable movement logging
window.setLogging(true)

// Export recorded path
const data = window.exportMovementLog()
console.log(JSON.stringify(data))

// Clear movement log
window.clearMovementLog()

// Load custom path data
window.loadPreRecordedPath([...customData])
```

### Performance Monitoring

```javascript
// Check frame rate
stats = new Stats()
document.body.appendChild(stats.dom)

// In animation loop
stats.begin()
// ... render code ...
stats.end()
```

---

## Architecture Patterns Used

1. **Module Pattern**: Each file is a self-contained ES6 module
2. **Singleton Pattern**: Single instances of scene, renderer, camera
3. **Observer Pattern**: Event listeners for keyboard/serial input
4. **State Pattern**: Race state management (LOADING, READY, RACING, FINISHED)
5. **Factory Pattern**: GLTFLoader creates 3D objects from files
6. **Command Pattern**: Keys object represents input commands
7. **Strategy Pattern**: Different control modes (keyboard vs micro:bit)

---

## Coordinate System

**Three.js uses right-handed coordinate system:**
```
      Y (up)
      │
      │
      └─────── X (right)
     ╱
    ╱
   Z (toward camera)
```

**Game coordinates:**
- X-axis: Left (-) to Right (+)
- Y-axis: Down (-) to Up (+)
- Z-axis: Forward (-) to Back (+)

**Starting positions:**
- Player: (-50, 20, -140)
- AI: (-47, 10, -120)
- Finish Line: (-50, ?, -140)

**Rotations:**
- Measured in radians
- Y-axis rotation for horizontal turning
- 0 = facing +Z direction
- π = facing -Z direction
- π/2 = facing +X direction
- -π/2 = facing -X direction

---

This documentation should provide a comprehensive understanding of the Pikes Peak Derby codebase, its architecture, algorithms, and data flow.
