#version 300 es
// Based on the examples at:
// https://www.maya-ndljk.com/blog/threejs-basic-toon-shader
precision highp float;

in vec3 v_normal;
in vec3 v_surfaceToLight;
in vec3 v_surfaceToView;

// Cell shading uniforms
uniform int u_type;
uniform float u_cellShades;
uniform bool u_rim;
uniform float u_rimAmount;
uniform float u_rimThreshold;

// Scene uniforms
uniform vec4 u_ambientLight;
uniform vec4 u_diffuseLight;
uniform vec4 u_specularLight;

// Model uniforms
uniform vec4 u_ambientColor;
uniform vec4 u_diffuseColor;
uniform vec4 u_specularColor;
uniform float u_shininess;

out vec4 outColor;

vec4 rimLight(float diffuse, vec3 surfToViewDirection, vec3 normal) {
    float rimAmount = u_rimAmount;
    float rimThreshold = u_rimThreshold;

    float rimDot = 1.0 - dot(surfToViewDirection, normal);
    float rimIntensity = rimDot * pow(diffuse, rimThreshold);
    rimIntensity = smoothstep(rimAmount - 0.01, rimAmount + 0.01, rimIntensity);

    vec4 rim = rimIntensity * u_diffuseColor * u_diffuseLight;

    return rim;
}

void main() {
    // v_normal must be normalized because the shader will interpolate
    // it for each pixel
    vec3 normal = normalize(v_normal);

    vec3 surfToLigthDirection = normalize(v_surfaceToLight);
    vec3 surfToViewDirection = normalize(v_surfaceToView);

    /*
    // Finding the reflection vector
    // https://en.wikipedia.org/wiki/Phong_reflection_model
    vec3 reflectionVector = (2.0 * dot(surfToLigthDirection, normal)
        * normal - surfToLigthDirection);
    */
    // Reflect uses the vector incident on the surface
    vec3 reflectionVector = reflect(-surfToLigthDirection, normal);

    float diffuse = max(dot(normal, surfToLigthDirection), 0.0);
    float specular = 0.0;
    if (diffuse > 0.0) {
        float specular_dot = max(dot(surfToViewDirection, reflectionVector), 0.0);
        specular = pow(specular_dot, u_shininess);
    }

    // Declare variables for modified factors
    float toonDiffuse;
    float toonSpecular;

    // Adjustments for the cell shader
    if (u_type == 0) {
        // Clip all values above 0.01 to be 1
        toonDiffuse = smoothstep(0.0, 0.01, diffuse);
        // Small interpolation for values between 0.05 and 0.1
        toonSpecular = smoothstep(0.05, 0.1, specular);
    } else {
        toonDiffuse = floor(diffuse * u_cellShades) / u_cellShades;
        toonSpecular = floor(specular * u_cellShades) / u_cellShades;
    }

    // Compute the three parts of the Phong lighting model
    vec4 ambientColor = u_ambientColor * u_ambientLight;
    vec4 diffuseColor = toonDiffuse * u_diffuseColor * u_diffuseLight;
    vec4 specularColor = toonSpecular * u_specularColor * u_specularLight;

    vec4 rim = vec4(0, 0, 0, 1);
    if (u_rim) {
        rim = rimLight(diffuse, surfToViewDirection, normal);
    }

    outColor = ambientColor + diffuseColor + specularColor + rim;
}
