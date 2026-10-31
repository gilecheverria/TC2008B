/*
 * Utility functions for transformation matrices in 2D.
 * Converted from JavaScript to TypeScript with the help of Claude.
 *
 * Gilberto Echeverria
 * 2026-07-13
 */

// Constants to simplify references to the X, Y and Z axis
const X = 0;
const Y = 1;

// A 2D vector, backed by a Float32Array of length 2.
//type Vec2 = number[];
export type Vec2 = Float32Array;

// A 3x3 matrix used for 2D transformations, represented as a flat
// column-major array of 9 numbers (see layout note at bottom of file).
export type Mat3 = number[];

// 2D vector
export class V2 {
    static create(x: number, y: number): Vec2 {
        const v = new Float32Array(2);
        v[0] = x;
        v[1] = y;
        return v;
    }

    static add(u: Vec2, v: Vec2, dest?: Vec2): Vec2 {
        dest = dest || new Float32Array(2);
        dest[X] = u[X] + v[X];
        dest[Y] = u[Y] + v[Y];
        return dest;
    }

    // TODO: Add the methods: subtract and scale
    // - subtract: receives two Vec2, and an optional 3rd Vec2.
    //      returns the result of the subtraction inside of the 3rd Vec2
    // - scale: receives a Vec2, a number and an optional 3rd Vec2.
    //      returns the multiplication of each element of the vector by the scalar
    //      inside the 3rd Vec2

}

// 3x3 matrices used for 2D transformations
export class M3 {
    static identity(): Mat3 {
        return [
            1, 0, 0,
            0, 1, 0,
            0, 0, 1,
        ];
    }

    // TODO: Modify the following methods so they return the correct
    // transformation matrix

    static translation(v: Vec2): Mat3 {
        return [
            1,  0,  0,
            0,  1,  0,
            0,  0,  1,
        ];
    }

    static rotation(angleRadians: number): Mat3 {
        return [
            1,  0,  0,
            0,  1,  0,
            0,  0,  1,
        ];
    }

    static scale(v: Vec2): Mat3 {
        return [
            1,  0,  0,
            0,  1,  0,
            0,  0,  1,
        ];
    }

    static multiply(a: Mat3, b: Mat3): Mat3 {
        // Get the elements in the matrix
        const a00 = a[0 * 3 + 0];
        const a01 = a[0 * 3 + 1];
        const a02 = a[0 * 3 + 2];
        const a10 = a[1 * 3 + 0];
        const a11 = a[1 * 3 + 1];
        const a12 = a[1 * 3 + 2];
        const a20 = a[2 * 3 + 0];
        const a21 = a[2 * 3 + 1];
        const a22 = a[2 * 3 + 2];
        const b00 = b[0 * 3 + 0];
        const b01 = b[0 * 3 + 1];
        const b02 = b[0 * 3 + 2];
        const b10 = b[1 * 3 + 0];
        const b11 = b[1 * 3 + 1];
        const b12 = b[1 * 3 + 2];
        const b20 = b[2 * 3 + 0];
        const b21 = b[2 * 3 + 1];
        const b22 = b[2 * 3 + 2];

        /*
        // Matrix guide:
        // Consider the rows and columns are transposed
        a00 a01 a02            b00 b01 b02
        a10 a11 a12            b10 b11 b12
        a20 a21 a22            b20 b21 b22
        */

        // The matrices are oriented transposed, so the multiplication
        // must be adjusted accordingly

        return [
            1,  0,  0,
            0,  1,  0,
            0,  0,  1,
        ];
    }

}
