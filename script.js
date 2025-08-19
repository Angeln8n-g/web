document.addEventListener('DOMContentLoaded', () => {
    // Three.js background particles
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.querySelector('.background-particles').appendChild(renderer.domElement);

    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 5000;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 10;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.005,
        color: 0x00ffff,
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    camera.position.z = 5;

    const animate = () => {
        requestAnimationFrame(animate);
        particlesMesh.rotation.x += 0.0001;
        particlesMesh.rotation.y += 0.0002;
        renderer.render(scene, camera);
    };

    animate();

    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    });

    // Logo click easter egg
    const logo = document.querySelector('.logo');
    let clickCount = 0;
    logo.addEventListener('click', () => {
        clickCount++;
        if (clickCount === 5) {
            alert('Secret demo player unlocked!'); // Placeholder for the actual player
            clickCount = 0;
        }
    });

    // Custom cursor trail
    const throttledCreateTrail = throttle(createTrail, 20); // Create trail at most every 20ms
    document.addEventListener('mousemove', (e) => {
        throttledCreateTrail(e.clientX, e.clientY);
    });

    function createTrail(x, y) {
        const trail = document.createElement('div');
        trail.className = 'cursor-trail';
        trail.innerHTML = 'H';
        trail.style.left = x + 'px';
        trail.style.top = y + 'px';
        document.body.appendChild(trail);

        setTimeout(() => {
            trail.remove();
        }, 500); // Corresponds to animation duration
    }

    // Throttle function to limit calls
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    // Discography Section
    const archivesSection = document.getElementById('archives');
    const albums = [
        { title: 'Synthetic Hearts', year: 2023, theme: 'love', img: 'https://via.placeholder.com/300x300/FF00FF/FFFFFF?text=Synthetic+Hearts' },
        { title: 'Neon Rebellion', year: 2022, theme: 'social', img: 'https://via.placeholder.com/300x300/00FFFF/000000?text=Neon+Rebellion' },
        { title: 'Golden Threads', year: 2021, theme: 'love', img: 'https://via.placeholder.com/300x300/FFD700/000000?text=Golden+Threads' },
        { title: 'Digital Dystopia', year: 2020, theme: 'social', img: 'https://via.placeholder.com/300x300/8A2BE2/FFFFFF?text=Digital+Dystopia' }
    ];

    const archivesContainer = document.createElement('div');
    archivesContainer.classList.add('archives-container');

    albums.forEach(album => {
        const card = document.createElement('div');
        card.classList.add('album-card');
        card.classList.add(album.theme === 'social' ? 'theme-social' : 'theme-love');

        card.innerHTML = `
            <div class="album-card-inner">
                <div class="album-card-front">
                    <img src="${album.img}" alt="${album.title}">
                </div>
                <div class="album-card-back">
                    <h3>${album.title}</h3>
                    <p>${album.year}</p>
                    <p>Theme: ${album.theme}</p>
                </div>
            </div>
        `;
        archivesContainer.appendChild(card);
    });

    archivesSection.appendChild(archivesContainer);

    // Interactive Timeline
    const timelineItems = document.querySelectorAll('.timeline-item');

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.5
    });

    timelineItems.forEach(item => {
        observer.observe(item);
    });

    // HUNY Player and Visualizer
    const audio = document.getElementById('audio-source');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const progressBar = document.getElementById('progress-bar');

    // NOTE: Add a valid src to the <audio> tag in index.html for the player to work
    // For example: <audio id="audio-source" src="path/to/your/song.mp3" crossorigin="anonymous"></audio>
    // The 'crossorigin' attribute is important for the Web Audio API to process external audio.

    let audioContext, analyser, source, frequencyData;
    let visualizerScene, visualizerCamera, visualizerRenderer;
    let bars = [];

    function initAudioVisualizer() {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        frequencyData = new Uint8Array(analyser.frequencyBinCount);

        // Three.js setup for visualizer
        const canvas = document.getElementById('audio-visualizer');
        visualizerRenderer = new THREE.WebGLRenderer({ canvas, alpha: true });
        visualizerRenderer.setSize(window.innerWidth, window.innerHeight);

        visualizerScene = new THREE.Scene();
        visualizerCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        visualizerCamera.position.z = 100;

        const barCount = analyser.frequencyBinCount;
        const barWidth = 1;
        const radius = 50;

        for (let i = 0; i < barCount; i++) {
            const geometry = new THREE.BoxGeometry(barWidth, 1, barWidth);
            const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(`hsl(${i * 360 / barCount}, 100%, 50%)`) });
            const bar = new THREE.Mesh(geometry, material);

            const angle = (i / barCount) * Math.PI * 2;
            bar.position.x = Math.cos(angle) * radius;
            bar.position.y = Math.sin(angle) * radius;

            visualizerScene.add(bar);
            bars.push(bar);
        }

        animateVisualizer();
    }

    function animateVisualizer() {
        requestAnimationFrame(animateVisualizer);
        analyser.getByteFrequencyData(frequencyData);

        bars.forEach((bar, i) => {
            const scale = frequencyData[i] / 10;
            bar.scale.y = Math.max(scale, 1);
        });

        visualizerScene.rotation.z += 0.002;
        visualizerRenderer.render(visualizerScene, visualizerCamera);
    }

    playPauseBtn.addEventListener('click', () => {
        if (!audioContext) {
            initAudioVisualizer();
        }

        if (audio.paused) {
            audio.play();
            playPauseBtn.textContent = 'Pause';
        } else {
            audio.pause();
            playPauseBtn.textContent = 'Play';
        }
    });

    audio.addEventListener('timeupdate', () => {
        if (audio.duration) {
            progressBar.value = (audio.currentTime / audio.duration) * 100;
        }
    });

    progressBar.addEventListener('input', () => {
        if (audio.duration) {
            audio.currentTime = (progressBar.value / 100) * audio.duration;
        }
    });

    // Live Map
    const mapElement = document.getElementById('live-map');
    if (mapElement) {
        const map = L.map('live-map').setView([20, 0], 2);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(map);

        const concerts = [
            { lat: 34.0522, lng: -118.2437, city: 'Los Angeles', date: '2024-10-26' },
            { lat: 40.7128, lng: -74.0060, city: 'New York', date: '2024-11-02' },
            { lat: 51.5074, lng: -0.1278, city: 'London', date: '2024-11-15' },
            { lat: 35.6895, lng: 139.6917, city: 'Tokyo', date: '2024-12-05' }
        ];

        const customIcon = L.divIcon({
            className: 'holographic-marker',
            iconSize: [20, 20]
        });

        concerts.forEach(concert => {
            const marker = L.marker([concert.lat, concert.lng], { icon: customIcon }).addTo(map);
            marker.bindPopup(`<b>${concert.city}</b><br>${concert.date}`);
        });
    }

    // Mobile swipe gestures for player
    const playerElement = document.getElementById('huny-player');
    let touchStartX = 0;
    let touchEndX = 0;

    playerElement.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, false);

    playerElement.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, false);

    function handleSwipe() {
        if (touchEndX < touchStartX) {
            console.log('Swiped left - next song');
            // Add logic for next song
        }
        if (touchEndX > touchStartX) {
            console.log('Swiped right - previous song');
            // Add logic for previous song
        }
    }
});
