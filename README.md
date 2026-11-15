![OUTPOST ZERO game title screen](assets/outpost-zero-banner.jpeg)

<div align="center">

# OUTPOST ZERO

### Two Worlds. Two Astronauts. One Mission.

**An interactive 3D space exploration and survival learning game**

**20-level expedition | Earth and Mars | Android and web source**

[Download Android APK](https://github.com/askaniska08-hub/OUTPOST-ZERO/releases/download/v1.0.0-beta.1/OUTPOST.ZERO.apk) · [Latest Release](https://github.com/askaniska08-hub/OUTPOST-ZERO/releases/latest) · [Project Presentation](OUTPOST%20ZERO%20PPT.pptx)

</div>

## Overview

**OUTPOST ZERO** is a mission-based educational game created by **Team Byte Benders** for the **NASA Space Apps Challenge, Junior Astronaut Mission Trainer**. Players take responsibility for linked operations on Earth and Mars: preparing and testing equipment on Earth, delivering it by spacecraft, and using it to build a sustainable Martian outpost.

The game turns concepts such as water recovery, solar power, life support, agriculture and resource conservation into interactive challenges. Players learn that every system in a settlement depends on careful planning and that the same principles matter for sustainable life on Earth.

## The Problem

Space exploration often feels distant to young learners. Textbooks and videos can explain technology but offer fewer opportunities to experience the trade-offs involved in keeping a crew alive away from Earth. Understanding the links among water, food, power, equipment and survival is especially difficult without an interactive model.

## Our Solution

OUTPOST ZERO connects two astronauts through one shared mission:

1. **Earth astronaut:** collect components, assemble scientific prototypes and test them in research facilities.
2. **Cargo mission:** load and launch equipment to Mars.
3. **Mars astronaut:** recover the delivery, explore the environment and construct or upgrade outpost systems.
4. **Mission progression:** use limited supplies and complete objectives to unlock more demanding engineering challenges.

The playable experience uses 3D environments, missions, resources, construction and exploration to make space engineering approachable.

## Key Features

- **20 progressive levels** with Earth preparation and Mars objectives.
- **Two interconnected worlds** and a shared Earth-to-Mars logistics loop.
- **Interactive 3D exploration** with third-person astronaut controls.
- **Resource management:** water, oxygen, food, electricity, fuel, battery capacity and materials.
- **Engineering activities:** prototype assembly, testing, solar systems, water recycling, crop growing and life-support development.
- **Martian settlement development:** construct useful infrastructure, explore locations and collect discoveries.
- **Environmental challenges:** scenarios involving Martian dust and radiation hazards.
- **Space history exhibition:** interactive information about missions, spacecraft and scientific achievements, including NASA image references.
- **Mission progress saving** in the browser's local storage.

## Example Mission Progression

| Level | Mission | Science and engineering focus |
| --- | --- | --- |
| 1 | First Contact | Water filtration and a colony water recycler |
| 2 | Light of a New World | Solar modules, battery storage and dust cleaning |
| 3 | The Living Lab | Microscopy, biological samples and greenhouse construction |
| 4 | Green Under Glass | Hydroponics and growing crops |
| 5 | Breathe Easy | Oxygen generation and life-support capacity |

These are examples from the full 20-level expedition. Later missions expand the colony and introduce additional challenges.

## NASA Inspiration and Educational Content

The in-game exhibition presents information about space technology and exploration milestones, including Apollo, the International Space Station, robotic Mars missions and space telescopes. The exhibition data is implemented in [`src/data/nasaExhibition.ts`](src/data/nasaExhibition.ts), and the interface is in [`src/components/ExhibitModal.tsx`](src/components/ExhibitModal.tsx).

Some exhibit records reference images hosted by the [NASA Image and Video Library](https://images.nasa.gov/). The game's educational content is **NASA-inspired and curated within the source code**. This repository does **not** claim to retrieve live NASA telemetry or to use a real-time NASA API.

Useful NASA resources for scientific context:

- [NASA Mars Exploration](https://science.nasa.gov/mars/)
- [NASA Human Research Program](https://www.nasa.gov/hrp/)
- [NASA Image and Video Library](https://images.nasa.gov/)
- [NASA Space Technology](https://www.nasa.gov/space-technology-mission-directorate/)

Scientific and historical descriptions in a student prototype are educational summaries and should not be treated as engineering specifications.

## Gameplay Preview

The banner above shows the game's opening screen. The project presentation includes additional prototype screenshots, such as Earth facilities, Mars exploration, and the NASA-inspired exhibition.

**[View the seven-slide project presentation](OUTPOST%20ZERO%20PPT.pptx)**

Additional full-resolution gameplay screenshots can be added to a `screenshots/` directory as the visual documentation grows.

## Controls

| Input | Action |
| --- | --- |
| `WASD` / arrow keys | Move and steer |
| `Space` | Jump |
| `E` | Enter or interact |
| Drag mouse or `J` / `L` / `I` / `K` | Look around |
| `Tab` | Open missions |
| `Esc` | Pause or close the current screen |

Touch controls are supported by the game's interface on compatible devices.

## Download and Install on Android

**[Download OUTPOST ZERO Android Beta APK](https://github.com/askaniska08-hub/OUTPOST-ZERO/releases/download/v1.0.0-beta.1/OUTPOST.ZERO.apk)**

1. Open the download link on an Android device.
2. Download `OUTPOST.ZERO.apk`.
3. Open the APK with the Android package installer.
4. If prompted, allow installation from that source and complete installation.
5. Launch the game.

**Release status:** Beta prototype. Performance depends on device compatibility, available memory and graphics support. Install APKs only when you trust their source. The current APK may display the previous internal Android app label because the original Capacitor configuration uses `RED HORIZONS`; changing the release filename alone does not change the installed app label.

## Technology Stack

| Area | Technology |
| --- | --- |
| UI | React 19, TypeScript, CSS and Tailwind CSS |
| 3D rendering | Three.js and WebGL |
| Build tooling | Vite |
| Interface assets | Lucide React icons and Motion |
| Android packaging | Capacitor |
| Local progress | Browser `localStorage` |
| Development assistance | Google AI Studio |

The exact installed dependency versions are recorded in [`package.json`](package.json) and `package-lock.json`.

## Run the Web Game Locally

**Requirements:** Node.js and npm, plus a browser with working WebGL support.

```bash
git clone https://github.com/askaniska08-hub/OUTPOST-ZERO.git
cd OUTPOST-ZERO
npm install
npm run dev
```

Open the local URL shown by Vite (the project currently configures port `3000`).

Create a production web build:

```bash
npm run build
```

## Android Development Build

For contributors who have Android Studio and the Android SDK installed:

```bash
npm install
npm run build
npx cap sync android
npx cap open android
```

Build the Android project from Android Studio. The source repository may not include generated Android platform files; if the `android/` directory is absent, run `npx cap add android` before syncing. Keep signing keys and local SDK settings out of Git.

## Project Presentation

The seven-slide presentation covers the challenge, solution, two-astronaut workflow, key features, prototype screenshots, technical stack and educational impact.

**[Open or download OUTPOST ZERO PPT](OUTPOST%20ZERO%20PPT.pptx)**

## Educational Impact

- Introduces students to planetary science and astronaut mission planning.
- Connects engineering trade-offs with sustainability and resource conservation.
- Encourages experimentation, spatial reasoning and problem-solving.
- Shows how Earth-based research supports exploration beyond our planet.

## Future Work

- Broader planetary exploration and new scientific missions.
- More detailed models for life-support and energy use.
- Improved performance and usability on mobile devices.
- Additional scientific experiments and cooperative mission modes.

These are proposed improvements, not features claimed to be present in the current beta.

## Team and Acknowledgements

**Team:** Byte Benders  
**Project:** OUTPOST ZERO  
**Challenge:** NASA Space Apps Challenge, Junior Astronaut Mission Trainer

We acknowledge NASA's publicly accessible educational resources, imagery and scientific work as inspiration for the game's learning content.

## License and Disclaimer

Source code license: [Apache License 2.0](LICENSE), as included in this repository. Third-party libraries and external media retain their own terms and attributions.

**OUTPOST ZERO is an independent student project. It is not an official NASA product and is not endorsed by or affiliated with NASA.**
attributions.
