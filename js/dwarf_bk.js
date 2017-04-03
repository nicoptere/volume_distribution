
var dwarf, env, particles;
window.onload = function(){

	var queue = [

		{name: "particles_vs",	url: "./glsl/line_sem_vs.glsl",	type:assetsLoader.TXT	},
		{name: "particles_fs",	url: "./glsl/line_sem_fs.glsl",	type:assetsLoader.TXT	},
		{name: "sem_vs", 		url: "./glsl/sem_vs.glsl",		type:assetsLoader.TXT	},
		{name: "sem_fs", 		url: "./glsl/sem_fs.glsl",		type:assetsLoader.TXT	},
        {name: "env_vs", 		url: "./glsl/env_vs.glsl",			type:assetsLoader.TXT	},
        {name: "env_fs", 		url: "./glsl/env_fs.glsl",			type:assetsLoader.TXT	},

		{
			name: "dwarfTexture",
			url: "./assets/textures/matcap/thuglee-03.jpg",type:assetsLoader.IMG
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

    camera.position.x = 100;
	camera.position.y = -45;
	camera.position.z = 350;

    createMaterials();
    createMeshes();
    createParticles();

	scene.add(env);
	scene.add( particles );
	scene.add(dwarf);

    render();
}

function createMaterials(){

	startTime = Date.now();

	materials.dwarf = new THREE.ShaderMaterial({
		uniforms:{
			tMatCap : {type:"t", value:assetsLoader.dwarfTexture },
			time:{type:"f", value:0 },
			alpha:{type:"f", value:.35 }
		},
		vertexShader:assetsLoader.sem_vs,
		fragmentShader:assetsLoader.sem_fs,
		blending:THREE.MultiplyBlending,
		transparent: true,
		side:THREE.FrontSide,
		depthWrite:false
	});

	materials.particles = new THREE.LineBasicMaterial({
		color:0x000000,
		transparent:true,
		opacity: .25
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
		side:THREE.BackSide
	});

}

function createMeshes() {

	assetsLoader.dwarf.computeVertexNormals();
    dwarf = new THREE.Mesh(assetsLoader.dwarf, materials.dwarf );

    env = new THREE.Mesh(new THREE.CylinderBufferGeometry(.5, .5, 1, 64), materials.environment);
    env.scale.multiplyScalar(1000);

}


function createParticles(){

	if( assetsLoader.particles === undefined ){

		var model = dwarf;
		var count = Math.pow( 2, 11 );//->2048

		assetsLoader.particles = Scatter.distribute( model, count );
		Scatter.toString( assetsLoader.particles, 3, "dwarf"+~~(count/1000)+"k" );

	}

	var pos = assetsLoader.particles.pos;
	var dst = assetsLoader.particles.dst;
	var buffer = new Float32Array( pos.length * 2 );
	for( var i = 0; i< pos.length; i+=3 ){

		var id = i * 2;
		buffer[ id++ ] = pos[ i ];
		buffer[ id++ ] = pos[ i + 1 ];
		buffer[ id++ ] = pos[ i + 2 ];

		buffer[ id++ ] = dst[ i ];
		buffer[ id++ ] = dst[ i + 1 ];
		buffer[ id++ ] = dst[ i + 2 ];

	}

	var g = new THREE.BufferGeometry();
	g.addAttribute( "position", new THREE.BufferAttribute( buffer, 3 ));
	g.computeVertexNormals();

	particles = new THREE.LineSegments(g,materials.particles );

}


function render() {

	requestAnimationFrame( render );
	controls.update();

	var time = ( Date.now() - startTime ) * 0.001;
	for( var k in materials ){

		if( materials[ k ].uniforms !== undefined && materials[ k ].uniforms.time !== undefined ){

			materials[ k ].uniforms.time.value = time;

		}
	}

	renderer.render( scene, camera );

}
