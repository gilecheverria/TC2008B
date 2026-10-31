/*
 * Drawing multiple objects to represent the agents from the Python server
 * Using the custom Object3D class.
 *
 * The scene shows colored cubes.
 *
 * Requires running the server from the TC2008B repo:
 * TC2008B/BaseProject/Backend/agents_server.py
 *
 * Gilberto Echeverria
 * 2026-09-04
 */


'use strict';

import * as twgl from 'twgl-base.js';
import GUI from 'lil-gui';
import { M4, V3, type Mat4, type Vec3 } from '../libs/3d-lib';
import { Scene } from '../libs/scene_multi_shader.js';
import { randomColor } from '../libs/color.ts';
import { Object3DProgram } from '../libs/object3d_multi_shader.ts';
import { Camera3D } from '../libs/camera3d.ts';
import { cubeFaceColors } from '../libs/shapes.ts';

// Functions and arrays for the communication with the API
import { agents, obstacles, initAgentsModel,
         update, getAgents, getObstacles } from '../libs/api_connection.js';

// Define the shader code, using GLSL 3.00
import vsColorGLSL from '../assets/shaders/vs_color.glsl?raw';
import fsColorGLSL from '../assets/shaders/fs_color.glsl?raw';

class APIConnectionScene extends Scene {

    // Variable for the scene settings
    settings = {
        // Speed in degrees
        rotationSpeed: {
            x: 10,
            y: 10,
            z: 10,
        },
        updateDelay: 1000,
    };

    // Duration of the animation in milliseconds
    camera: Camera3D;
    object: Object3DProgram;
    elapsed: number = 0;

    constructor(gl: WebGL2RenderingContext) {
        super(gl, {
            color: {vs: vsColorGLSL, fs: fsColorGLSL},
        });

        // Configure the camera for this scene
        this.camera = new Camera3D(
            0,              // ID
            10,             // Distance to target
            4,              // Azimut
            0.8,              // Elevation
            [0, 0, 10],
            [0, 0, 0]);
        // Place the camera in a different position, where it can view the scene
        this.camera.panOffset = [0, 8, 0];
        // Make the camera respond to keyboard events
        this.camera.setupControls();

        // Create a base cube object to be replicated in the scene
        this.object = this.addObject('cube', 'color', cubeFaceColors(0.5), randomColor());
    }

    prepareObject(object: Object3DProgram, viewProjectionMatrix: Mat4): void {
        // Get the WebGL context and program info

        // Prepare the vector for translation and scale
        const v3_tra: Vec3 = object.posArray;
        const v3_sca: Vec3 = object.scaArray;

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

        // Apply the projection to the final matrix for the
        // World-View-Projection
        const wvpMat: Mat4 = M4.multiply(viewProjectionMatrix, transforms);

        // The matrix to be used for normal transformations
        const normalMat = M4.transpose(M4.inverse(transforms));

        let uniforms = {
            u_world: transforms,
            u_worldViewProjection: wvpMat,
            u_worldInverseTransform: normalMat,
            u_ambientColor: object.color,
            u_diffuseColor: object.color,
            u_specularColor: object.color,
            u_shininess: object.shininess,
        }

        this.drawObject('cube', uniforms);
    }

    // Function to do the actual display of the scene
    async render(deltaTime: number): Promise<number> {
        const { gl } = this;

        // Clear the canvas
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Tell webgl to cull faces
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        // Scene uniforms
        const globalUniforms = {
            u_viewWorldPosition: this.camera.posArray,
        }
        // Set the global uniforms for all the programs used
        for (const [_name, program] of this.programs) {
            gl.useProgram(program.program);
            twgl.setUniforms(program, globalUniforms);
        }

        // Check for camera keys and update the camera position
        this.camera.checkKeys();
        const viewProjectionMatrix = this.camera.setupViewProjection(gl);

        this.renderObstacles(viewProjectionMatrix, deltaTime);
        this.renderAgents(viewProjectionMatrix, deltaTime);

        // Update the scene after the elapsed duration
        if (this.elapsed >= this.settings.updateDelay) {
            this.elapsed = 0;
            await update(this, 'cube');
        } else {
            this.elapsed += deltaTime;
        }

        return 0;
    }

    renderObstacles(
        viewProjectionMatrix: Mat4,
        deltaTime: number
    ): void {
        for (const object of obstacles) {
                this.prepareObject(object, viewProjectionMatrix);
        }

    }

    renderAgents(
        viewProjectionMatrix: Mat4,
        deltaTime: number
    ): void {
        for (const object of agents) {
                this.prepareObject(object, viewProjectionMatrix);
        }

    }

    // Setup UI controls to transform the object
    setupUI() {
        const gui = new GUI();

        const animFolder = gui.addFolder('Animation:')

        animFolder.add( this.settings, 'updateDelay', 0, 2000)
    }
}

/*
 * Main function to initialize the WebGL context, create the scene, and set up the UI.
 */
async function main(): Promise<number> {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
        throw new Error('No canvas element found in the document');
    }

    const gl = canvas.getContext('webgl2');
    if (!gl) {
        throw new Error('WebGL2 is not supported by this browser');
    }

    const scene = new APIConnectionScene(gl);

    // Initialize the agents model
    await initAgentsModel();

    // Get the agents and obstacles
    await getAgents(scene, 'cube');
    await getObstacles(scene, 'cube');

    scene.setupUI();
    scene.draw(0);

    return 0;
}

main()
