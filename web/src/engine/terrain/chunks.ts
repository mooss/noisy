import * as THREE from 'three';
import { CHUNK_UNIT } from '../../../config/constants.js';
import { Coordinates } from '../../maths/coordinates.js';
import { ReusableWeaver } from '../mesh/weavers.js';
import { TerrainProperties } from './properties.js';

export class Chunk {
    mesh?: THREE.Mesh;
    private weaver = new ReusableWeaver();

    constructor(private coords: Coordinates, private version: number) { }

    rebuild(props: TerrainProperties, version: number): THREE.Mesh | null {
        if (version === this.version) return null;
        this.version = version;
        const old = this.mesh;

        this.mesh = props.mesh(this.coords, this.weaver);
        this.mesh.translateX(this.coords.x * CHUNK_UNIT);
        this.mesh.translateY(this.coords.y * CHUNK_UNIT);
        this.mesh.matrixAutoUpdate = false;
        this.rescale(props);

        return old;
    }

    rescale(props: TerrainProperties) {
        this.mesh.scale.set(props.blockSize, props.blockSize, props.verticalUnit);
        this.mesh.updateMatrix();
    }
}
