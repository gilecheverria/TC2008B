# WebGL-TS
Material for teaching WebGL using TypeScritpt

![WebGL](WebGL.png)

Learning about WebGL and TypeScript

## Running the server

Change to the correct directory:
```bash
cd Graphics
```

To install the dependencies:
```bash
npm install
```

To run the server:
```bash
npx vite
```

This will start a web server. Normally the url to access it will be:
[http://localhost:5173](http://localhost:5173)


## Running unit tests

To validate if the linear algebra funcitons are correct, the unit tests can be run with:

```bash
npx mocha
```
or
```bash
npm test
```
or
```bash
npm run test:2d
```
or
```bash
npm run test:2d
```


## Browser compatibility

In general [Firefox](https://www.firefox.com/) has better support for GPU
drivers and is more likely to run the simulation faster than other browsers.

## References
- https://www.khronos.org/webgl/wiki/Tutorial
- https://webglfundamentals.org/
- https://webgl2fundamentals.org/
- https://www.tutorialspoint.com/webgl/index.htm
- https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API

Data types in GLSL:
- https://www.khronos.org/opengl/wiki/Data_Type_(GLSL)#Basic_types

Reference card for WebGL:
- https://www.khronos.org/files/webgl20-reference-guide.pdf

Full GLSL reference:
- https://docs.gl/sl4/reflect
- https://www.khronos.org/files/opengles_shading_language.pdf

OpenGL in C:
- https://learnopengl.com/
- https://github.com/JoeyDeVries/LearnOpenGL

Debugging GLSL:
- https://threejs.org/manual/#en/debugging-glsl
- The only way to debug is by the visual output. Use values as the outColor
    and interpret the results. For example:
    ```GLSL
    outColor = vec4(reflectionVector, 1.0);
    ```

Shaders:
- https://www.shadertoy.com/view/4ttSWf
- https://www.youtube.com/channel/UCdmAhiG8HQDlz8uyekw4ENw
- https://offscreencanvas.com/issues/cel-toon-shading/
- https://www.maya-ndljk.com/blog/threejs-basic-toon-shader

Three.js:
- https://threejs.org/manual/

## Excellent tutorials:
- https://webgl2fundamentals.org/

A state diagram illustrating how WebGL works:
- https://webgl2fundamentals.org/webgl/lessons/resources/webgl-state-diagram.html

Description of how to compute the correct normals:
- https://webgl2fundamentals.org/webgl/lessons/webgl-3d-lighting-directional.html

## Nice demos:
- http://cubictime.ru/
- https://madebyevan.com/webgl-water/


## Classical 3D models:
- https://graphics.stanford.edu/data/3Dscanrep/
