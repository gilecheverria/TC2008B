#version 300 es
// Based on the examples at:
// https://www.youtube.com/watch?v=3mfvZ-mdtZQ&list=PLJ1RK-x2coBxpCyOQmL0B8DDEpEgo9M83&index=20
in vec4 a_position;
in vec4 a_color;
in vec2 a_texCoord;

uniform mat4 u_worldViewProjection;
uniform float u_time;

out vec2 v_texCoord;
out vec4 v_color;

void main() {
    v_texCoord = a_texCoord;
    vec4 pos = a_position;
    pos.y += sin(u_time * 1.0 + pos.x * 8.0) / 8.0;
    gl_Position = u_worldViewProjection * pos;
    v_color = a_color;
}
