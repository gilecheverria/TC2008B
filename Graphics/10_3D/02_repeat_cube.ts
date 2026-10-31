/*
 * Drawing multiple objects in the same scene.
 * Using the custom Object3D class.
 * Only one cube object is created, but it is drawn multiple times with different transformations.
 *
 * Gilberto Echeverria
 * 2026-07-16
 */


'use strict';

import * as twgl from 'twgl-base.js';
import GUI from 'lil-gui';
import { M4, V3, type Mat4, type Vec3 } from '../libs/3d-lib';
import { Scene } from '../libs/scene.js';
import { Object3D } from '../libs/object3d.ts';
import { Camera3D } from '../libs/camera3d.ts';
import { cubeFaceColors } from '../libs/shapes.ts';

// Define the shader code, using GLSL 3.00
import vsGLSL from '../assets/shaders/vs_color.glsl?raw';
import fsGLSL from '../assets/shaders/fs_color.glsl?raw';

class CubeRepeatScene extends Scene {

    // Variable for the scene settings
    settings = {
        // Speed in degrees
        rotationSpeed: {
            x: 10,
            y: 10,
            z: 10,
        },
        repeat: {
            rows: 5,
            cols: 5,
        }
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

        // Create the cube object for this scene
        const cube = this.addObject('cube', cubeFaceColors(1), [0.2, 0.6, 0.8, 1]);
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

        const cube = this.getObject('cube');
        this.renderMultipleCubes(viewProjectionMatrix, cube, deltaTime);
    }

    renderMultipleCubes(
        viewProjectionMatrix: Mat4,
        object: Object3D,
        deltaTime: number
    ): void {
        // Draw the object multiple times
        const distance = 3;

        // Calculate the fraction of the duration that has passed
        const fract = deltaTime / this.duration;

        // Rotate the base object according to the settings
        object.transforms.rd.x = (object.transforms.rd.x + this.settings.rotationSpeed.x * fract) % 360;
        object.transforms.rd.y = (object.transforms.rd.y + this.settings.rotationSpeed.y * fract) % 360;
        object.transforms.rd.z = (object.transforms.rd.z + this.settings.rotationSpeed.z * fract) % 360;
        object.transforms.rr.x = object.transforms.rd.x * Math.PI / 180;
        object.transforms.rr.y = object.transforms.rd.y * Math.PI / 180;
        object.transforms.rr.z = object.transforms.rd.z * Math.PI / 180;

        let rowStart: number = Math.floor(this.settings.repeat.rows / 2);
        let rowEnd: number = Math.floor(this.settings.repeat.rows / 2);
        let colStart: number = Math.floor(this.settings.repeat.cols / 2);
        let colEnd: number = Math.floor(this.settings.repeat.cols / 2);
        for (let j=-rowStart; j<=rowEnd; j++) {
            for (let i=-colStart; i<=colEnd; i++) {
                // Define a new base translation for each cube
                let x = i * distance;
                let y = j * distance;
                object.transforms.t.x = x;
                object.transforms.t.y = y;

                this.drawObject(object, viewProjectionMatrix);
            }
        }
    }

    // Setup UI controls to transform the object
    setupUI() {
        const model = this.getObject('cube');

        const gui = new GUI();

        // Create the UI elements for each value
        const traFolder = gui.addFolder('Translation:')
        traFolder.add( model.transforms.t, 'x', -5, 5)
        traFolder.add( model.transforms.t, 'y', -5, 5)
        traFolder.add( model.transforms.t, 'z', -5, 5)

        const rotFolder = gui.addFolder('Rotation:')
        rotFolder.add( model.transforms.rd, 'x', -360, 360)
            .decimals(2)
            .onChange( (value: number) => {
                model.transforms.rr.x = value * Math.PI / 180.0;
            });
        rotFolder.add( model.transforms.rd, 'y', -360, 360)
            .decimals(2)
            .onChange( (value: number) => {
                model.transforms.rr.y = value * Math.PI / 180.0;
            });
        rotFolder.add( model.transforms.rd, 'z', -360, 360)
            .decimals(2)
            .onChange( (value: number) => {
                model.transforms.rr.z = value * Math.PI / 180.0;
            });

        const scaFolder = gui.addFolder('Scale:')
        scaFolder.add( model.transforms, 's_all', -5, 5)
            .onChange( (value: number) => {
                model.transforms.s.x = value;
                model.transforms.s.y = value;
                model.transforms.s.z = value;
            })
        scaFolder.add( model.transforms.s, 'x', -5, 5)
            .listen()
        scaFolder.add( model.transforms.s, 'y', -5, 5)
            .listen()
        scaFolder.add( model.transforms.s, 'z', -5, 5)
            .listen()

        const animFolder = gui.addFolder('Animation:')
        animFolder.add( this.settings.rotationSpeed, 'x', 0, 360).decimals(2)
        animFolder.add( this.settings.rotationSpeed, 'y', 0, 360).decimals(2)
        animFolder.add( this.settings.rotationSpeed, 'z', 0, 360).decimals(2)

        const dupeFolder = gui.addFolder('Duplicate:');
        dupeFolder.add( this.settings.repeat, 'rows', 1, 11, 2)
        dupeFolder.add( this.settings.repeat, 'cols', 1, 11, 2)
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

    const scene = new CubeRepeatScene(gl);
    scene.setupUI();
    scene.draw(0);
}

main()
