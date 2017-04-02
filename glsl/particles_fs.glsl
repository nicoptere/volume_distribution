uniform vec3 color;
uniform float time;
varying float vAlpha;
varying vec2 vUv;

void main(){
	gl_FragColor = vec4( color, vAlpha  );
}