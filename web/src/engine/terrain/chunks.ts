import * as THREE from 'three';
import { CHUNK_UNIT } from '../../../config/constants.js';
import { Coordinates } from '../../maths/coordinates.js';
import { Pool } from '../../utils/reuse.js';
import { ReusableWeaver } from '../mesh/weavers.js';
import { TerrainProperties } from './properties.js';

export class Chunk {
    mesh?: THREE.Mesh;
    private weaver: ReusableWeaver;

    constructor(
        private coords: Coordinates,
        private props: TerrainProperties,
        private version: number,
    ) {
        this.weaver = new ReusableWeaver(this.props);
    }

    reset(coords: Coordinates) { this.coords = coords; this.version = undefined; }

    /**
     * Rebuild the mesh in-place, reusing the previous mesh if present, creating a new one
     * otherwise.
     */
    rebuild(version: number) {
        if (version === this.version) return;
        this.version = version;

        const mesh = this.mesh || new THREE.Mesh();
        this.mesh = mesh;

        // It should be possible to just modify the buffer attributes in place, it would require
        // some modification in the weaver interface to signal that buffers can be reused.
        disposeOfMesh(this.mesh);
        mesh.geometry = this.props.weave(this.coords, this.weaver);
        this.repaint();

        mesh.matrixAutoUpdate = false;
        mesh.position.set(this.coords.x * CHUNK_UNIT, this.coords.y * CHUNK_UNIT, 0);
        this.rescale();
    }

    /**
     * Update the mesh material to the latest version.
     */
    repaint() {
        if(!this.mesh) return;
        this.mesh.material = this.props.paint();
    }

    rescale() {
        this.mesh?.scale.set(this.props.blockSize, this.props.blockSize, this.props.verticalUnit);
        this.mesh?.updateMatrix();
    }
}

function disposeOfMesh(mesh?: THREE.Mesh) {
    mesh?.geometry.dispose();
    (mesh?.material as any)?.dispose?.();
}

///////////
// Pools //

export class ChunkPool {
    private pool = new Pool(() => new Chunk(new Coordinates(0, 0), this.props, undefined));

    constructor(private props: TerrainProperties) { }

    acquire(coords: Coordinates): Chunk {
        const chunk = this.pool.acquire();
        chunk.reset(coords);
        return chunk;
    }

    release(chunk: Chunk) { this.pool.release(chunk) }

    flush() { this.pool.flush((chunk) => disposeOfMesh(chunk.mesh)) }
}
