/*
 * Drawing multiple objects in the same scene, with different colors.
 * Drawing the position of the light source as well, using a different shader.
 *
 * Gilberto Echeverria
 * 2026-08-24
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
import { ObjLoader, type ObjArrays } from '../libs/obj_loader.js';

// Define the shader code, using GLSL 3.00
import vsPhongGLSL from '../assets/shaders/vs_phong.glsl?raw';
import fsPhongGLSL from '../assets/shaders/fs_phong.glsl?raw';
import vsFlatGLSL from '../assets/shaders/vs_flat.glsl?raw';
import fsFlatGLSL from '../assets/shaders/fs_flat.glsl?raw';


// Read the whole input file as a string
// https://vitejs.dev/guide/assets.html#importing-asset-as-string
import teddyString from './../assets/models/teddy_normals_uv.obj?raw';
import triceString from './../assets/models/triceratops_normals_uv.obj?raw';
import teapotString from './../assets/models/utah_teapot_uv.obj?raw';
import horseString from './../assets/models/horse_normals_uv.obj?raw';
import sphereFlatString from '../assets/models/sphere_flat.obj?raw';

class LitObjectsScene extends Scene {

    // Variable for the scene settings
    settings = {
        // Speed in degrees
        rotationSpeed: {
            x: 40,
            y: 40,
            z: 40,
        },
    };

    // Dictionary for the OBJ files to be loaded
    objStrings = {
        'teddy': teddyString,
        'triceratops': triceString,
        'teapot': teapotString,
        'horse': horseString,
    };

    // Duration of the animation in milliseconds
    duration: number = 1000;
    camera: Camera3D;
    lights: Light3D[] = [];
    //object: Object3DProgram;

    constructor(gl: WebGL2RenderingContext) {
        super(gl, {
            phong: {vs: vsPhongGLSL, fs: fsPhongGLSL},
            flat: {vs: vsFlatGLSL, fs: fsFlatGLSL},
        });

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

        this.lights.push(new Light3D(
            0,                      // ID
            [3, 3, 5],              // Position
            [0.3, 0.3, 0.3, 1.0],   // Ambient
            [1.0, 1.0, 1.0, 1.0],   // Diffuse
            [1.0, 1.0, 1.0, 1.0],   // Specular
        ));

        for (const [name, objString] of Object.entries(this.objStrings)) {
            const loader = new ObjLoader();
            const objArrays: ObjArrays = loader.loadObj(objString);
            const object = this.addObject(name, 'phong', objArrays, randomColor());
        }

        // Set the position for each of the 4 models to be displayed
        const offset = 4.0;
        this.getObject('teddy').transforms.t = { x: -offset, y: offset, z: 0 };
        this.getObject('triceratops').transforms.t = { x: offset, y: offset, z: 0 };
        this.getObject('teapot').transforms.t = { x: -offset, y: -offset, z: 0 };
        this.getObject('horse').transforms.t = { x: offset, y: -offset, z: 0 };

        // Use the sphere object to represent the light
        const loader = new ObjLoader();
        const objArrays: ObjArrays = loader.loadObj(sphereFlatString);
        const light = this.addObject('light', 'flat', objArrays, this.lights[0].diffuse);
        // Copy the position of the light to the object to visualize it
        light.transforms.t = this.lights[0].position;
        light.transforms.s = {x: 0.1, y: 0.1, z: 0.1};
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
    render(deltaTime: number): void {
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

        this.renderMultipleObjects(viewProjectionMatrix, deltaTime);
        const light = this.getObject('light');
        this.prepareLight(light, viewProjectionMatrix);
    }

    renderMultipleObjects(
        viewProjectionMatrix: Mat4,
        deltaTime: number
    ): void {
        // Calculate the fraction of the duration that has passed
        const fract = deltaTime / this.duration;

        for (const [name, object] of this.allObjects) {
            // Rotate the base object according to the settings
            object.transforms.rd.x = (object.transforms.rd.x + this.settings.rotationSpeed.x * fract) % 360;
            object.transforms.rd.y = (object.transforms.rd.y + this.settings.rotationSpeed.y * fract) % 360;
            object.transforms.rd.z = (object.transforms.rd.z + this.settings.rotationSpeed.z * fract) % 360;
            object.transforms.rr.x = object.transforms.rd.x * Math.PI / 180;
            object.transforms.rr.y = object.transforms.rd.y * Math.PI / 180;
            object.transforms.rr.z = object.transforms.rd.z * Math.PI / 180;

            this.prepareObject(name, object, viewProjectionMatrix);
        }
    }

    // Setup UI controls to transform the object
    setupUI() {
        const light = this.getObject('light');

        const gui = new GUI();

        /*
        const modelFolder = gui.addFolder('Model material')
        modelFolder.addColor( this.object, 'color')
        modelFolder.add( this.object, 'shininess', 1, 200, 1)
        */

        const animFolder = gui.addFolder('Animation:')
        animFolder.add( this.settings.rotationSpeed, 'x', 0, 360).decimals(2)
        animFolder.add( this.settings.rotationSpeed, 'y', 0, 360).decimals(2)
        animFolder.add( this.settings.rotationSpeed, 'z', 0, 360).decimals(2)

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
function main(): void {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
        throw new Error('No canvas element found in the document');
    }

    const gl = canvas.getContext('webgl2');
    if (!gl) {
        throw new Error('WebGL2 is not supported by this browser');
    }

    const scene = new LitObjectsScene(gl);
    scene.setupUI();
    scene.draw(0);
}

main()
