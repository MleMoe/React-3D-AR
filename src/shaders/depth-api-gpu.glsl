precision mediump float;

uniform sampler2D uDepthTexture;
uniform mat4 uUvTransform;
uniform float uRawValueToMeters;
uniform float uAlpha;

varying vec2 vTexCoord;

float DepthGetMeters(in sampler2D depth_texture, in vec2 depth_uv) {
  // Depth is packed into the luminance and alpha components of its texture.
  // The texture is in a normalized format, storing raw values that need to be
  // converted to meters.
  vec2 packedDepthAndVisibility = texture2D(depth_texture, depth_uv).ra;
  return dot(packedDepthAndVisibility, vec2(255.0, 256.0 * 255.0)) * uRawValueToMeters;
}

const highp float kMaxDepthInMeters = 8.0;
const float kInvalidDepthThreshold = 0.01;

vec3 TurboColormap(in float x);

// Returns a color corresponding to the depth passed in. Colors range from red
// to green to blue, where red is closest and blue is farthest.
//
// Uses Turbo color mapping:
// https://ai.googleblog.com/2019/08/turbo-improved-rainbow-colormap-for.html
vec3 DepthGetColorVisualization(in float x) {
  return step(kInvalidDepthThreshold, x) * TurboColormap(x);
}

void main(void) {
  vec4 texCoord = uUvTransform * vec4(vTexCoord, 0, 1);

  highp float normalized_depth = clamp(
    DepthGetMeters(uDepthTexture, texCoord.xy) / kMaxDepthInMeters, 0.0, 1.0);
  gl_FragColor = vec4(DepthGetColorVisualization(normalized_depth), uAlpha);
}

vec3 TurboColormap(in float x) {
  const vec4 kRedVec4 = vec4(0.55305649, 3.00913185, -5.46192616, -11.11819092);
  const vec4 kGreenVec4 = vec4(0.16207513, 0.17712472, 15.24091500, -36.50657960);
  const vec4 kBlueVec4 = vec4(-0.05195877, 5.18000081, -30.94853351, 81.96403246);
  const vec2 kRedVec2 = vec2(27.81927491, -14.87899417);
  const vec2 kGreenVec2 = vec2(25.95549545, -5.02738237);
  const vec2 kBlueVec2 = vec2(-86.53476570, 30.23299484);

  // Adjusts color space via 6 degree poly interpolation to avoid pure red.
  x = clamp(x * 0.9 + 0.03, 0.0, 1.0);
  vec4 v4 = vec4( 1.0, x, x * x, x * x * x);
  vec2 v2 = v4.zw * v4.z;
  return vec3(
    dot(v4, kRedVec4)   + dot(v2, kRedVec2),
    dot(v4, kGreenVec4) + dot(v2, kGreenVec2),
    dot(v4, kBlueVec4)  + dot(v2, kBlueVec2)
  );
}
