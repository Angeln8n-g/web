# HUNYKHO - Futuristic Artist Website

This project is a creative and immersive website for the pop artist HUNYKHO, designed to be visually impactful and reflect the dual nature of the artist's music (social criticism and love/friendship).

## Features

-   **Futuristic Visuals**: Utilizes a holographic color palette, neon effects, and futuristic typography.
-   **Interactive Elements**: Includes a 3D particle background, a custom cursor with a sound wave trail, and an animated brand symbol.
-   **Core Sections**:
    -   Hero section with a pulsating logo.
    -   3D rotating album cards for the discography.
    -   Interactive, animated timeline for the artist's story.
    -   A stylized, dark-themed map for live concert dates.
    -   An interactive contact form with materializing fields.
-   **Audio Player**: A floating audio player with a 3D audio visualizer.
-   **Mobile Optimized**: The website is fully responsive, with a mobile-first approach for the layout and touch gestures for the player.

## How to Use

1.  Clone or download the repository.
2.  Open the `index.html` file in a modern web browser.

**Note on the Audio Player**: The audio player is fully functional but requires a valid audio source. To make it work, you need to:
1.  Add an audio file (e.g., in mp3 format) to the project directory.
2.  In `index.html`, find the `<audio>` tag with the id `audio-source`.
3.  Update the `src` attribute to point to your audio file, like this: `<audio id="audio-source" src="path/to/your/song.mp3" crossorigin="anonymous"></audio>`. The `crossorigin="anonymous"` attribute is important for the audio visualizer to work with local or cross-origin files.

## Technologies Used

-   HTML5
-   CSS3
-   JavaScript (ES6+)
-   [Three.js](https://threejs.org/) - For 3D graphics (particle background and audio visualizer).
-   [Leaflet.js](https://leafletjs.com/) - For the interactive map.
-   [Playwright](https://playwright.dev/) - For frontend verification.
