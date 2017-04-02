

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

var PathLoader = function(){
	function PL(){};
	function load(url, cb ){
		var req = new XMLHttpRequest();
		var scope = this;
		req.onload = function( e ){
			scope.parse(e.target.responseText, cb);
		};
		req.open("GET", url );
		req.send();
	}

	//parse the OBJ vertices
	function parse(str, cb){
		var vertices = [];
		var vs = str.match(/v\s.*/g);
		vs.map( function( v ){
			var st = v.replace( /v\s+/, '').split( /\s/ );
			vertices.push( parseFloat(st[0]), parseFloat(st[1]), parseFloat(st[2]) );
		});
		cb( vertices );
	}
	var p = PL.prototype;
	p.constructor = PL;
	p.load = load;
	p.parse = parse;
	return PL;
}();

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
        	name: "particles",
			url:"particles_8k.txt",			type:assetsLoader.TXT,
			onLoad:function (txt) {
				var res = txt.split( '|' );
				var obj = {};
				obj.pos = res[0].split(',').map( function( v ){return parseFloat( v ); } );
				obj.dst = res[1].split(',').map( function( v ){return parseFloat( v ); } );
				assetsLoader.particles = obj;
			}
        },

		{
			name: "silver",
			url: "../assets/textures/matcap/test_steel.jpg",type:assetsLoader.IMG
		},
		{
			name: "blue",
			url: "../assets/textures/matcap/JG_Drink01.png",type:assetsLoader.IMG
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
}
function createMaterials(){

	startTime = Date.now();
	gold = new THREE.ShaderMaterial({
		uniforms:{
			tMatCap : {type:"t", value:assetsLoader.silver },
			time:{type:"f", value:0 },
			alpha:{type:"f", value:0 }
		},
		vertexShader:assetsLoader.sem_vs,
		fragmentShader:assetsLoader.sem_fs
	});

	var source = assetsLoader.skeleton;
	source.computeVertexNormals();
	text = new THREE.Mesh( source, assetsLoader.blue );
	scene.add( text );

	var mat = new THREE.ShaderMaterial({
		uniforms:{
			tMatCap : {type:"t", value:invTex },
			time:{type:"f", value:0 },
			alpha:{type:"f", value:0.45 }
		},
		vertexShader:assetsLoader.sem_vs,
		fragmentShader:assetsLoader.sem_fs,
		transparent: true,
		side:THREE.DoubleSide,
		depthWrite:false
	});

	var invert = assetsLoader.skeleton;
	invert.computeVertexNormals();
	inv = new THREE.Mesh( invert, mat );
	scene.add( inv );

	var pMat = new THREE.ShaderMaterial({
		uniforms : {
			texture:{type:"t", value:particlesTex},
			time:{type:"f", value:0},
			modBig:{type:"f", value:25},
			pointSize:{type:"f", value:4},
			alpha:{type:"f", value:1}
		},
		vertexShader:	assetsLoader.particles_vs,
		fragmentShader:	assetsLoader.particles_fs,
		transparent:	true,
		// depthTest:	false
	});


	var envMat = new THREE.ShaderMaterial({
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
	var m = new THREE.Mesh( new THREE.CylinderBufferGeometry( .5,.5, 1, 64 ), envMat );
	m.scale.multiplyScalar( 1000 );
	scene.add( m );
}

function init() {

	// readModel();

	createMaterials();

 	collectPoints();//assetsLoader.skeleton, assetsLoader.invert, assetsLoader.particles );
	console.log( assetsLoader )
	render();
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

function collectPoints( particlesData ) {





	var g = new THREE.BufferGeometry();
	if( particlesData === undefined ){

		console.log( inv.geometry);

		inv.material.side = THREE.DoubleSide;
        // inv.material.side = THREE.FrontSide;

		// inv.geometry.computeFaceNormals();
		inv.geometry.computeBoundingBox();
		var raycaster = new THREE.Raycaster();

		var bbox = inv.geometry.boundingBox;

		var coords = [];
		var dests = [];
		var dubious = 0;

		var maxDist = bbox.max.length() * .5;
		//to perform raycast
		var o = new THREE.Vector3();
		var d = new THREE.Vector3();


		for( var i = 0; i < Math.pow( 2, 14 ); i++ ){

			o.x = lerp( Math.random(), bbox.min.x, bbox.max.x );
			o.y = lerp( Math.random(), bbox.min.y, bbox.max.y );
			o.z = lerp( Math.random(), bbox.min.z, bbox.max.z );

			d.x = ( Math.random() - .5 ) * 2;// lerp( Math.random(), bbox.min.x, bbox.max.x );//
			d.y = ( Math.random() - .5 ) * 2;// lerp( Math.random(), bbox.min.y, bbox.max.y );//
			d.z = ( Math.random() - .5 ) * 2;// lerp( Math.random(), bbox.min.z, bbox.max.z );//
			d.normalize();

			raycaster.set( o, d );

			var intersections = raycaster.intersectObject( inv, false );
			var valid = intersections.length && intersections.length >= 2 && ( intersections.length % 2 == 0 );
			if( valid ){

				//dubious point
				if( intersections[1].face.normal.dot( d ) < 0
				||	intersections[0].face.normal.dot( d.negate() ) < 0
				// ||	intersections[0].point.distanceTo(intersections[1].point) > maxDist
				){

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
        console.log( maxDist, dubious );


		g.addAttribute( "position", new THREE.BufferAttribute( new Float32Array( coords ), 3 ));
		g.addAttribute( "dest", new THREE.BufferAttribute( new Float32Array( dests ), 3 ));

		coords = coords.map( function( v ){return v.toFixed( 3 ); });
		dests = dests.map( function( v ){return v.toFixed( 3 ); });
		var str = coords.join(',') + "|" + dests.join(',');
		// console.clear();
		console.log( str );

	}else{

		console.log( 'yop');
		g.addAttribute( "position", new THREE.BufferAttribute( new Float32Array( particlesData.pos ), 3 ));
		g.addAttribute( "dest", new THREE.BufferAttribute( new Float32Array( particlesData.dst ), 3 ));

	}

	var count = g.getAttribute("position").array.length / 3;
	var uvOffset = [];
	while( count-- ){
		uvOffset.push( Math.floor( Math.random() * 4 ) / 4, Math.floor( Math.random() * 4 ) / 4 );
	}
	g.addAttribute( "uvOffset", new THREE.BufferAttribute( new Float32Array( uvOffset ), 2 ));

	particles = new THREE.Points(g,pMat);
	scene.add( particles );

}


function compute( points ){

	var group = new THREE.Group();

	console.time( 'build' )
	for( var i = 0; i < 50; i++ ){

		var nodes = points.concat();
		var vectors  = [];
		origin = nodes.splice( parseInt( Math.random() * nodes.length ), 1 )[0];
		vectors.push( origin );//.x, origin.y, origin.z );
		for( var j = 0; j < 100; j++ ){

			nodes.sort( function( a, b ){
				return a.distanceToSquared( origin ) - b.distanceToSquared( origin );
			});

			var n = nodes.splice(0,1)[0];
			if( origin.distanceTo(n) < 25 ){
				vectors.push( n );//.x,n.y, n.z );
				origin = n;
			}

		}
		if( vectors.length < 5 ){
			i--;
			break;
		}


		var depth = new THREE.Vector2( 0, 10);
		var material = new MeshLineMaterial( {
			useMap: false,
			color: new THREE.Color( 0xFFFFFF ),// colors[ parseInt( Math.random() * colors.length ) ] ),//0xFFFFFF ),//
			opacity: 1,
			resolution: resolution,
			sizeAttenuation: true,
			lineWidth: 1,// + ( ( Math.random() > .35 ? 1 : 0 )*~~(Math.random() * 5 ) ),
			depth: depth,
			near: camera.near,
			far: camera.far,
			depthWrite: true,
			depthTest: 	true,
			transparent: true
		},
		assetsLoader.meshline_vs,
		assetsLoader.meshline_fs);


		// var spl = new THREE.CatmullRomCurve3( vectors );
		// var res = spl.getPoints( vectors.length * 5 );
		var res = Cardinal.compute( vectors, .1, .1 );
		var path = [];
		res.forEach(function( p ){
			path.push( p.x, p.y, p.z )
		});

		var l = new MeshLine();
		//linear
		l.setGeometry( path, function( p ) { return 1; } );

		//parabola
		// l.setGeometry( path, function( p ) { return parabola( p, 1 ); } );

		var line = new THREE.Mesh( l.geometry, material );
		line.startTime = Math.random() * 3 * 1000;
		line.lineLength = .25;// + Math.random() * .5;
		line.speed = .00001 + Math.random() * .0001;
		lines.push( line );
		group.add( line );

	}
	console.timeEnd( 'build' )

	scene.add( group );

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
	if( text !== undefined ){
		// ske.material.uniforms.time.value = time;
		// inv.material.uniforms.time.value = time;
		// inv.material.uniforms.alpha.value = .55;//.35;//.1 + .25 * ( Math.sin( time ) * .5 + .5 );
		particles.material.uniforms.time.value = time;
	}

	lines.forEach( function(l){

		var t = Math.sin( ( Date.now() - l.startTime ) * l.speed ) * 2;
		l.material.uniforms.visibility.value.x = t - l.lineLength;//Math.max( 0, t - l.lineLength );
		l.material.uniforms.visibility.value.y = t;
		// l.material.uniforms.time.value = time;

	});
	renderer.render( scene, camera );

}
