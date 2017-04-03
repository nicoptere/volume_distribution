
var dwarf, env, particles, lines = [], origin;

var colors = "264653-2a9d8f-e9c46a-f4a261-e76f51".split('-').map( function( v ){ return parseInt( "0x" + v ); } );
colors = colors.concat( "f2f3ae-edd382-e7a977-e87461-b38cb4".split('-').map( function( v ){ return parseInt( "0x" + v ); } ) );
colors = colors.concat( "114b5f-456990-028090-79b473-70a37f".split('-').map( function( v ){ return parseInt( "0x" + v ); } ) );


window.onload = function(){

	var queue = [

		{name: "meshline_vs",	url: "./glsl/meshline_vs.glsl",	type:assetsLoader.TXT	},
		{name: "meshline_fs",	url: "./glsl/meshline_fs.glsl",	type:assetsLoader.TXT	},
		{name: "sem_vs", 		url: "./glsl/sem_vs.glsl",		type:assetsLoader.TXT	},
		{name: "sem_fs", 		url: "./glsl/sem_fs.glsl",		type:assetsLoader.TXT	},
        {name: "env_vs", 		url: "./glsl/env_vs.glsl",			type:assetsLoader.TXT	},
        {name: "env_fs", 		url: "./glsl/env_fs.glsl",			type:assetsLoader.TXT	},

		{
			name: "dwarfTexture",
			url: "./assets/textures/matcap/env.png",type:assetsLoader.IMG
		},
		{
			name: "dwarf",
			url: "./assets/models/binaries/dwarf.js",type:assetsLoader.MOD
		},
		{
			name: "particles",
			url:"./assets/models/particles/dwarf/dwarf2k.txt", type:assetsLoader.TXT,
			onLoad:function (txt) {
				var obj = {};
				var res = txt.split( '|' );
				obj.pos = res[0].split(',').map( function( v ){return parseFloat( v ); } );
				obj.dst = res[1].split(',').map( function( v ){return parseFloat( v ); } );
				assetsLoader.particles = obj;
			}
		}
	];
	assetsLoader.load(queue, init);
};

function init() {

    init3D();

    camera.position.x = -200;
	camera.position.y = 90;
	camera.position.z = 300;

    createMaterials();
    createMeshes();

    render();
}

function createMaterials(){

	startTime = Date.now();

	materials.dwarf = new THREE.ShaderMaterial({
		uniforms:{
			tMatCap : {type:"t", value:assetsLoader.dwarfTexture },
			time:{type:"f", value:0 },
			alpha:{type:"f", value:.5 }
		},
		vertexShader:assetsLoader.sem_vs,
		fragmentShader:assetsLoader.sem_fs,
		blending:THREE.MultiplyBlending,
		transparent: true,
		depthWrite:false
	});

	materials.environment = new THREE.ShaderMaterial({
		uniforms : {
			horizon:{type:"f", value: .45 },
			spread:{type:"f", value: .05 },
			topColor:{type:"v3", value:new THREE.Color( 0xEEEEEE )},
			bottomColor:{type:"v3", value:new THREE.Color( 0xBBBBBB )}
		},
		vertexShader:	assetsLoader.env_vs,
		fragmentShader:	assetsLoader.env_fs,
		side:THREE.BackSide,
		depthWrite:false
	});

}

function createMeshes() {

	assetsLoader.dwarf.computeVertexNormals();
    dwarf = new THREE.Mesh(assetsLoader.dwarf, materials.dwarf );
	scene.add(dwarf);

    env = new THREE.Mesh(new THREE.CylinderBufferGeometry(.5, .5, 1, 64), materials.environment);
    env.scale.multiplyScalar(1000);
	scene.add(env);

	if( assetsLoader.particles === undefined ){

		var model = dwarf;
		var count = Math.pow( 2, 11 );//->2048

		assetsLoader.particles = Scatter.distribute( model, count );
		Scatter.toString( assetsLoader.particles, 3, "dwarf"+~~(count/1000)+"k" );

	}

	//create line sets
	// colllect vector3 from particle positions
	var nodes = [];
	var pos = assetsLoader.particles.pos;
	var dst = assetsLoader.particles.dst;
	for( var i = 0; i< pos.length; i+=3 ){

		nodes.push( new THREE.Vector3(
			(pos[ i ]+dst[i])* .5,
			(pos[ i+1 ]+dst[i+1])* .5,
			(pos[ i+2 ]+dst[i+2])* .5  )
		)
	}

	//extremely brutal way of doing this but hey...
	var group = new THREE.Group();
	for( i = 0; i < 100; i++ ){

		var vectors  = [];
		origin = nodes.splice( parseInt( Math.random() * nodes.length ), 1 )[0];
		vectors.push( origin );
		for( var j = 0; j < 16; j++ ){


			nodes.sort( function( a, b ){
				return a.distanceToSquared( origin ) - b.distanceToSquared( origin );
			});

			var n = nodes.splice(~~(Math.random() * 10 ),1)[0];
			vectors.push( n );
			origin = n;
		}

		var material = new MeshLineMaterial( {
				useMap: false,
				color: new THREE.Color( colors[ parseInt( Math.random() * colors.length ) ] ),//0xFFFFFF ),
				opacity: 1,
				resolution: resolution,
				sizeAttenuation: true,
				lineWidth: 1 + ( ( Math.random() > .35 ? 1 : 0 )*~~(Math.random() * 3 ) ),
				near: camera.near,
				far: camera.far,
				depthWrite: false,
				transparent: true
			},
			assetsLoader.meshline_vs,
			assetsLoader.meshline_fs);


		var spl = new THREE.CatmullRomCurve3( vectors );
		var res = spl.getPoints( vectors.length * 5 );
		var path = [];
		res.forEach(function( p, i, a ){
			path.push( p.x, p.y, p.z );
		});

		var l = new MeshLine();
		l.setGeometry( path, function( p ) { return 1; } );

		var line = new THREE.Mesh( l.geometry, material );
		line.startTime = Math.random() * 3 * 1000;
		line.lineLength = .25;
		line.speed = .0001;
		lines.push( line );
		group.add( line );

	}

	scene.add( group );

}

function render() {

	requestAnimationFrame( render );
	controls.update();

	lines.forEach( function(l){

		var t = ( ( Date.now() - l.startTime ) * l.speed ) % ( 1 + l.lineLength );
		l.material.uniforms.visibility.value.x = t - l.lineLength;
		l.material.uniforms.visibility.value.y = t;

	});
	renderer.render( scene, camera );

}
