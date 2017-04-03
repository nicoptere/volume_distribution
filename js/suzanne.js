
var skeleton, invertSkeleton, env, particles;

window.onload = function(){

	var queue = [

		{name: "particles_vs",	url: "./glsl/texture_particles_vs.glsl",	type:assetsLoader.TXT	},
		{name: "particles_fs",	url: "./glsl/texture_particles_fs.glsl",	type:assetsLoader.TXT	},
		{name: "sem_vs", 		url: "./glsl/sem_vs.glsl",			type:assetsLoader.TXT	},
		{name: "sem_fs", 		url: "./glsl/sem_fs.glsl",			type:assetsLoader.TXT	},
        {name: "env_vs", 		url: "./glsl/env_vs.glsl",			type:assetsLoader.TXT	},
        {name: "env_fs", 		url: "./glsl/env_fs.glsl",			type:assetsLoader.TXT	},

		{
			name: "silver",
			url: "./assets/textures/matcap/test_steel.jpg",type:assetsLoader.IMG
		},
		{
			name: "blue",
			url: "./assets/textures/matcap/JG_Drink01.png",type:assetsLoader.IMG
		},
		{
			name: "particlesTexture",
			url: "./assets/textures/particles.png",type:assetsLoader.IMG
		},

		{
			name: "skeleton",
			url: "./assets/models/binaries/suzanne.js",type:assetsLoader.MOD
		},
		{
			name: "invert",
			url: "./assets/models/binaries/suzanne_invert.js",type:assetsLoader.MOD
		},
		{
			name: "particles",
			url:"./assets/models/particles/suzanne/volume65k.txt", type:assetsLoader.TXT,
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
    camera.position.x = 0;
    camera.position.y = 7;
    camera.position.z = 20;

    createMaterials();

    createMeshes();
	createParticles();

	scene.add(skeleton);
	scene.add(invertSkeleton);
	scene.add(env);
	scene.add( particles );


	render();

}

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
		side:THREE.BackSide,
		depthWrite:false
	});

}

function createMeshes() {

    skeleton = new THREE.Mesh(assetsLoader.skeleton, materials.silver);

    invertSkeleton = new THREE.Mesh(assetsLoader.invert, materials.blue);

    env = new THREE.Mesh(new THREE.CylinderBufferGeometry(.5, .5, 1, 64), materials.environment);
    env.scale.multiplyScalar(1000);

}


function createParticles(){

	if( assetsLoader.particles === undefined ){

		var model = invertSkeleton;
		var count = Math.pow( 2, 16 );

		assetsLoader.particles = Scatter.distribute( model, count );
		Scatter.toString( assetsLoader.particles, 3, "surface65k" );

	}

	var g = new THREE.BufferGeometry();
	g.addAttribute( "position", new THREE.BufferAttribute( new Float32Array( assetsLoader.particles.pos ), 3 ));
	g.addAttribute( "dest", new THREE.BufferAttribute( new Float32Array( assetsLoader.particles.dst ), 3 ));

	//adds uvs to the particles (the texture is a 4*4 spritesheet
	var uvCount = ( g.getAttribute("position").array.length / 3 ) * 2;
	var uvOffset = new Float32Array( uvCount );
	var i = 0;
	while( i < uvCount ){
		uvOffset[ i++ ] = Math.floor( Math.random() * 4 ) / 4;
	}
	g.addAttribute( "uvOffset", new THREE.BufferAttribute( uvOffset, 2 ));
	particles = new THREE.Points(g,materials.particles);

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
