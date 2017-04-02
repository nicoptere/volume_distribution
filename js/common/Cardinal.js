
var Cardinal = function( exports ){

    exports.compute = function( points, precision, tension ){

        precision =  Math.max( .01, Math.min( 1, precision ) );
        tension = Math.max( -3, Math.min( 3, tension ) );

        var tmp = [];

        var p0, p1, p2, p3;
        var i, t;

        for (i = 0; i < points.length-1; i++){

            p0 = (i < 1) ? points [points.length - 1] : points [i - 1];
            p1 = points [i];
            p2 = points [(i +1 + points.length) % points.length];
            p3 = points [(i +2 + points.length) % points.length];

            for ( t= 0; t < 1; t += precision ){

                tmp.push(  new THREE.Vector3(
                    // x
                    tension * ( -t * t * t + 2 * t * t - t) * p0.x +
                    tension * ( -t * t * t + t * t) * p1.x +
                    (2 * t * t * t - 3 * t * t + 1) * p1.x +
                    tension * (t * t * t - 2 * t * t + t) * p2.x +
                    ( -2 * t * t * t + 3 * t * t) * p2.x +
                    tension * (t * t * t - t * t) * p3.x,

                    // y
                    tension * ( -t * t * t + 2 * t * t - t) * p0.y +
                    tension * ( -t * t * t + t * t) * p1.y +
                    (2 * t * t * t - 3 * t * t + 1) * p1.y +
                    tension * (t * t * t - 2 * t * t + t) * p2.y +
                    ( -2 * t * t * t + 3 * t * t) * p2.y +
                    tension * (t * t * t - t * t) * p3.y,

                    // z
                    tension * ( -t * t * t + 2 * t * t - t) * p0.z +
                    tension * ( -t * t * t + t * t) * p1.z +
                    (2 * t * t * t - 3 * t * t + 1) * p1.z +
                    tension * (t * t * t - 2 * t * t + t) * p2.z +
                    ( -2 * t * t * t + 3 * t * t) * p2.z +
                    tension * (t * t * t - t * t) * p3.z

                ) );
            }
        }
        return tmp;
    };
    return exports;

}({});