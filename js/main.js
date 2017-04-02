

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 42, window.innerWidth / window.innerHeight, 1, 10000 );

var renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setClearColor( new THREE.Color( 0x101010 ));
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );
document.body.appendChild( renderer.domElement );



var resolution = new THREE.Vector2( window.innerWidth, window.innerHeight );


var controls = new THREE.OrbitControls( camera, renderer.domElement );
camera.position.z = 30;

var materials = {};


var lines = [], matCap, text, startTime;
var particles;
var particlesTex;
var invTex;
var inv;
var origin;

// var colors = [0xed6a5a, 0xf4f1bb, 0x9bc1bc, 0x5ca4a9, 0xe6ebe0, 0xf0b67f, 0xfe5f55, 0xd6d1b1, 0xc7efcf, 0xeef5db, 0x50514f, 0xf25f5c, 0xffe066, 0x247ba0, 0x70c1b3 ];
// colors = [0x556270, 0x4ECDC4, 0xC7F464, 0xFF6B6B, 0xC44D58 ];
// colors = [0x8949C9, 0xFF00BB, 0x00E05E, 0xACFF24, 0xFFE608 ];

var colors = "264653-2a9d8f-e9c46a-f4a261-e76f51".split('-').map( function( v ){ return parseInt( "0x" + v ); } );
// colors = colors.concat( "f2f3ae-edd382-e7a977-e87461-b38cb4".split('-').map( function( v ){ return parseInt( "0x" + v ); } ) );
colors = colors.concat( "114b5f-456990-028090-79b473-70a37f".split('-').map( function( v ){ return parseInt( "0x" + v ); } ) );

function lerp ( t, a, b ){ return a * (1-t) + b * t; }
function norm( t, a, b ){return ( t - a ) / ( b - a );}
function map( t, a0, b0, a1, b1 ){ return lerp( norm( t, a0, b0 ), a1, b1 );}
function parabola( x, k ) {return Math.pow( 4 * x * ( 1 - x ), k );}

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

		/*
        {
        	name: "particles",
			url:"particles_8k.txt",			type:assetsLoader.TXT,
			onLoad:function (txt) {
				var res = txt.split( '|' );
				var obj = {};
				obj.pos = res[0].split(',').map( function( v ){return parseFloat( v ); } );
				obj.dst = res[1].split(',').map( function( v ){return parseFloat( v ); } );
				assetsLoader.particles = obj;
			}
        },//*/

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
			url: "../assets/models/skeleton.js",type:assetsLoader.MOD
		},
		{
			name: "invert",
			url: "../assets/models/invert.js",type:assetsLoader.MOD
		}
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

	// readModel();

	createMaterials();
	createMeshes();

 	// collectPoints();//assetsLoader.skeleton, assetsLoader.invert, assetsLoader.particles );
	// console.log( assetsLoader )
	render();
}

