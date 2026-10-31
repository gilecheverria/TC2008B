// Ambient module declarations for Vite's "?raw" import suffix.
// This tells TypeScript that importing a .glsl?raw file yields a plain string
// (the raw file contents), rather than failing to find a module/type for it.
declare module '*.glsl?raw' {
    const content: string;
    export default content;
}
