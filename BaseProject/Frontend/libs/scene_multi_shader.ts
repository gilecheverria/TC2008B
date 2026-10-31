/*
 * Main class for a complete scene in WebGL.
 * Contains all the required information and context to be able to draw on
 * the Canvas.
 * Every program will import this class.
 *
 * Gilberto Echeverria
 * 2026-07-16
 */

import * as twgl from 'twgl-base.js';
import { type Color } from './color';
import { Object3DProgram } from './object3d_multi_shader';
import { Camera3D } from './camera3d';
import { Light3D } from './light3d';

interface ShaderSource {
    vs: string;
    fs: string;
}

/*
 * Generic abstract class that can be extended for specific demo scenes
*/
export abstract class Scene {
//export abstract class Scene<Names extends string = string> {
    protected readonly gl: WebGL2RenderingContext;
    protected readonly programs = new Map<string, twgl.ProgramInfo>();
    private readonly objects = new Map<string, Object3DProgram>();
    private readonly lights = new Map<string, Light3D>();

    protected camera: Camera3D | undefined = undefined;

    private oldTime: number = 0;


    constructor(
        gl: WebGL2RenderingContext,
        programSources: Record<string, ShaderSource>,
    ) {
        this.gl = gl;

        twgl.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        for (const name of Object.keys(programSources)) {
            const { vs, fs } = programSources[name];
            this.programs.set(name, twgl.createProgramInfo(gl, [vs, fs]));
        }
    }

    protected getProgram(name: string): twgl.ProgramInfo {
        const programInfo = this.programs.get(name);
        if (!programInfo) {
            throw new Error(`No program named ${name} in scene.`);
        }
        return programInfo;
    }

    /*
     * Method to add objects into the scene
     */
    protected addObject(
        name: string,
        programName: string,
        arrays: twgl.Arrays,
        color: Color
    ): Object3DProgram {
        const programInfo = this.getProgram(programName);
        const object = new Object3DProgram(this.gl, programInfo, arrays, color);
        this.objects.set(name, object);
        return object;
    }

    // Duplicates an existing object under a new name, reusing its geometry
    // template (no GPU work) with independent transforms/color. Useful for
    // populating a scene with many copies of the same shape.
    /*protected*/ duplicateObject(
        newName: string,
        sourceName: string,
        color?: Color
    ): Object3DProgram {
        const copy = this.getObject(sourceName).clone(color);
        this.objects.set(newName, copy);
        return copy;
    }

    protected getObject(name: string): Object3DProgram {
        const object = this.objects.get(name);
        if (!object) {
            throw new Error(`No object named "${name}" in scene.`);
        }
        return object;
    }

    /*
     * Return the complete map, so others can iterate over it.
     */
    protected get allObjects(): ReadonlyMap<string, Object3DProgram> {
        return this.objects;
    }

    /*
     * General method to call for each object,
     * using the program that corresponds to each object.
     * It relies on the gl context already stored in the scene.
     */
    protected drawObject(name: string, uniforms: Record<string, unknown>): void {
        const object = this.getObject(name);
        this.gl.useProgram(object.programInfo.program);
        twgl.setUniforms(object.programInfo, uniforms);
        this.gl.bindVertexArray(object.vao);
        twgl.drawBufferInfo(this.gl, object.bufferInfo);
        //twgl.drawBufferInfo(this.gl, object.bufferInfo, gl.LINES);
    }

    /*
     * Method to add a light with an associated object to visualize it
     */
    protected addLightWithObject(
        name: string,
        programName: string,
        arrays: twgl.Arrays,
        light: Light3D
    ): void {
        const object = this.addObject(name, programName, arrays, light.specular);
        // Copy the position of the light to the object to visualize it
        object.transforms.t = light.position;
        object.transforms.s = {x: 0.1, y: 0.1, z: 0.1};
        this.addLight(name, light);
    }

    /*
     * Method to add a light on its own
     */
    protected addLight(
        name: string,
        light: Light3D
    ): void {
        this.lights.set(name, light);
    }

    protected getLight (name: string): Light3D {
        const object = this.lights.get(name);
        if (!object) {
            throw new Error(`No light named "${name}" in scene.`);
        }
        return object;
    }

    /*
     * Return the complete map of lights, so others can iterate over it.
     */
    protected get allLights(): ReadonlyMap<string, Light3D> {
        return this.lights;
    }



    /*
     * Subclasses must implement the concrete display method.
     */
    protected abstract render(deltaTime: number): void;


    /*
     * Subclasses must implement the concrete UI configuration.
     */
    abstract setupUI(): void;

    /*
     * Main animation loop that calls itself recursively.
     */
    draw = (newTime: number): void => {
        const deltaTime = newTime - this.oldTime;
        this.oldTime = newTime;
        this.render(deltaTime);
        requestAnimationFrame(this.draw);
    }
}
