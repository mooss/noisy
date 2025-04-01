import { interpolateColors } from './utils.js';

export function createHexagonGeometry(radius, height) {
    const shape = new THREE.Shape();
    const sides = 6;
    const angle = (2 * Math.PI) / sides;

    shape.moveTo(radius, 0); // The top point.

    // The five remaining points.
    for (let i = 1; i <= sides; i++) {
        const x = radius * Math.cos(angle * i);
        const y = radius * Math.sin(angle * i);
        shape.lineTo(x, y);
    }

    return new THREE.ExtrudeGeometry(shape, {
        steps: 1,
        depth: height,
        bevelEnabled: false
    });
}

export function createGridMeshes(terrainGrid, terrainMeshes, useHexagons, useSurface, palettes, currentPalette) {
    // Clear previous meshes.
    while (terrainMeshes.children.length > 0) {
        terrainMeshes.remove(terrainMeshes.children[0]);
    }

    if (useSurface) {
        const geometry = new THREE.PlaneGeometry(
            terrainGrid.size * terrainGrid.cellSize,
            terrainGrid.size * terrainGrid.cellSize,
            terrainGrid.size - 1,
            terrainGrid.size - 1
        );

        const positionAttribute = geometry.getAttribute('position');
        const colors = [];

        // Set heights and colors.
        for (let i = 0; i < terrainGrid.size; i++) {
            for (let j = 0; j < terrainGrid.size; j++) {
                // Height.
                const vertexIndex = i * terrainGrid.size + j;
                const height = terrainGrid.data[i][j];
                positionAttribute.setZ(vertexIndex, height);

                // Color.
                const color = interpolateColors(palettes[currentPalette], height / terrainGrid.maxH);
                colors.push(color.r, color.g, color.b);
            }
        }

        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            side: THREE.DoubleSide
        });

        const surfaceMesh = new THREE.Mesh(geometry, material);
        surfaceMesh.rotation.z = Math.PI / 2;
        terrainMeshes.add(surfaceMesh);
        return;
    }

    const ySpacingFactor = useHexagons ? Math.sqrt(3) / 2 : 1;
    const hexRadius = terrainGrid.cellSize / Math.sqrt(3);
    const hexWidth = terrainGrid.cellSize; // Distance between parallel sides.

    // Calculate total grid dimensions for centering.
    let totalGridWidth = (terrainGrid.size - 1) * terrainGrid.cellSize + (useHexagons ? hexWidth / 2 : 0);
    let totalGridHeight = (terrainGrid.size - 1) * terrainGrid.cellSize * ySpacingFactor;

    const startX = -totalGridWidth / 2;
    const startY = -totalGridHeight / 2;
    const material = new THREE.MeshStandardMaterial({ vertexColors: false });

    for (let i = 0; i < terrainGrid.size; i++) {
        for (let j = 0; j < terrainGrid.size; j++) {
            const height = terrainGrid.data[i][j];

            let geometry;
            let mesh;
            const cellColor = interpolateColors(palettes[currentPalette], height / terrainGrid.maxH);

            const xOffset = (useHexagons && j % 2 !== 0) ? hexWidth / 2 : 0;
            const xPos = startX + i * terrainGrid.cellSize + xOffset;
            const yPos = startY + j * terrainGrid.cellSize * ySpacingFactor;
            let zPos = height / 2; // Center squares vertically.

            if (useHexagons) {
                geometry = createHexagonGeometry(hexRadius, height);
                mesh = new THREE.Mesh(geometry, material.clone());
                mesh.material.color.set(cellColor);
                mesh.rotation.z = Math.PI / 2; // Rotate for a flat top orientation.
                zPos = 0; // Hexagon prisms are already centered vertically.
            } else {
                geometry = new THREE.BoxGeometry(terrainGrid.cellSize, terrainGrid.cellSize, height);
                mesh = new THREE.Mesh(geometry, material.clone());
                mesh.material.color.set(cellColor);
            }

            mesh.position.set(xPos, yPos, zPos);
            terrainMeshes.add(mesh);
        }
    }
}

export function setupScene(terrainGrid) {
    // Scene.
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0, 0, 0);

    // Camera. Mediocre, needs to be improved.
    const aspect = window.innerWidth / window.innerHeight;
    const camDist = terrainGrid.size * terrainGrid.cellSize * 1.2 + 50;
    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, camDist * 2);
    camera.position.set(0, -camDist * 0.7, camDist * 0.7);
    camera.lookAt(scene.position);

    // Renderer.
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Lighting.
    const ambientLight = new THREE.AmbientLight(0x808080); // Soft white light.
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, .8);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // Mouse controls.
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Smooths camera movement.
    controls.dampingFactor = 0.1;

    // Meshes (from heightmap to geometry).
    const terrainMeshes = new THREE.Group();
    scene.add(terrainMeshes);

    // Event Listeners.
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }, false);

    return { scene, camera, renderer, controls, terrainMeshes };
}
