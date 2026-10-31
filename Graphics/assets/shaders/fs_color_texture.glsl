#version 300 es
precision highp float;
/*
Combine a color and a texture for the final fragment color
*/

in vec4 v_color;
in vec2 v_texCoord;

uniform sampler2D u_texture;

out vec4 outColor;

void main() {
    vec4 textureColor = texture(u_texture, v_texCoord);
    outColor = mix(v_color, textureColor, 0.5);
}
