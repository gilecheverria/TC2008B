#version 300 es
in vec2 a_position;

uniform vec2 u_resolution;

vec4 projection2D(vec2 position, vec2 resolution) {
    // Convert the position from pixels to 0.0 - 1.0
    vec2 zeroToOne = position / resolution;

    // Convert from 0->1 to 0->2
    vec2 zeroToTwo = zeroToOne * 2.0;

    // Convert from 0->2 to -1->1 (clip space)
    vec2 clipSpace = zeroToTwo - 1.0;

    // Invert Y axis
    vec4 flippedSpace = vec4(clipSpace * vec2(1, -1), 0, 1);

    return flippedSpace;
}

void main() {
    gl_Position = projection2D(a_position, u_resolution);
}
