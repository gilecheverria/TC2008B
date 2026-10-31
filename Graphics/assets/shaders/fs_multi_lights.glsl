#version 300 es
precision highp float;

const int NUM_LIGHTS = 3;

in vec3 v_normal;
in vec3 v_surfaceToLight[NUM_LIGHTS];
in vec3 v_surfaceToView;

// Object uniforms
uniform vec4 u_ambientColor;
uniform vec4 u_diffuseColor;
uniform vec4 u_specularColor;
uniform float u_shininess;

uniform sampler2D u_texture;

uniform vec4 u_ambientLight;
uniform vec4 u_diffuseLight[NUM_LIGHTS];
uniform vec4 u_specularLight[NUM_LIGHTS];

out vec4 outColor;

void main() {
    // v_normal must be normalized because the shader will interpolate
    // it for each pixel
    vec3 normal = normalize(v_normal);

    vec3 surfToViewDirection = normalize(v_surfaceToView);

    // Compute the three parts of the Phong lighting model
    vec4 ambientColor = u_ambientColor * u_ambientLight;
    vec4 diffuseColor = vec4(0, 0, 0, 1);
    vec4 specularColor = vec4(0, 0, 0, 1);

    for (int i=0; i<NUM_LIGHTS; i++) {
        vec3 surfToLigthDirection = normalize(v_surfaceToLight[i]);
        // Finding the reflection vector
        // https://en.wikipedia.org/wiki/Phong_reflection_model
        vec3 reflectionVector = (2.0 * dot(surfToLigthDirection, normal)
            * normal - surfToLigthDirection);

        float light = max(dot(normal, surfToLigthDirection), 0.0);
        float specular = 0.0;
        if (light > 0.0) {
            float specular_dot = dot(surfToViewDirection, reflectionVector);
            specular = pow(max(specular_dot, 0.0), u_shininess);
        }

        diffuseColor += light * u_diffuseColor * u_diffuseLight[i];
        specularColor += specular * u_specularColor * u_specularLight[i];
    }

    // Use the color of the texture on the object
    outColor = ambientColor + diffuseColor + specularColor;
}
