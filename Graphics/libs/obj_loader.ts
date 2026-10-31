/*
 * Class to read a model stored in Wavefront OBJ format, and its associated MTL file for materials.
 * For every model, there should be an instance of this class.
 *
 * Gilberto Echeverria
 * 2025-07-29
 */


'use strict';

// Description of the material properties that can be read from an MTL file
export interface Material {
    Ns?: number;  // Specular coefficient ("Shininess")
    Ka?: number[];  // The ambient a_color
    Ks?: number[];  // The specular a_color
    Kd?: number[];  // The diffuse color
}

interface FaceRecord {
    v: string;  // Vertex index
    t?: string;  // Texture index (optional)
    n?: string;  // Normal index (optional)
}

// Temporary arrays to store the values in the OBJ file
interface ObjData {
    vertices: number[][];
    normals: number[][];
    textures: number[][];
    faces: FaceRecord[];
}

interface AtrributeArray {
    numComponents: number;
    data: number[];
}

// Final structure to be extported, in the format expected by WebGL
export interface ObjArrays {
    a_position: AtrributeArray;
    a_color: AtrributeArray;
    a_normal: AtrributeArray;
    a_texCoord: AtrributeArray;
}

export class ObjLoader {
    private materials: Record<string, Material> = {};
    private materialInUse: Material | undefined = undefined;

    /*
     * Extract the elements in a face as encoded in an OBJ file.
     * As faces are read, pass the information into the array that will be used
     * to draw the object in WebGL.
     *
     * Receives:
     *  - parts: an array of strings found after the 'f' in the OBJ file.
     *  - objData: arrays with the values for vertex positions, vertex normals
     *       and texture coordinates. All previously read from the file.
     *  - arrays: structure that will be filled with the corresponding data
     *       in the order required.
     */
    parseFace(parts: string[], objData: ObjData, arrays: ObjArrays) {
        // A face in OBJ looks like:  f 2164/65/2164 2172/76/2172 1725/77/1725
        // This represents a triangle, delimited by vertices 2164, 2172 and 1725.
        // The texture coordinates are 65, 76 and 77.
        // The normals corresponding to the vertices are: 2164, 2172 and 1725.

        // If a face contains texutures or normals, split them into an array
        // The result of the following line should look like:
        // [['2164', '65, '2164'], ['2172', '76', '2172'], ['1725', '77', '1725']]
        let faceVerts: string[][] = parts.slice(1).map(face => face.split('/'));
        faceVerts.forEach(vert => {

            // TODO: Read the description of a face, and store the corresponding
            // data in 'arrays'.
        });
    }

    /*
     * Read the contents of an OBJ file received as a string.
     * Return an object called arrays, with the arrays necessary to build a
     * Vertex Array Object (VAO) for WebGL.
     */
    loadObj(objString: string): ObjArrays {

        // Initialize a dummy item in the lists as index 0
        // This will make it easier to handle indices starting at 1 as used by OBJ
        const objData: ObjData = {
            vertices: [ [0, 0, 0] ],
            normals: [ [0, 0, 0] ],
            textures: [ [0, 0, 0] ],
            faces: [ ],
        };

        // The array with the attributes that will be passed to WebGL
        const arrays: ObjArrays = {
            a_position: { numComponents: 3, data: [ ] },
            a_color:    { numComponents: 4, data: [ ] },
            a_normal:   { numComponents: 3, data: [ ] },
            a_texCoord: { numComponents: 2, data: [ ] }
        };

        let partInfo: number[];
        const lines = objString.split('\n');
        lines.forEach(line => {

            // TODO: Read each line of the OBJ file. Depending on the first
            // word in the line (v, vn, vt), store the data into
            // the corresponding array of 'objData'.
            // If the first word is 'f', fill the necessary elements in 'arrays'.
            // If the first word is 'usemtl', assign the material as
            // the currently active one, to then assign the color to the faces.

        });

        //console.log("ATTRIBUTES:")
        //console.log(arrays);

        //console.log("OBJ DATA:")
        //console.log(objData);

        return arrays;
    }

    /*
     * Read the contents of an MTL file received as a string
     * Return an object containing all the materials described inside,
     * with their illumination attributes.
     */
    loadMtl(mtlString: string): void {
        let currentMtl: Material = {};

        let lines = mtlString.split('\n');
        lines.forEach(line => {

            // TODO: Process the material file line by line.
            // Register 'newmtl' as new materials in the materials attribute
            // of this class.
            // For each material, store its properties in the corresponding fields.

        });
    }
}
