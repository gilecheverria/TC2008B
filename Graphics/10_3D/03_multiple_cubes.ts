/*
 * Script to draw multiple cubes in the same scene.
 * The cubes are animated by changing the rotation at every frame.
 * All cubes will be affected by the same transformations.
 * There are multiple intances of the cube object, all created when the scene is initialized.
 *
 * Gilberto Echeverria
 * 2026-07-24
 */


'use strict';

import * as twgl from 'twgl-base.js';
import GUI from 'lil-gui';
import { M4, V3, type Mat4, type Vec3 } from '../libs/3d-lib';
import { Scene } from '../libs/scene.ts';
import { Object3D } from '../libs/object3d.ts';
import { Camera3D } from '../libs/camera3d.ts';
import { cubeVertexColors } from '../libs/shapes.ts';

// Define the shader code, using GLSL 3.00
import vsGLSL from '../assets/shaders/vs_color.glsl?raw';
import fsGLSL from '../assets/shaders/fs_color.glsl?raw';

class CubeMultyScene extends Scene<'cube'> {

    // Variable for the scene settings
    settings = {
        // Speed in degrees
        rotationSpeed: {
            x: 10,
            y: 10,
            z: 10,
        },
    };

    // Duration of the animation in milliseconds
    duration: number = 1000;

    constructor(gl: WebGL2RenderingContext) {
        super(gl, vsGLSL, fsGLSL);

        // Configure the camera for this scene
        this.camera = new Camera3D(
            0,              // ID
            20,             // Distance to target
            0,              // Azimut
            0,              // Elevation
            [0, 0, 10],
            [0, 0, 0]);
        // Make the camera respond to keyboard events
        this.camera.setupControls();

        // Create all the cube instances for this scene
        this.createCubeInstances(5, 5, 4);
    }

    createCubeInstances(rows: number, cols: number, distance: number): void {
        const rowStart: number = -Math.floor(rows / 2);
        const rowEnd: number = Math.floor(rows / 2);
        const colStart: number = -Math.floor(cols / 2);
        const colEnd: number = Math.floor(cols / 2);

        for (let j=rowStart; j<=rowEnd; j++) {
            for (let i=colStart; i<=colEnd; i++) {
                // Define a new base translation for each cube
                let x = i * distance;
                let y = j * distance;
                // Add the cube to the scene with a unique name
                const cube = this.addObject(`cube-${x}-${y}`, cubeVertexColors(1), [0.5, 0.5, 0.5, 1]);
                // Set the initial position of the cube
                cube.transforms.t.x = x;
                cube.transforms.t.y = y;
            }
        }
    }

    drawObject(object: Object3D, viewProjectionMatrix: Mat4): void {
        // Get the WebGL context and program info
        const { gl, programInfo } = this;

        // Prepare the vector for translation and scale
        let v3_tra: Vec3 = object.posArray;
        let v3_sca: Vec3 = object.scaArray;

        // Create the individual transform matrices
        const scaMat: Mat4 = M4.scale(v3_sca);
        const rotXMat: Mat4 = M4.rotationX(object.transforms.rr.x);
        const rotYMat: Mat4 = M4.rotationY(object.transforms.rr.y);
        const rotZMat: Mat4 = M4.rotationZ(object.transforms.rr.z);
        const traMat: Mat4 = M4.translation(v3_tra);

        // Create the composite matrix with all transformations
        let transforms: Mat4 = M4.identity();
        transforms = M4.multiply(scaMat, transforms);
        transforms = M4.multiply(rotXMat, transforms);
        transforms = M4.multiply(rotYMat, transforms);
        transforms = M4.multiply(rotZMat, transforms);
        transforms = M4.multiply(traMat, transforms);

        //object.matrix = transforms;

        // Apply the projection to the final matrix for the
        // World-View-Projection
        const wvpMat: Mat4 = M4.multiply(viewProjectionMatrix, transforms);

        let uniforms = {
            u_worldViewProjection: wvpMat,
        }

        twgl.setUniforms(programInfo, uniforms);
        gl.bindVertexArray(object.vao);
        twgl.drawBufferInfo(gl, object.bufferInfo);
        //twgl.drawBufferInfo(gl, object.bufferInfo, gl.LINES);
    }

    // Function to do the actual display of the scene
    render(deltaTime: number): void {
        const { gl, programInfo } = this;

        // Clear the canvas
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Tell webgl to cull faces
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        gl.useProgram(programInfo.program);

        // Check for camera keys and update the camera position
        this.camera.checkKeys();
        const viewProjectionMatrix = this.camera.setupViewProjection(gl);

        this.renderMultipleCubes(viewProjectionMatrix, deltaTime);
    }

    renderMultipleCubes(
        viewProjectionMatrix: Mat4,
        deltaTime: number
    ): void {
        // Calculate the fraction of the duration that has passed
        const fract = deltaTime / this.duration;

        for  (const [_name, object] of this.allObjects) {
            // Rotate the base object according to the settings
            object.transforms.rd.x = (object.transforms.rd.x + this.settings.rotationSpeed.x * fract) % 360;
            object.transforms.rd.y = (object.transforms.rd.y + this.settings.rotationSpeed.y * fract) % 360;
            object.transforms.rd.z = (object.transforms.rd.z + this.settings.rotationSpeed.z * fract) % 360;
            object.transforms.rr.x = object.transforms.rd.x * Math.PI / 180;
            object.transforms.rr.y = object.transforms.rd.y * Math.PI / 180;
            object.transforms.rr.z = object.transforms.rd.z * Math.PI / 180;
            this.drawObject(object, viewProjectionMatrix);
        }
    }

    // Setup UI controls to transform the object
    setupUI() {
        const gui = new GUI();

        const animFolder = gui.addFolder('Animation:')
        animFolder.add( this.settings.rotationSpeed, 'x', 0, 360).decimals(2)
        animFolder.add( this.settings.rotationSpeed, 'y', 0, 360).decimals(2)
        animFolder.add( this.settings.rotationSpeed, 'z', 0, 360).decimals(2)
    }
}

/*
 * Main function to initialize the WebGL context, create the scene, and set up the UI.
 */
function main(): void {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
        throw new Error('No canvas element found in the document');
    }

    const gl = canvas.getContext('webgl2');
    if (!gl) {
        throw new Error('WebGL2 is not supported by this browser');
    }

    const scene = new CubeMultyScene(gl);
    scene.setupUI();
    scene.draw(0);
}

main()
