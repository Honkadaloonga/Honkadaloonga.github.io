const fragSrc = `
precision highp float;
precision highp int;

varying vec2 i_pos;

// Ray variables
const int maxStepCount = 256;
const float epsilon = 0.0001;
uniform int aaLevel;

// IFS variables
uniform float rotation;
uniform vec3 rot1;
uniform vec3 rot2;
uniform vec3 center;
uniform float scale;
const int maxIter = 10;

// Camera variables
uniform float ar;
const vec3 camPos = vec3(4.43, -3.42, 0.25);
const float yaw = 1.52;
const float pitch = 0.94;
uniform float width;
uniform float height;

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

        // Tetrahedral symmetry
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

        // Full octahedral symmetry
        z = abs(z);
        if (z.x - z.y < 0.0) {
            z = z.yxz;
        }
        if (z.x - z.z < 0.0) {
            z = z.zyx;
        }
        if (z.y - z.z < 0.0) {
            z = z.xzy;
        }

        // Cubic symmetry
        // z = abs(z);

        z = rotateX(z, rot2.x);
        z = rotateY(z, rot2.y);
        z = rotateZ(z, rot2.z);

        z = 2.0*z - scale*center;
        r = length(z);
        is *= 0.5;
    }

    return vec2(float(j), (r-2.0)*is);
}

vec3 estimateNormal(vec3 p) {
    float x = DE(vec3(p.x+epsilon, p.y, p.z)).y - DE(vec3(p.x-epsilon, p.y, p.z)).y;
    float y = DE(vec3(p.x, p.y+epsilon, p.z)).y - DE(vec3(p.x, p.y-epsilon, p.z)).y;
    float z = DE(vec3(p.x, p.y, p.z+epsilon)).y - DE(vec3(p.x, p.y, p.z-epsilon)).y;
    return normalize(vec3(x, y, z));
}

float rand(float v) {
    return fract((sin(v * 12.9898) + 1.1) * 4758.5453);
}

vec3 sample(vec2 c) {
    vec3 rayDir = vec3(c * 0.32, -1);
    rayDir.x *= ar;
    rayDir = rotateX(rayDir, yaw);
    rayDir = rotateZ(rayDir, pitch);
    rayDir = normalize(rayDir);

    vec3 rayPos = camPos;
    float rayDst = 0.0;
    int marchSteps = 0;
    float esc = 50.0;
    vec3 result = mix(vec3(51.0, 3.0, 20.0), vec3(20.0, 3.0, 61.0), c.y*0.5 + 0.5)/255.0;

    for (int i = 0; i < maxStepCount; i++) {
        marchSteps++;
        vec2 de = DE(rayPos);
        float dist = de.y;

        if (dist < epsilon) {
            vec3 normal = estimateNormal(rayPos - rayDir*epsilon*2.0);
            float colorA = clamp(dot(normal*0.5 + 0.5, vec3(0.2, 0.3, 0.75)), 0.0, 1.0);
            float colorB = clamp(de.x/float(maxIter), 0.0, 1.0);
            result = clamp(colorA*vec3(1.0, 0.0, 0.0) + colorB*vec3(0.0, 0.0, 1.0), 0.0, 1.0);
            marchSteps += 10;
            esc = 75.0;
            break;
        }

        rayPos += rayDir * dist;
        rayDst += dist;
        if (rayDst > 100.0) {
            break;
        }
    }

    float rim = clamp(float(marchSteps)/esc, 0.0, 1.0);
    result *= rim;
    return result;
}

void main() {
    vec3 result = vec3(0.0, 0.0, 0.0);
    if (aaLevel == 1) {
        result = sample(i_pos);
    } else {
        for (int i = 0; i < 8; i++) {
            if (i == aaLevel) {
                break;
            }
            vec2 uv = i_pos;
            uv = uv * 0.5 + 0.5;
            uv.x *= width;
            uv.y *= height;
            uv += vec2(rand(uv.x + float(i)), rand(uv.y + float(i)));
            uv.x /= width;
            uv.y /= height;
            uv = (uv - 0.5) * 2.0;
            result += sample(uv);
        }
        result /= float(aaLevel);
    }
    gl_FragColor = vec4(result, 1.0);
}
`;