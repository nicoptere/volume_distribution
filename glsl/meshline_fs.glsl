#extension GL_OES_standard_derivatives : enable
precision mediump float;

uniform sampler2D map;
uniform sampler2D alphaMap;
uniform float useMap;
uniform float useAlphaMap;
uniform float useDash;
uniform vec2 dashArray;
uniform vec2 visibility;
uniform vec2 depth;
uniform float alphaTest;
uniform vec2 repeat;

varying vec2 vUV;
varying vec4 vColor;
varying float vCounters;
varying float vZ;

void main() {

    vec4 c = vColor;
    if( useMap == 1. ) c *= texture2D( map, vUV * repeat );
    if( useAlphaMap == 1. ) c.a *= texture2D( alphaMap, vUV * repeat ).a;
	 if( c.a < alphaTest ) discard;
	 if( useDash == 1. ){
	 	 
	 }
    gl_FragColor = c;

    float alpha = abs( sin( smoothstep(visibility.x, visibility.y, vCounters) * 3.14159 ) );
    gl_FragColor.rgb *= pow( alpha,.5 );
	gl_FragColor.a *= step(visibility.x, vCounters) * step(vCounters,visibility.y) * alpha;
}