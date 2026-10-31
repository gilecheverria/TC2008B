/*
 * Reading models in OBJ format and displaying them in WebGL.
 * Using twgl for boilerplate functions.
 * The twgl and lil-gui libraries are installed with npm.
 *
 * Gilberto Echeverria
 * 2026-07-24
 */


'use strict';

import * as twgl from 'twgl-base.js';
import GUI from 'lil-gui';
import { M4, V3, type Mat4, type Vec3 } from '../libs/3d-lib';
import { Scene } from '../libs/scene.js';
import { Object3D } from '../libs/object3d.ts';
import { Camera3D } from '../libs/camera3d.ts';
import { ObjLoader, type ObjArrays } from '../libs/obj_loader.js';

// Define the shader code, using GLSL 3.00
import vsGLSL from '../assets/shaders/vs_color_texture.glsl?raw';
import fsGLSL from '../assets/shaders/fs_color_texture.glsl?raw';

// Read the whole input file as a string
// https://vitejs.dev/guide/assets.html#importing-asset-as-string
import cubeString from './../assets/models/cube_normals.obj?raw';
import teddyString from './../assets/models/teddy_normals_uv.obj?raw';
import triceString from './../assets/models/triceratops_normals_uv.obj?raw';
import teapotString from './../assets/models/utah_teapot_uv.obj?raw';
import wheelString from './../assets/models/wheel.obj?raw';
import venusString from './../assets/models/venus_normals_uv.obj?raw';
import horseString from './../assets/models/horse_normals_uv.obj?raw';
import sphereSmoothString from '../assets/models/sphere_smooth.obj?raw';

class ObjLoadScene extends Scene {
    // Variable for the scene settings
    settings = {
        // Speed in degrees
        rotationSpeed: {
            x: 0,
            y: 30,
            z: 0,
        },
        //repeat: {
        //    rows: 5,
        //    cols: 5,
        //},
        currentModel: 'teapot',
    };

    // Dictionary for the OBJ files to be loaded
    objStrings = {
        'cube': cubeString,
        'teddy': teddyString,
        'triceratops': triceString,
        'teapot': teapotString,
        'wheel': wheelString,
        'venus': venusString,
        'horse': horseString,
        'sphere_smooth': sphereSmoothString,
    };

    // Duration of the animation in milliseconds
    duration: number = 1000;

    currentObject: Object3D;

    constructor(gl: WebGL2RenderingContext) {
        super(gl, vsGLSL, fsGLSL);
        //
        // Configure the camera for this scene
        this.camera = new Camera3D(
            0,              // ID
            15,             // Distance to target
            0,              // Azimut
            0,              // Elevation
            [0, 0, 10],     // Position
            [0, 0, 0]);     // Target
        // Make the camera respond to keyboard events
        this.camera.setupControls();

        for (const [name, objString] of Object.entries(this.objStrings)) {
            const loader = new ObjLoader();
            const objArrays: ObjArrays = loader.loadObj(objString);
            const object = this.addObject(name, objArrays, [0.8, 0.0, 0.8, 1.0]);

            // Get a texture ready to be drawn on the objects
            try {
                object.texture = twgl.createTexture(gl, {
                    min: gl.NEAREST,
                    mag: gl.NEAREST,
                    // Invert the Y axis of the texture
                    flipY: true,
                    src: './../assets/textures/f-texture.png'
                });
            } catch (error) {
                console.log(error)
            }
        }
        this.currentObject = this.getObject(this.settings.currentModel);

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
            u_texture: object.texture
        }

        twgl.setUniforms(programInfo, uniforms);
        gl.bindVertexArray(object.vao);
        twgl.drawBufferInfo(gl, object.bufferInfo);
        //twgl.drawBufferInfo(gl, object.bufferInfo, gl.LINES);
    }

    // Function to do the actual display of the objects
    render(deltaTime: number): void {
        const { gl, programInfo } = this;

        // Clear the canvas
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // tell webgl to cull faces
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        // Check for camera keys and update the camera position
        this.camera.checkKeys();
        const viewProjectionMatrix = this.camera.setupViewProjection(gl);

        gl.useProgram(programInfo.program);


        const fract = deltaTime / this.duration;

        // Transform and draw the current object
        const object = this.getObject(this.settings.currentModel);
        object.transforms.rd.x = (object.transforms.rd.x + this.settings.rotationSpeed.x * fract) % 360;
        object.transforms.rd.y = (object.transforms.rd.y + this.settings.rotationSpeed.y * fract) % 360;
        object.transforms.rd.z = (object.transforms.rd.z + this.settings.rotationSpeed.z * fract) % 360;
        object.transforms.rr.x = object.transforms.rd.x * Math.PI / 180;
        object.transforms.rr.y = object.transforms.rd.y * Math.PI / 180;
        object.transforms.rr.z = object.transforms.rd.z * Math.PI / 180;
        this.drawObject(object, viewProjectionMatrix);
    }

    // Setup UI controls to transform the object
    setupUI() {

        const gui = new GUI();

        // Selector for the model to be displayed
        gui.add(this.settings, 'currentModel', Object.keys(this.objStrings))
            .onChange( (value: string) => {
                this.currentObject = this.getObject(value);
            });

        // Create the UI elements for each value
        //const traFolder = gui.addFolder('Translation:')
        //traFolder.add( this.currentObject.transforms.t, 'x', -5, 5)
        //traFolder.add( this.currentObject.transforms.t, 'y', -5, 5)
        //traFolder.add( this.currentObject.transforms.t, 'z', -5, 5)

        const rotFolder = gui.addFolder('Rotation:')
        rotFolder.add( this.currentObject.transforms.rd, 'x', -360, 360)
            .decimals(2)
            .onChange( (value: number) => {
                this.currentObject.transforms.rr.x = value * Math.PI / 180.0;
            });
        rotFolder.add( this.currentObject.transforms.rd, 'y', -360, 360)
            .decimals(2)
            .onChange( (value: number) => {
                this.currentObject.transforms.rr.y = value * Math.PI / 180.0;
            });
        rotFolder.add( this.currentObject.transforms.rd, 'z', -360, 360)
            .decimals(2)
            .onChange( (value: number) => {
                this.currentObject.transforms.rr.z = value * Math.PI / 180.0;
            });

        const scaFolder = gui.addFolder('Scale:')
        scaFolder.add( this.currentObject.transforms, 's_all', -5, 5)
            .onChange( (value: number) => {
                this.currentObject.transforms.s.x = value;
                this.currentObject.transforms.s.y = value;
                this.currentObject.transforms.s.z = value;
            })
        scaFolder.add( this.currentObject.transforms.s, 'x', -5, 5)
            .listen()
        scaFolder.add( this.currentObject.transforms.s, 'y', -5, 5)
            .listen()
        scaFolder.add( this.currentObject.transforms.s, 'z', -5, 5)
            .listen()

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

    const scene = new ObjLoadScene(gl);
    scene.setupUI();
    scene.draw(0);
}

main()
