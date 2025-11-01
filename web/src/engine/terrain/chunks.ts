import * as THREE from 'three';
import { CHUNK_UNIT } from '../../../config/constants.js';
import { Coordinates } from '../../maths/coordinates.js';
import { Pool } from '../../utils/reuse.js';
import { ReusableWeaver } from '../mesh/weavers.js';
import { TerrainProperties } from './properties.js';

export class Chunk {
    mesh?: THREE.Mesh;
    private weaver = new ReusableWeaver();

    constructor(private coords: Coordinates, private version: number) { }
    reset(coords: Coordinates) { this.coords = coords; this.version = undefined; }

    rebuild(props: TerrainProperties, version: number): THREE.Mesh | null {
        if (version === this.version) return null;
        this.version = version;
        const discarded = this.mesh;

        this.mesh = props.mesh(this.coords, this.weaver);
        this.mesh.matrixAutoUpdate = false;
        this.mesh.position.set(this.coords.x * CHUNK_UNIT, this.coords.y * CHUNK_UNIT, 0);
        this.rescale(props);

        return discarded;
    }

    rescale(props: TerrainProperties) {
        this.mesh.scale.set(props.blockSize, props.blockSize, props.verticalUnit);
        this.mesh.updateMatrix();
    }
}

///////////
// Pools //

export class ChunkPool {
    private pool = new Pool(() => new Chunk(new Coordinates(0, 0), undefined));

    acquire(coords: Coordinates): Chunk {
        const chunk = this.pool.acquire();
        chunk.reset(coords);
        return chunk;
    }

    release(chunk: Chunk) { this.pool.release(chunk) }
}
