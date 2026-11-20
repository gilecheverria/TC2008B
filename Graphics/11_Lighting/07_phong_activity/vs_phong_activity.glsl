#version 300 es
in vec4 a_position;
in vec3 a_normal;

// Scene uniforms
uniform vec3 u_lightWorldPosition;
uniform vec3 u_viewWorldPosition;

// Model uniforms
uniform mat4 u_world;
uniform mat4 u_worldInverseTransform;
uniform mat4 u_worldViewProjection;

out vec3 v_normal;
out vec3 v_surfaceToLight;
out vec3 v_surfaceToView;

void main() {
    // Transform the position of the vertices
    gl_Position = u_worldViewProjection * a_position;

    // TODO 1: Send the normal transformed by the object's own
    //         transformations (rotation, scale, ...). The untransformed
    //         normal below is only a placeholder so the page still renders.
    v_normal = a_normal;  // PLACEHOLDER: replace me

    // TODO 2: Send the direction pointing from this point of the
    //         surface toward the light.
    // TODO 3: Send the direction pointing from this point of the
    //         surface toward the view (camera).
    v_surfaceToLight = u_lightWorldPosition;  // PLACEHOLDER: replace me
    v_surfaceToView = u_viewWorldPosition;    // PLACEHOLDER: replace me
}
