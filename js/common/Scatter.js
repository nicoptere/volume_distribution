var Scatter = function( scatter ){

    var raycaster;//THREE.raycaster: used to shoot rays at the mesh
    var o;//ray origin
    var d;//ray direction
    var intersections;//stores the result of the raycasting
    var a;//DOM element tag to download the result ( see particlesToString )

    scatter.distribute = function( mesh, count ) {

        //this will store the results
        var coords = [];
        var dests = [];
        //temporary vars to store the position and destination
        var p0, p1;

        //this has an influence as to how the raycasting is performed
        var side = mesh.material.side;
        mesh.material.side = THREE.DoubleSide;

        //we'll need this (juste to be sure as it's probably done implicitly when we raycast)
        mesh.geometry.computeFaceNormals();

        //this is used to distributte the origins of the rays
        mesh.geometry.computeBoundingBox();
        var bbox = mesh.geometry.boundingBox;

        // 'inflates' the box by 10% to prevent colinearity
        // or coplanarity of the origin with the mesh
        bbox.min.multiplyScalar( 1.1 );
        bbox.max.multiplyScalar( 1.1 );

        //computes the box' size to compute random points
        var size = bbox.max.sub( bbox.min );

        //to perform raycast
        raycaster = raycaster || new THREE.Raycaster();
        o = o || new THREE.Vector3();
        d = d || new THREE.Vector3();

        for( var i = 0; i < count; i++ ){

            // randomize the rays origin
            o.x = bbox.min.x + Math.random() * size.x;
            o.y = bbox.min.y + Math.random() * size.y;
            o.z = bbox.min.z + Math.random() * size.z;

            //randomize the ray's direction
            d.x = ( Math.random() - .5 );
            d.y = ( Math.random() - .5 );
            d.z = ( Math.random() - .5 );
            d.normalize();

            //sets the raycaster
            raycaster.set( o, d );

            //shoots the ray
            intersections = raycaster.intersectObject( mesh, false );

            //no result
            if( intersections.length == 0 ){

                //bail out & continue
                i--;

            }else{

                //checks if we meet the conditions:
                //the origin must be outside
                var valid = intersections.length >= 2 && ( intersections.length % 2 == 0 );
                if (valid) {

                    //tests all the intersection pairs
                    var additions = -1;
                    for( var j = 0; j < intersections.length; j+= 2 ){

                        // make sure that the origin -> direction vector have the same
                        // direction as the normal of the face they hit

                        //test the direction against the outwards' face's normal
                        var dp0 = d.dot(intersections[ j + 1 ].face.normal) <= 0;

                        //flips the direction to make it 'look at' the origin
                        d.negate();

                        //test the direction against the inwards' face's normal
                        var dp1 = d.dot(intersections[ j ].face.normal) <= 0;

                        //flips the direction again for the next test
                        d.negate();

                        // if both vectors pairs head in the same direction
                        // the point is guarranteed to be inside
                        if( dp0 || dp1){
                            continue;
                        }

                        //adds the points
                        if( coords.length < count * 3 ){
                            console.log("ok")
                            p0 = intersections[j].point;
                            coords.push( p0.x, p0.y, p0.z);
                            p1 = intersections[j+1].point;
                            dests.push( p1.x, p1.y, p1.z);
                            additions++;
                        }
                    }
                    //increments the counter by the number of additions
                    i += additions;

                }else{
                    //invalid intersection, try again...
                    i--;
                }
            }
        }

        //resets the material side
        mesh.material.side = side;
        return {
            pos:coords,
            dst:dests
        };

    };


    /**
     * converts the result of the scatter to a text string
     * @param particles coordinates of the points/dest
     * @param decimalPrecision floating point precision
     * @param name optional: name for the file
     */
    scatter.toString = function( particles, decimalPrecision, name ){

        var precision = decimalPrecision;
        if( precision === undefined )precision = 3;
        var coords = assetsLoader.particles.pos.map( function( v ){return v.toFixed( precision ); });
        var dests = assetsLoader.particles.dst.map( function( v ){return v.toFixed( precision ); });

        var count = ( coords.length / 3 );
        var label = ( name || ( "particles_"+ count ) ) +".txt";
        var data = coords.join(',') + "|" + dests.join(',') ;

        var txtData = new Blob([data], { type: 'text/csv' });
        var txtUrl = window.URL.createObjectURL(txtData);

        a = a || document.createElement( "a" );
        a.setAttribute( "href", txtUrl );
        a.setAttribute( "download", label );
        a.innerHTML = label;

        a.style.position = "absolute";
        a.style.padding = a.style.margin = "10px";
        a.style.bottom = "0";
        a.style.left = "0";
        a.style.backgroundColor = "#FFF";

        document.body.appendChild( a );

    };

    return scatter;
}({});