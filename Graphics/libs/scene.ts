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
import { Object3D } from './object3d';
import { Camera3D } from './camera3d';

/*
 * Generic abstract class that can be extended for specific demo scenes
*/
export abstract class Scene {
//export abstract class Scene<Names extends string = string> {
    protected readonly gl: WebGL2RenderingContext;
    protected readonly programInfo: twgl.ProgramInfo;
    private readonly objects = new Map<string, Object3D>();

    protected camera: Camera3D | undefined = undefined;

    private oldTime: number = 0;


    constructor( gl: WebGL2RenderingContext, vsGLSL: string, fsGLSL: string) {
        this.gl = gl;

        twgl.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        this.programInfo = twgl.createProgramInfo(gl, [vsGLSL, fsGLSL]);
    }

    /*
     * Method to add objects into the scene
     */
    protected addObject(name: string, arrays: twgl.Arrays, color: Color): Object3D {
        const object = new Object3D(this.gl, this.programInfo, arrays, color);
        this.objects.set(name, object);
        return object;
    }

    protected getObject(name: string): Object3D {
        const object = this.objects.get(name);
        if (!object) {
            throw new Error(`No object named "${name}" in scene.`);
        }
        return object;
    }

    /*
     * Return the complete map, so others can iterate over it.
     */
    protected get allObjects(): ReadonlyMap<string, Object3D> {
        return this.objects;
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
