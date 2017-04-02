

window.onload = function(){

	var queue = [

		{name: "meshline_vs", 	url: "./glsl/meshline_vs.glsl",		type:assetsLoader.TXT	},
		{name: "meshline_fs", 	url: "./glsl/meshline_fs.glsl",		type:assetsLoader.TXT	},
		{name: "particles_vs",	url: "./glsl/particles_vs.glsl",	type:assetsLoader.TXT	},
		{name: "particles_fs",	url: "./glsl/particles_fs.glsl",	type:assetsLoader.TXT	},
		{name: "sem_vs", 		url: "./glsl/sem_vs.glsl",			type:assetsLoader.TXT	},
		{name: "sem_fs", 		url: "./glsl/sem_fs.glsl",			type:assetsLoader.TXT	},
        {name: "env_vs", 		url: "./glsl/env_vs.glsl",			type:assetsLoader.TXT	},
        {name: "env_fs", 		url: "./glsl/env_fs.glsl",			type:assetsLoader.TXT	},
        {name: "env_fs", 		url: "./glsl/env_fs.glsl",			type:assetsLoader.TXT	},

		{
			name: "silver",
			url: "../assets/textures/matcap/test_steel.jpg",type:assetsLoader.IMG
		},
		{
			name: "blue",
			url: "../assets/textures/matcap/JG_Drink01.png",type:assetsLoader.IMG
		},
		{
			name: "particlesTexture",
			url: "../assets/textures/particles.png",type:assetsLoader.IMG
		},

		{
			name: "skeleton",
			url: "../assets/models/suzanne.js",type:assetsLoader.MOD
		},
		{
			name: "invert",
			url: "../assets/models/invert.js",type:assetsLoader.MOD
		},

		// /*
		 {
		 name: "particles",
		 url:"particles_65536_1.txt",			type:assetsLoader.TXT,
		 onLoad:function (txt) {
			 var res = txt.split( '|' );
			 var obj = {};
			 obj.pos = res[0].split(',').map( function( v ){return parseFloat( v ); } );
			 obj.dst = res[1].split(',').map( function( v ){return parseFloat( v ); } );
			 assetsLoader.particles = obj;
		 }
		 },//*/

	];

	assetsLoader.load(queue, init);
};

function createMaterials(){

	startTime = Date.now();

	materials.silver = new THREE.ShaderMaterial({
		uniforms:{
			tMatCap : {type:"t", value:assetsLoader.silver },
			time:{type:"f", value:0 },
			alpha:{type:"f", value:0 }
		},
		vertexShader:assetsLoader.sem_vs,
		fragmentShader:assetsLoader.sem_fs
	});

	materials.blue = new THREE.ShaderMaterial({
		uniforms:{
			tMatCap : {type:"t", value:assetsLoader.blue },
			time:{type:"f", value:0 },
			alpha:{type:"f", value:0.45 }
		},
		vertexShader:assetsLoader.sem_vs,
		fragmentShader:assetsLoader.sem_fs,
		transparent: true,
		side:THREE.DoubleSide,
		depthWrite:false
	});

	materials.particles = new THREE.ShaderMaterial({
		uniforms : {
			texture:{type:"t", value:assetsLoader.particlesTexture},
			time:{type:"f", value:0},
			modBig:{type:"f", value:25},
			pointSize:{type:"f", value:4},
			alpha:{type:"f", value:1}
		},
		vertexShader:	assetsLoader.particles_vs,
		fragmentShader:	assetsLoader.particles_fs,
		transparent:	true
	});

	materials.environment = new THREE.ShaderMaterial({
		uniforms : {
			horizon:{type:"f", value: .45 },
			spread:{type:"f", value: .05 },
			topColor:{type:"v3", value:new THREE.Color( 0x505050 )},
			bottomColor:{type:"v3", value:new THREE.Color( 0x101010 )}
		},
		vertexShader:	assetsLoader.env_vs,
		fragmentShader:	assetsLoader.env_fs,
		side:THREE.BackSide
	});

}

function init() {

	init3D();
	camera.position.z = 30;

	createMaterials();
	createMeshes();

	createParticles();
	render();

}

