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

        //to perform raycast
        raycaster = raycaster || new THREE.Raycaster();
        o = o || new THREE.Vector3();
        d = d || new THREE.Vector3();

        for( var i = 0; i < count; i++ ){

            // randomize the rays origin
            o.x = lerp( Math.random(), bbox.min.x, bbox.max.x );
            o.y = lerp( Math.random(), bbox.min.y, bbox.max.y );
            o.z = lerp( Math.random(), bbox.min.z, bbox.max.z );

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

                //checks if we meet the conditions
                var valid = intersections.length >= 2 && ( intersections.length % 2 == 0 );
                if (valid) {

                    // make sure that the: origin - direction vector have the same
                    // direction as the normal of the faces they hit )
                    var dp0 = d.dot(intersections[1].face.normal) <= -.1;

                    d.negate();
                    var dp1 = d.dot(intersections[0].face.normal) <= -.1;

                    if (dp0 || dp1) {
                        i--;
                        continue;
                    }

                    console.log('ok');
                    coords.push(intersections[0].point.x, intersections[0].point.y, intersections[0].point.z);
                    dests.push(intersections[1].point.x, intersections[1].point.y, intersections[1].point.z);

                }else{

                    //invalid intersection, try again
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
     * @param decimalPrecision
     */
    scatter.particlesToString = function( particles, decimalPrecision ){

        var precision = decimalPrecision;
        if( precision === undefined )precision = 3;
        var coords = assetsLoader.particles.pos.map( function( v ){return v.toFixed( precision ); });
        var dests = assetsLoader.particles.dst.map( function( v ){return v.toFixed( precision ); });

        var count = ( coords.length / 3 );
        var label = "particles_"+ count +".txt";
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