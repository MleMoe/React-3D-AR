#ifndef SCREENSIZE
#define SCREENSIZE
uniform vec4 uScreenSize;
#endif

uniform sampler2D texture_depth_sensing;
uniform mat4 matrix_depth_sensing_uv;
uniform float depth_raw_to_meters;

void depthSensingOcclude() {
    // fragment position in screen space
    vec2 screenSpace = gl_FragCoord.xy / uScreenSize.xy;
    // transform depth uv to be normalized to screen space
    vec2 texCoord = (matrix_depth_sensing_uv * vec4(screenSpace.x, 1.0 - screenSpace.y, 0.0, 1.0)).xy;
    // get luminance alpha components from depth texture
    vec2 packedDepth = texture2D(texture_depth_sensing, texCoord).ra;
    // unpack into single value in millimeters
    float depth = dot(packedDepth, vec2(255.0, 256.0 * 255.0)) * depth_raw_to_meters; // m
    
    // check if fragment is behind depth value
    if ((gl_FragCoord.z / gl_FragCoord.w) > depth) {
        // then do not render
        discard;
    }
}

void main(void) {
    depthSensingOcclude();
    
    dDiffuseLight = vec3(0);
    dSpecularLight = vec3(0);
    dReflection = vec4(0);
    dSpecularity = vec3(0);

    #ifdef CLEARCOAT
    ccSpecularLight = vec3(0);
    ccReflection = vec4(0);
    #endif
