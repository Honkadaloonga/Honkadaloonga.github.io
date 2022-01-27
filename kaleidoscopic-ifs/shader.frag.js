const fragSrc = `
precision highp float;
precision highp int;

varying vec2 i_pos;

// Ray descriptors
const int maxStepCount = 100;
const float epsilon = 0.0001;

// IFS decriptors
uniform float rotation;
uniform vec3 rot1;
uniform vec3 rot2;
uniform vec3 center;
uniform float scale;
const int maxIter = 10;

// Camera descriptors
uniform float ar;
const vec3 camPos = vec3(4.43, -3.42, 0.25);
const float yaw = 1.5;
const float pitch = 1.0;

vec3 rotateX(vec3 v, float a) {
    return vec3(v.x, v.y*cos(a) - v.z*sin(a), v.y*sin(a) + v.z*cos(a));
}

vec3 rotateY(vec3 v, float a) {
    return vec3(v.x*cos(a) + v.z*sin(a), v.y, -v.x*sin(a) + v.z*cos(a));
}

vec3 rotateZ(vec3 v, float a) {
    return vec3(v.x*cos(a) - v.y*sin(a), v.x*sin(a) + v.y*cos(a), v.z);
}

vec2 DE(vec3 pos) {
    vec3 scmo = vec3(scale-1.0, scale-1.0, scale-1.0);
    pos = rotateZ(pos, rotation);
    pos.x = -pos.x;
    vec3 z = pos;
    float r = length(z);
    int j = 0;
    float is = 1.0;

    for (int i = 0; i < maxIter; i++) {
        j = i;
        r = length(z);
        if (r > 16.0) {
            break;
        }

        z = rotateX(z, rot1.x);
        z = rotateY(z, rot1.y);
        z = rotateZ(z, rot1.z);

        if (z.x + z.y < 0.0) {
            z = -z.yxz;
            z.z = -z.z;
        }
        if (z.x + z.z < 0.0) {
            z = -z.zyx;
            z.y = -z.y;
        }
        if (z.y + z.z < 0.0) {
            z = -z.xzy;
            z.x = -z.x;
        }

        z = rotateX(z, rot2.x);
        z = rotateY(z, rot2.y);
        z = rotateZ(z, rot2.z);

        // z.x = scale * z.x - (scale-1.0);
        // z.y = scale * z.y - (scale-1.0);
        // z.z = scale * z.z - (scale-1.0);
        z = scale*z - 2.0*(scale - 1.0);
        r = length(z);
        is *= 1.0/scale;
    }

    return vec2(float(j), (r-2.0)*is);
}

vec3 estimateNormal(vec3 p) {
    float x = DE(vec3(p.x+epsilon, p.y, p.z)).y - DE(vec3(p.x-epsilon, p.y, p.z)).y;
    float y = DE(vec3(p.x, p.y+epsilon, p.z)).y - DE(vec3(p.x, p.y-epsilon, p.z)).y;
    float z = DE(vec3(p.x, p.y, p.z+epsilon)).y - DE(vec3(p.x, p.y, p.z-epsilon)).y;
    return normalize(vec3(x, y, z));
}

void main() {
    vec2 uv = i_pos;
    uv = uv * 0.5 + vec2(0.5, 0.5);

    vec3 rayDir = vec3(i_pos * 0.3, -1);
    rayDir.x *= ar;
    rayDir = rotateX(rayDir, yaw);
    rayDir = rotateZ(rayDir, pitch);
    rayDir = normalize(rayDir);

    vec3 rayPos = camPos;
    float rayDst = 0.0;
    int marchSteps = 0;
    vec4 result = mix(vec4(3.0, 51.0, 20.0, 255.0), vec4(6.0, 16.0, 28.0, 255.0), uv.y)/255.0;

    for (int i = 0; i < maxStepCount; i++) {
        marchSteps++;
        vec2 de = DE(rayPos);
        float dist = de.y;

        if (dist < epsilon) {
            vec3 normal = estimateNormal(rayPos - rayDir*epsilon*2.0);
            float colorA = clamp(dot(normal*0.5 + 0.5, vec3(0.2, 0.3, 0.75)), 0.0, 1.0);
            float colorB = clamp(de.x/float(maxIter), 0.0, 1.0);
            vec3 colorMix = clamp(colorA*vec3(0.0, 0.0, 1.0) + colorB*vec3(0.0, 1.0, 0.0), 0.0, 1.0);
            result = vec4(colorMix, 1.0);
            break;
        }

        rayPos += rayDir * dist;
        rayDst += dist;
        if (rayDst > 100.0) {
            break;
        }
    }

    float rim = float(marchSteps)/70.0;
    gl_FragColor = result * rim;
}
`;