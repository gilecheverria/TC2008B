#version 300 es
// Based on the examples at:
// https://www.youtube.com/watch?v=3mfvZ-mdtZQ&list=PLJ1RK-x2coBxpCyOQmL0B8DDEpEgo9M83&index=20
precision highp float;

in vec4 v_color;
in vec2 v_texCoord;

//uniform sampler2D u_texture;
uniform vec4 u_color;
uniform float u_time;

out vec4 outColor;

vec4 gradientFromTexCoord() {
    // Use the texture coordinates as the color values
    vec4 color = vec4(v_texCoord, 1, 1);

    return color;
}

vec4 gradient1D() {
    // Interpolation between two colors
    vec4 color1 = vec4(0.7, 0.2, 0.9, 1.0);
    vec4 color2 = vec4(0.8, 0.8, 0.1, 1.0);
    // Using the texture coordinate as the interpolation factor
    vec4 color = mix(color1, color2, v_texCoord.x);

    return color;
}

vec4 gradient2D() {
    // Interpolation between four colors
    vec4 colorTL = vec4(0.7, 0.2, 0.9, 1.0);
    vec4 colorTR = vec4(0.8, 0.8, 0.1, 1.0);

    vec4 colorBL = vec4(0.2, 0.2, 0.9, 1.0);
    vec4 colorBR = vec4(0.0, 0.5, 0.3, 1.0);

    // Using the texture coordinate X to interpolate horizontally
    vec4 colorT = mix(colorTL, colorTR, v_texCoord.x);
    vec4 colorB = mix(colorBL, colorBR, v_texCoord.x);

    // Using the texture coordinate Y to interpolate vertically
    vec4 color = mix(colorT, colorB, v_texCoord.y);

    return color;
}

vec4 repeatPattern() {
    // The 'fract' function returns the decimals of a number
    vec2 newPos = fract(v_texCoord * 6.0);
    return vec4(newPos, 1, 1);
}

vec4 bandsWithSine() {
    // Use the sine function to create a repeating pattern
    // Shifting the values up so -1 becomes 0 and 1 becomes 2
    float c = (sin(v_texCoord.x * 16.0 + u_time * 10.0) + 1.0) / 2.0;
    return vec4(c, 0, 1, 1);
}

vec4 testing() {
    // Use the sine function to create a repeating pattern
    // Shifting the values up so -1 becomes 0 and 1 becomes 2
    float c = (cos(v_texCoord.x * 16.0 + u_time * 10.0) + 1.0) / 2.0;
    float s = (sin(v_texCoord.x * 16.0 + u_time * 10.0) + 1.0) / 2.0;
    vec4 color1 = vec4(c, s, 1.0, 1.0);
    vec4 color2 = vec4(0.0, c, s, 1.0);
    vec4 color = mix(color1, color2, v_texCoord.x);
    return color;
}

void main() {
    outColor = gradientFromTexCoord();

    /*
    outColor = gradient1D();

    outColor = gradient2D();

    outColor = repeatPattern();

    outColor = bandsWithSine();

    outColor = testing();
    */
}