function createMeshes() {

	skeleton = new THREE.Mesh(assetsLoader.skeleton, materials.silver);
	scene.add(skeleton);

	invertSkeleton = new THREE.Mesh(assetsLoader.invert, materials.blue);
	scene.add(invertSkeleton);

	var env = new THREE.Mesh(new THREE.CylinderBufferGeometry(.5, .5, 1, 64), materials.environment);
	env.scale.multiplyScalar(1000);
	scene.add(env);

}

function createParticles(){

	if( assetsLoader.particles === undefined ){

		var count = Math.pow( 2, 16 );
		var model = invertSkeleton;

		distribute( count, model );

	}

	var g = new THREE.BufferGeometry();
	g.addAttribute( "position", new THREE.BufferAttribute( new Float32Array( assetsLoader.particles.pos ), 3 ));
	g.addAttribute( "dest", new THREE.BufferAttribute( new Float32Array( assetsLoader.particles.dst ), 3 ));

	var uvCount = ( g.getAttribute("position").array.length / 3 ) * 2;
	var uvOffset = [];
	while( uvCount-- ){
		uvOffset.push( Math.floor( Math.random() * 4 ) / 4, Math.floor( Math.random() * 4 ) / 4 );
	}
	g.addAttribute( "uvOffset", new THREE.BufferAttribute( new Float32Array( uvOffset ), 2 ));
	particles = new THREE.Points(g,materials.particles);
	scene.add( particles );


}

function distribute( count, model ) {

	//this will store the results
	var coords = [];
	var dests = [];

	//this has an influence as to how the raycasting is performed
	model.material.side = THREE.DoubleSide;

	//we'll need this
	model.geometry.computeFaceNormals();

	//this is used to distributte the origins of the rays
	model.geometry.computeBoundingBox();
	var bbox = model.geometry.boundingBox;

		// 'inflates' the box by 10% to prevent colinearity
		// or coplanarity of the origin with the mesh

		bbox.min.multiplyScalar( 1.1 );
		bbox.max.multiplyScalar( 1.1 );

	//to perform raycast
	var raycaster = new THREE.Raycaster();
	var o = new THREE.Vector3();
	var d = new THREE.Vector3();

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

		//shoots the ray
		raycaster.set( o, d );

		var intersections = raycaster.intersectObject( model, false );

		var valid = intersections.length && intersections.length >= 2 && ( intersections.length % 2 == 0 );
		if( valid ){

			// make sure that the: origin - direction vector have the same
			// direction as the normal of the faces they hit )

			var dp0 = d.dot( intersections[1].face.normal ) <= -.1;

			d.negate();
			var dp1 = d.dot( intersections[0].face.normal ) <= -.1;

			if( dp0 || dp1 ){
				i--;
				continue;
			}

			console.log( 'ok' );
			coords.push( intersections[0].point.x, intersections[0].point.y, intersections[0].point.z );
			dests.push( intersections[1].point.x, intersections[1].point.y, intersections[1].point.z );

		}else{
			i--;
		}

	}

	assetsLoader.particles = {
		pos:coords,
		dst:dests
	};

}

function particlesToString( decimalPrecision ){


	var precision = decimalPrecision;
	if( precision === undefined )precision = 3;
	var coords = assetsLoader.particles.pos.map( function( v ){return v.toFixed( precision ); });
	var dests = assetsLoader.particles.dst.map( function( v ){return v.toFixed( precision ); });

	var count = ( coords.length / 3 );
	var label = "particles_"+ count +".txt";
	var data = coords.join(',') + "|" + dests.join(',') ;

	var txtData = new Blob([data], { type: 'text/csv' });
	var txtUrl = window.URL.createObjectURL(txtData);

	var a = document.createElement( "a" );
	a.setAttribute( "href", txtUrl );
	a.setAttribute( "download", label );
	a.innerHTML = label;

	a.style.position = "absolute";
	a.style.padding = "10px";
	a.style.top = "0";
	a.style.left = "0";
	a.style.backgroundColor = "#FFF";

	document.body.appendChild( a );

}

function render() {

	requestAnimationFrame( render );
	controls.update();
	var time = ( Date.now() - startTime ) * 0.001;

	for( var k in materials ){

		if( materials[ k ].uniforms.time !== undefined ){

			materials[ k ].uniforms.time.value = time;

		}
	}

	renderer.render( scene, camera );

}
