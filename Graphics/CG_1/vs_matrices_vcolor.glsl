#version 300 es
in vec2 a_position;
in vec4 a_color;

out vec4 v_color;

uniform vec2 u_resolution;
uniform mat3 u_transforms;

vec4 projection2D(vec2 position, vec2 resolution) {
    // Convert the position from pixels to 0.0 - 1.0
    vec2 zeroToOne = position / resolution;

    // Convert from 0->1 to 0->2
    vec2 zeroToTwo = zeroToOne * 2.0;

    // Convert from 0->2 to -1->1 (clip space)
    vec2 clipSpace = zeroToTwo - 1.0;

    // Invert Y axis
    //vec4 flippedSpace = vec4(clipSpace * vec2(1, -1), 0, 1);

    //return flippedSpace;
    return vec4(clipSpace, 0, 1);
}

void main() {
    // Create a vector 3 with the point coordinates and 1, to multiply
    vec2 position = (u_transforms * vec3(a_position, 1)).xy;

    // Final position in clip space
    gl_Position = projection2D(position, u_resolution);

    // Pass the vertex color to the fragment shader
    v_color = a_color;
}
