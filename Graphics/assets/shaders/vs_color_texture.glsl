#version 300 es
in vec4 a_position;
in vec4 a_color;
in vec2 a_texCoord;

uniform mat4 u_worldViewProjection;

out vec2 v_texCoord;
out vec4 v_color;

void main() {
    v_texCoord = a_texCoord;
    v_color = a_color;
    gl_Position = u_worldViewProjection * a_position;
}
