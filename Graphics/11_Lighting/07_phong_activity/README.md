# Activity: Implementing the Phong Lighting Model

You already know how a WebGL scene works: positions go through the vertex
shader, and the fragment shader decides the color of each pixel.
But so far the color of our objects has been flat. In this activity you
will implement, **step by step and with real math**, the lighting model
that makes 3D objects look three-dimensional: the **Phong model**.

The scene, cube, camera, light and GUI in `07_phong_activity.ts` are
already built. **Your delivery is three files:**

1. `07_phong_activity.ts` — complete the two `TODO: UNIFORMS` blocks so the
   shader receives its data from JavaScript.
2. `vs_phong_activity.glsl` — implement the vertex-shader TODOs.
3. `fs_phong_activity.glsl` — implement the fragment-shader TODOs, including
   the three lighting terms and the final combination.

The shader files compile and run as-is (with placeholder values), so the
page always renders and you always get visual feedback.

---

## The Phong model, in one paragraph

For every fragment, we compute three terms and sum them:

```
color = ambient + diffuse + specular
```

- **Ambient**: a small constant fraction of the light that reaches every
  point, regardless of orientation.
- **Diffuse** (Lambert's law): light is scattered proportional to how
  directly the surface faces the light: `diffuse = max(dot(N, L), 0)`.
- **Specular** (Phong reflection): a bright highlight in the direction
  in which the light *reflects*. We reflect the light direction about
  the normal, `R = 2(N·L)N − L`, and measure how close the view direction
  is to that reflection: `specular = max(dot(R, V), 0)^shininess`.

Where:

| Symbol | Meaning | Vector (world space) |
|--------|---------|----------------------|
| N | surface normal | from the surface, perpendicular to it |
| L | light direction | from the fragment toward the light |
| V | view direction | from the fragment toward the camera |

### Formulas of the Phong shading model

All vectors are unit vectors in world space. `dot` is the dot product.

**1. Ambient term** (material light × light light, constant over the surface):

```
ambient  = ambientMaterial  ×  ambientLight
```

**2. Diffuse term** (Lambert's law — intensity scales with how directly
the surface faces the light; negative values are clamped to zero):

```
diffuseIntensity = max( dot(N, L), 0 )

diffuse  = diffuseIntensity ×  diffuseMaterial  ×  diffuseLight
```

**3. Specular term** (Phong reflection — intensity scales with how close
the view direction is to the light's reflection direction, sharpened by
the shininess exponent):

```
R = 2 · dot(N, L) · N − L                      (reflection vector)

specularIntensity = max( dot(R, V), 0 ) ^ shininess

specular  = specularIntensity ×  specularMaterial  ×  specularLight
```

(Conventionally the specular term only contributes when the surface
faces the light, i.e. only when `dot(N, L) > 0`.)

**4. Final color** (sum of the three independent contributions):

```
finalColor = ambient + diffuse + specular
```

### GLSL sketch (fragment shader)

```glsl
vec3 N = normalize(v_normal);
vec3 L = normalize(v_surfaceToLight);
vec3 V = normalize(v_surfaceToView);

vec4 ambient  = u_ambientLight  * u_ambientColor;
vec4 diffuse  = max(dot(N, L), 0.0) * u_diffuseLight * u_diffuseColor;

vec3 R = reflect(-L, N);               // R = 2·(N·L)·N − L
vec4 specular = pow(max(dot(R, V), 0.0), u_shininess)
               * u_specularLight * u_specularColor;

outColor = ambient + diffuse + specular;
```

**Key data-flow idea:** the shader *declares* uniforms (input constants
that change per frame — matrices, light, material) and varyings
(`v_normal`, `v_surfaceToLight`, `v_surfaceToView`, computed per vertex).
It is JavaScript's job to *send* a value to every uniform; the vertex
shader's job to *produce* the varyings; the fragment shader's job to
*turn them into the three terms and the final color*.

---

## Parts

### Part 0 -- Baseline (done for you)

Open the page. The scene runs and a **light-gray cube rotates in the
center of a charcoal (carbon-gray) background** — placeholdered
shaders give it a flat, unlit color, and it spins the same way as
`../01_lighting.ts` (X/Y/Z animation sliders) so you can see it move.
The GUI (including the *Light → Intensity* slider) and an error-free
console confirm the scaffold works. You will replace that flat color
with the real Phong lighting terms in Parts 2–5.

### Part 1 -- Uniforms in TypeScript (required)

Complete the two `TODO: UNIFORMS` blocks in `07_phong_activity.ts`:

- **Scene uniforms** (in `render`): the light's position and its three
  colors, plus the camera's world position. All of it is stored in
  `this.lights[0]` and `this.camera` (read `Light3D` and `Camera3D` in
  `../../libs`).
- **Object uniforms** (in `drawObject`): the matrices already computed
  above the TODO (world, world-view-projection, and the inverse
  transform for normals), plus the material data stored on the object
  (`Object3D` in `../../libs`).

The uniform **names** are declared in the two shader files — copy them
exactly, including the `u_` prefix. Two rules that will save you time:

The `FRAMING SCAFFOLD` inside `render()` already places the cube at the
scene center (identity world transform) with the camera looking at the
origin — the same pattern as `../01_lighting.ts`. It keeps the black
cube visible until you wire the uniforms; once your object block sends
the real `transforms` matrix, the cube starts rotating with the
Animation sliders. Two rules that will save you time:

- `twgl.setUniforms` only sends the uniforms that are actually declared
  in the compiled program; unknown keys are silently ignored.
- Vectors/matrices must be *arrays* (`Float32Array`, `mat4`, `vec3`);
  for a `vec4` uniform a JS `Color` array works as-is.

### Part 2 -- Ambient term (required, first visible result)

Implement TODO 1 in `fs_phong_activity.glsl`: the light contribution
that reaches the surface no matter its orientation, from the material
and light colors — already available as inputs.

**Check (validates Part 1 too):** the cube becomes visible immediately.
Change *Light → Ambient* in the GUI and the whole cube changes color;
change *Model material → color* and it changes too.

### Part 3 -- Vertex shader + diffuse term (required)

Complete `vs_phong_activity.glsl`. The two "direction" outputs must be
computed **per vertex** (that is the whole reason they live in the
vertex shader): the direction from the vertex toward the light, and the
direction from the vertex toward the camera. Both are simple
subtractions once you know the vertex's world position.

Then implement TODO 2 in `fs_phong_activity.glsl` (Lambert's law).

**Check:** one side of the cube is now brighter than the other; the
bright side always faces the light; the intensity changes smoothly as
the cube rotates. Answer in your notes: *why* are negative values
clamped to zero? (When the normal and the light direction point in
opposite directions, the surface faces *away* from the light.)

### Part 4 -- Specular term (required)

Implement TODO 3 and TODO 4 in `fs_phong_activity.glsl`:

1. The reflection vector: the direction a light ray would leave the
   surface after bouncing off it. (Wikipedia's *Phong reflection
   model* page has the vector-geometry derivation.)
2. The specular intensity: a measure of how close the view direction is
   to that reflection, raised to the material's shininess, and only
   counted when the surface faces the light.

**Check:** a bright highlight appears and slides across the surface as
the cube rotates or the light moves. Try the *Shininess* slider:
`1` gives a wide, soft highlight; `200` gives a tight, point-like spark.
Explain that behavior in your notes (what does `pow` do to values in
(0,1) as the exponent grows?).

### Part 5 -- Final color (required)

Implement TODO 5: combine the three terms into `outColor`.

**Check:** with the GUI, set *diffuse* and *specular* light colors to
black — only the ambient should remain. Set *ambient* to black — you
should see only diffuse and/or specular. This tells you each term is an
independent contribution of the same light.

### Part 6 -- Exploration (optional, +bonus)

- **Color separation.** Give the object a white material color and
  change only the *specular* light color in the GUI: does the highlight
  change color while the rest of the surface keeps its own hue? Explain
  which uniforms are responsible.
- **Blinn–Phong.** Replace the reflection with the *half-vector*
  between light and view directions, and measure the angle against the
  normal. Write down one advantage of Blinn–Phong over Phong when the
  light is far from the view direction.

---

## Deliverable

1. The three completed files (in your fork / copy of this folder).
2. A short document (or a markdown file in the same folder) answering
   the "check" questions in the parts, plus your Part 6 work.

## How it will be graded (rubric)

| Item | Points |
|------|--------|
| Part 1: both uniform blocks wired correctly (scene + object) | 20 |
| Part 2: ambient term | 5 |
| Part 3: vertex shader (normal + both directions) and diffuse term | 25 |
| Part 4: reflection vector + specular term | 30 |
| Part 5: correct final combination (verified by color tests) | 10 |
| Written explanations ("check" questions) | 10 |
| Part 6 exploration (Blinn–Phong or color separation) | 5 (bonus) |

## Reference (instructors only)

The full solution exists in `reference/` and also in
`../../assets/shaders/vs_phong.glsl` / `fs_phong.glsl` (the uniform
wiring to copy is in `../01_lighting.ts`).
**Do not include the `reference/` folder when you hand this folder to
students.**
