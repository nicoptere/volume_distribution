uniform vec3 color0;
uniform vec3 color1;
varying float vAlpha;

void main(){
    vec3 color = mix( color0, color1, vAlpha );
	gl_FragColor = vec4( color, pow( vAlpha, .5 )  );
}