uniform sampler2D texture;
uniform float time;
varying float vAlpha;
varying vec2 vUv;

vec4 FAST_32_hash( vec2 gridcell )
{
    //    gridcell is assumed to be an integer coordinate
    const vec2 OFFSET = vec2( 26.0, 161.0 );
    const float DOMAIN = 71.0;
    const float SOMELARGEFLOAT = 951.135664;
    vec4 P = vec4( gridcell.xy, gridcell.xy + vec2( 1.,1.) );
    P = P - floor(P * ( 1.0 / DOMAIN )) * DOMAIN;    //    truncate the domain
    P += OFFSET.xyxy;                                //    offset to interesting part of the noise
    P *= P;                                          //    calculate and return the hash
    return fract( P.xzxz * P.yyww * vec4( 1.0 / SOMELARGEFLOAT ) );
}
void main()
{

//    float t = .5 + .5 * (cos( time ) * sin( time ) );
//	gl_FragColor = vec4( vec3( 1. ), vAlpha  );

    vec2 uvs = vUv +  gl_PointCoord.xy * vec2( .25 );
    uvs.y = 1. - uvs.y;
    gl_FragColor = vec4( 1. ) * texture2D( texture, uvs ) * vAlpha;


}