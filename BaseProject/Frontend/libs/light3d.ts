/*
 * Class to store the configuration of a light source in a 3D scene
 *
 * Gilberto Echeverria
 * 2026-07-27
 */


import { V3 } from '../libs/3d-lib.js';
import { type Color } from '../libs/color.js';
import { VecXYZ } from '../libs/vecXYZ.js';

export class Light3D {
    id: number;
    position: VecXYZ;
    ambient: Color;
    diffuse: Color;
    specular: Color;

    constructor(
        id: number,
        position: number[] = [0, 0, 10],
        ambient: Color,
        diffuse: Color,
        specular: Color
    ) {
        this.id = id;
        // Initial transformations
        this.position = {
            x: position[0],
            y: position[1],
            z: position[2],
        };
        this.ambient = ambient;
        this.diffuse = diffuse;
        this.specular = specular;
    }

    // Return the position as an array
    get posArray() {
        return V3.create(this.position.x, this.position.y, this.position.z);
    }

    setColor(color: Color): void {
        this.diffuse = color;
        this.specular = color;
    }
}
