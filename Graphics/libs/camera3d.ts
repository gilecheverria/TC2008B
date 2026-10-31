/*
 * Definition of the class to store the information for a camera in 3D
 *
 * To be able to control the camera in a scene,
 * it is necessary to call these methods:
 * - setupControls : after creating the camera instance
 * - checkKeys : inside every 'drawScene' call, before creating
 *   the viewProjectionMatrix
 *
 * Gilberto Echeverria
 * 2026-07-16
 */

import { V3, M4, type Vec3, type Mat4 } from '../libs/3d-lib.js';
import { VecXYZ } from '../libs/vecXYZ.js';

export class Camera3D {
    id: number;
    position: VecXYZ;
    target: VecXYZ;
    distance: number;
    azimuth: number;
    elevation: number;
    minElevation: number;
    maxElevation: number;
    rotationSpeed: number;
    panSpeed: number;
    zoomSpeed: number;
    panOffset: [number, number, number];
    keysPressed: { [key: string]: boolean };

    constructor(
        id: number,
        distance: number = 50,
        azimuth: number = 0,
        elevation: number = Math.PI / 4,
        position: number[] = [0, 0, 10],
        target: number[] = [0, 0, 0]
    ) {
        this.id = id;
        // Initial transformations
        this.position = {
            x: position[0],
            y: position[1],
            z: position[2],
        };
        this.target = {
            x: target[0],
            y: target[1],
            z: target[2],
        }

        // Determine the camera location with respect to its target
        this.distance = distance;   // Distance from the camera to its target
        this.azimuth = azimuth;     // Horizontal rotation from the target plane
        this.elevation = elevation; // Vertical rotation

        // Elevation limits for the camera
        this.minElevation = -Math.PI / 2 + 0.1; // Aproximately -90 + 5.7 degrees
        this.maxElevation = Math.PI / 2 - 0.1;  // Aproximately  90 - 5.7 degrees

        // Transformation speeds
        this.rotationSpeed = 0.02;
        this.panSpeed = 0.5;
        this.zoomSpeed = 2.0;

        // Panning variables
        this.panOffset = [0, 0, 0];

        // Object to store pressed keys
        this.keysPressed = {};
    }

    setupViewProjection(gl: WebGL2RenderingContext): Mat4 {
        // Field of view of 60 degrees vertically, in radians
        const fov = 60 * Math.PI / 180;
        const canvas = gl.canvas as HTMLCanvasElement;
        const aspect = canvas.clientWidth / canvas.clientHeight;

        // Matrices for the world view
        const projectionMatrix = M4.perspective(fov, aspect, 1, 200);

        const cameraPosition: Vec3 = this.posArray;
        const target: Vec3 = this.targetArray;
        const up: Vec3 = V3.create(0, 1, 0);

        const cameraMatrix = M4.lookAt(cameraPosition, target, up);
        const viewMatrix = M4.inverse(cameraMatrix);
        const viewProjectionMatrix = M4.multiply(projectionMatrix, viewMatrix);

        return viewProjectionMatrix;
    }

    // Return the current position of the camera as an array of 3 floats
    get posArray() {
        //return V3.create(this.position.x, this.position.y, this.position.z);

        // Current position from the spherical coordinates
        const x = this.target.x + this.distance * Math.cos(this.elevation) * Math.sin(this.azimuth);
        const y = this.target.y + this.distance * Math.sin(this.elevation);
        const z = this.target.z + this.distance * Math.cos(this.elevation) * Math.cos(this.azimuth);

        return V3.create(
            x + this.panOffset[0],
            y + this.panOffset[1],
            z + this.panOffset[2]
        );
    }

    // Return the current target of the camera as an array of 3 floats
    get targetArray() {
        //return V3.create(this.target.x, this.target.y, this.target.z);

        //console.log(`T X: ${this.target.x} + ${this.panOffset[0]} = ${this.target.x + this.panOffset[0]}`)
        //console.log(`T X: ${this.target.y} + ${this.panOffset[1]} = ${this.target.y + this.panOffset[1]}`)
        //console.log(`T X: ${this.target.z} + ${this.panOffset[2]} = ${this.target.z + this.panOffset[2]}`)

        return V3.create(
            this.target.x + this.panOffset[0],
            this.target.y + this.panOffset[1],
            this.target.z + this.panOffset[2]
        );
    }

    // Methods called to affect the position of the camera
    rotate(deltaAzimuth: number, deltaElevation: number): void {
        this.azimuth += deltaAzimuth * this.rotationSpeed;
        this.elevation += deltaElevation * this.rotationSpeed;

        // Limitar la elevación según los nuevos límites
        this.elevation = Math.max(this.minElevation, Math.min(this.maxElevation, this.elevation));
    }

    pan(deltaX: number, deltaY: number): void {
        const s = Math.sin(this.azimuth);
        const c = Math.cos(this.azimuth);
        // Determine the current position of the camera
        //const front = [ s, 0,  c];
        const right = [ c, 0, -s];
        const up = [0, 1, 0];

        // Update the panning offset
        this.panOffset[0] += (-right[0] * deltaX + up[0] * deltaY) * this.panSpeed;
        this.panOffset[1] += (-right[1] * deltaX + up[1] * deltaY) * this.panSpeed;
        this.panOffset[2] += (-right[2] * deltaX + up[2] * deltaY) * this.panSpeed;
    }

    zoom(delta: number): void {
        this.distance += delta * this.zoomSpeed;
        // Limit the near and far distances of the camera
        this.distance = Math.max(10, Math.min(50, this.distance));
    }

    setupControls(): void {
        window.addEventListener('keydown', (e) => {
            this.keysPressed[e.key] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keysPressed[e.key] = false;
        });
    }

    checkKeys(): void {
        // Rotation
        if (this.keysPressed['ArrowLeft']) {
            this.rotate(-1, 0);
        }
        if (this.keysPressed['ArrowRight']) {
            this.rotate(1, 0);
        }
        if (this.keysPressed['ArrowUp']) {
            this.rotate(0, 1);
        }
        if (this.keysPressed['ArrowDown']) {
            this.rotate(0, -1);
        }

        // Panning
        if (this.keysPressed['d'] || this.keysPressed['Q']) {
            this.pan(-1, 0);
        }
        if (this.keysPressed['a'] || this.keysPressed['E']) {
            this.pan(1, 0);
        }
        if (this.keysPressed['w'] || this.keysPressed['Z']) {
            this.pan(0, 1);
        }
        if (this.keysPressed['s'] || this.keysPressed['C']) {
            this.pan(0, -1);
        }

        // Zoom
        if (this.keysPressed['+'] || this.keysPressed['=']) {
            this.zoom(-1); // Zoom in
        }
        if (this.keysPressed['-'] || this.keysPressed['_']) {
            this.zoom(1); // Zoom out
        }
    }
}
