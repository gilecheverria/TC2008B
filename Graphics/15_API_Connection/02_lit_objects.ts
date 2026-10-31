/*
 * Drawing multiple objects to represent the agents from the Python server
 * Using the custom Object3D class.
 *
 * The scene shows colored cubes
 *
 * Requires running the server from the TC2008B repo:
 * TC2008B/AgentsVisualization/Server/agentsServer/agents_server.py
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
import { Light3D } from '../libs/light3d.ts';
import { cubeFaceColors } from '../libs/shapes.ts';
import { ObjLoader, type ObjArrays } from '../libs/obj_loader.js';

// Functions and arrays for the communication with the API
import { agents, obstacles, initAgentsModel,
         update, getAgents, getObstacles } from '../libs/api_connection.js';

// Define the shader code, using GLSL 3.00
import vsPhongGLSL from '../assets/shaders/vs_phong.glsl?raw';
import fsPhongGLSL from '../assets/shaders/fs_phong.glsl?raw';
import vsFlatGLSL from '../assets/shaders/vs_flat.glsl?raw';
import fsFlatGLSL from '../assets/shaders/fs_flat.glsl?raw';

import sphereFlatString from '../assets/models/sphere_flat.obj?raw';

class APILitScene extends Scene {

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
    lights: Light3D[] = [];
    elapsed: number = 0;

    constructor(gl: WebGL2RenderingContext) {
        super(gl, {
            phong: {vs: vsPhongGLSL, fs: fsPhongGLSL},
            flat: {vs: vsFlatGLSL, fs: fsFlatGLSL},
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

        this.lights.push(new Light3D(
            0,                      // ID
            [10, 10, 4],            // Position
            [0.3, 0.3, 0.3, 1.0],   // Ambient
            [1.0, 1.0, 1.0, 1.0],   // Diffuse
            [1.0, 1.0, 1.0, 1.0],   // Specular
        ));

        // Create the cube object for this scene
        this.object = this.addObject('obstacle', 'phong', cubeFaceColors(0.5), randomColor());
        //obstacles.push(this.object); // REMOVE

        // Use the sphere object to represent the light
        const loader = new ObjLoader();
        const objArrays: ObjArrays = loader.loadObj(sphereFlatString);
        const light = this.addObject('light', 'flat', objArrays, this.lights[0].diffuse);
        // Copy the position of the light to the object to visualize it
        light.transforms.t = this.lights[0].position;
        light.transforms.s = {x: 0.1, y: 0.1, z: 0.1};

        // Create a base object for the agens
        this.object = this.addObject('agent', 'phong', objArrays, randomColor());
        this.object.transforms.s = {x: 0.5, y: 0.5, z: 0.5};
        //this.object.transforms.t = {x: 5, y: 5, z: 5};  // REMOVE
        //agents.push(this.object); // REMOVE

    }

    prepareObject(name: string, object: Object3DProgram, viewProjectionMatrix: Mat4): void {
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

        this.drawObject(name, uniforms);
    }

    prepareLight(object: Object3DProgram, viewProjectionMatrix: Mat4): void {
        const v3_trans: Vec3 = object.posArray;
        const v3_scale: Vec3 = object.scaArray;

        // Matrices for the object world transforms
        const traMat: Mat4 = M4.translation(v3_trans);
        const scaMat: Mat4 = M4.scale(v3_scale);

        let world: Mat4 = M4.identity();
        world = M4.multiply(scaMat, world);
        world = M4.multiply(traMat, world);
        const wvpMat: Mat4 = M4.multiply(viewProjectionMatrix, world);

        let uniforms = {
            u_color: object.color,
            u_transforms: wvpMat,
        }

        this.drawObject('light', uniforms);
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
            u_lightWorldPosition: this.lights[0].posArray,
            u_ambientLight: this.lights[0].ambient,
            u_diffuseLight: this.lights[0].diffuse,
            u_specularLight: this.lights[0].specular,
        }
        // Set the global uniforms for all the programs used
        for (const [_name, program] of this.programs) {
            gl.useProgram(program.program);
            twgl.setUniforms(program, globalUniforms);
        }

        // Check for camera keys and update the camera position
        this.camera.checkKeys();
        const viewProjectionMatrix = this.camera.setupViewProjection(gl);

        this.renderObstacles(viewProjectionMatrix);
        this.renderAgents(viewProjectionMatrix, deltaTime);

        //const cube = this.getObject('obstacle');
        //this.prepareObject('obstacle', cube, viewProjectionMatrix);

        const light = this.getObject('light');
        this.prepareLight(light, viewProjectionMatrix);

        //const sphere = this.getObject('agent');
        //this.prepareObject('agent', sphere, viewProjectionMatrix);

        // Update the scene after the elapsed duration
        if (this.elapsed >= this.settings.updateDelay) {
            this.elapsed = 0;
            await update(this, 'agent');
        } else {
            this.elapsed += deltaTime;
        }

        return 0;
    }

    renderObstacles(
        viewProjectionMatrix: Mat4,
    ): void {
        for (const object of obstacles) {
            this.prepareObject('obstacle', object, viewProjectionMatrix);
        }

    }

    renderAgents(
        viewProjectionMatrix: Mat4,
        deltaTime: number
    ): void {
        for (const object of agents) {
            this.prepareObject('agent', object, viewProjectionMatrix);
        }

    }


    // Setup UI controls to transform the object
    setupUI() {
        const light = this.getObject('light');

        const gui = new GUI();

        const animFolder = gui.addFolder('Animation:')
        animFolder.add( this.settings, 'updateDelay', 0, 2000)

        // Settings for the light
        const lightFolder = gui.addFolder('Light:')
        lightFolder.add( this.lights[0].position, 'x', -20, 20)
            .decimals(2)
            .onChange( (value: number) => {
                light.transforms.t.x = value;
            });
        lightFolder.add( this.lights[0].position, 'y', -20, 20)
            .decimals(2)
            .onChange( (value: number) => {
                light.transforms.t.y = value;
            });
        lightFolder.add( this.lights[0].position, 'z', -20, 20)
            .decimals(2)
            .onChange( (value: number) => {
                light.transforms.t.z = value;
            });

        lightFolder.addColor(this.lights[0], 'ambient')
        lightFolder.addColor(this.lights[0], 'diffuse')
        lightFolder.addColor(this.lights[0], 'specular')
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

    const scene = new APILitScene(gl);

    // Initialize the agents model
    await initAgentsModel();

    // Get the agents and obstacles
    await getAgents(scene, 'agent');
    await getObstacles(scene, 'obstacle');

    scene.setupUI();
    scene.draw(0);

    return 0;
}

main()