function createMeshes(){


	text = new THREE.Mesh( assetsLoader.skeleton, materials.silver );
	// text.geometry.computeVertexNormals();
	scene.add( text );

	// var invert = ;
	inv = new THREE.Mesh( assetsLoader.invert, materials.blue );
	// inv.geometry.computeVertexNormals();
	scene.add( inv );

	var m = new THREE.Mesh( new THREE.CylinderBufferGeometry( .5,.5, 1, 64 ), materials.environment );
	m.scale.multiplyScalar( 1000 );
	scene.add( m );

	if( assetsLoader.particles === undefined ){

		var count = Math.pow( 2, 12 );
		var model = inv;

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

function readModel( cb ) {

		var xhr = new XMLHttpRequest();
		xhr.onload = function( e ){

			var res = e.target.responseText.split( '|' );
			var obj = {};
			obj.pos = res[0].split(',').map( function( v ){return parseFloat( v ); } );
			obj.dst = res[1].split(',').map( function( v ){return parseFloat( v ); } );

			var loader = new THREE.BinaryLoader();
			loader.load( '../assets/models/skeleton.js', function( res ) {

				var tl = new THREE.TextureLoader();
				// tl.load( "../assets/textures/matcap/chrome_dark.png", function(tex){
				tl.load( "../assets/textures/matcap/test_steel.jpg", function(tex) {
					matCap = tex;

					loader.load( '../assets/models/invert.js', function( inv ) {

						// tl.load( "../assets/textures/matcap/generator8.jpg", function(tex) {
						tl.load( "../assets/textures/matcap/JG_Drink01.png", function(tex) {
						// tl.load( "../assets/textures/matcap/gold.png", function(tex) {
							invTex = tex;

							tl.load( "../assets/textures/particles.png", function(tex) {
								particlesTex = tex;
								collectPoints(res, inv);//, obj);//
							});
						} );
					} );
				} );
			} );
		};
		xhr.open( "GET", "particles_8k.txt" );
		xhr.send();

}

function distribute( count, model ) {

	//this will store the results
	var coords = [];
	var dests = [];
	var dubious = 0;

	//this has an influence as to how the raycasting is performed
	model.material.side = THREE.DoubleSide;

	//we'll need this
	model.geometry.computeFaceNormals();

	//this is used to distributte the origins of the rays
	model.geometry.computeBoundingBox();
	var bbox = model.geometry.boundingBox;

		//'inflates' the box a bit to prevent colinear points
		bbox.min.multiplyScalar( 1.1 );
		bbox.max.multiplyScalar( 1.1 );

	//to perform raycast
	var raycaster = new THREE.Raycaster();
	var o = new THREE.Vector3();
	var d = new THREE.Vector3();

	for( var i = 0; i < count; i++ ){

		o.x = lerp( Math.random(), bbox.min.x, bbox.max.x );
		o.y = lerp( Math.random(), bbox.min.y, bbox.max.y );
		o.z = lerp( Math.random(), bbox.min.z, bbox.max.z );

		d.x = ( Math.random() - .5 );
		d.y = ( Math.random() - .5 );
		d.z = ( Math.random() - .5 );
		d.normalize();

		raycaster.set( o, d );

		var intersections = raycaster.intersectObject( model, false );
		var valid = intersections.length && intersections.length >= 2 && ( intersections.length % 2 == 0 );
		if( valid ){

			//dubious point
			if( intersections[1].face.normal.dot( d ) <= -.1
			||	intersections[0].face.normal.dot( d.negate() ) <= -.1 ){

				dubious++;
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

	// g.addAttribute( "position", new THREE.BufferAttribute( new Float32Array( coords ), 3 ));
	// g.addAttribute( "dest", new THREE.BufferAttribute( new Float32Array( dests ), 3 ));

}

function particlesToString(){

	coords = coords.map( function( v ){return v.toFixed( 3 ); });
	dests = dests.map( function( v ){return v.toFixed( 3 ); });

	var str = coords.join(',') + "|" + dests.join(',');
	// console.clear();
	console.log( str );
}

onWindowResize();

function onWindowResize() {

	var w = window.innerWidth;
	var h = window.innerHeight;
	camera.aspect = w / h;
	camera.updateProjectionMatrix();
	renderer.setSize( w, h );
	resolution.set( w, h );

}

window.addEventListener( 'resize', onWindowResize );

function render() {

	requestAnimationFrame( render );
	controls.update();
	var time = ( Date.now() - startTime ) * 0.001;

	for( var k in materials ){

		if( materials[ k ].uniforms.time !== undefined ){

			// materials[ k ].uniforms.time.value = time;

		}
	}

	// if( text !== undefined ){
	// 	// ske.material.uniforms.time.value = time;
	// 	// inv.material.uniforms.time.value = time;
	// 	// inv.material.uniforms.alpha.value = .55;//.35;//.1 + .25 * ( Math.sin( time ) * .5 + .5 );
	// 	particles.material.uniforms.time.value = time;
	// }
    //
	// lines.forEach( function(l){
    //
	// 	var t = Math.sin( ( Date.now() - l.startTime ) * l.speed ) * 2;
	// 	l.material.uniforms.visibility.value.x = t - l.lineLength;//Math.max( 0, t - l.lineLength );
	// 	l.material.uniforms.visibility.value.y = t;
	// 	// l.material.uniforms.time.value = time;
    //
	// });
	renderer.render( scene, camera );

}
