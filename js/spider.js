
var spider;
window.onload = function(){

	var queue = [

		{name: "particles_vs",	url: "./glsl/particles_vs.glsl",	type:assetsLoader.TXT	},
		{name: "particles_fs",	url: "./glsl/particles_fs.glsl",	type:assetsLoader.TXT	},
		{name: "sem_vs", 		url: "./glsl/sem_vs.glsl",			type:assetsLoader.TXT	},
		{name: "sem_fs", 		url: "./glsl/sem_fs.glsl",			type:assetsLoader.TXT	},
        {name: "env_vs", 		url: "./glsl/env_vs.glsl",			type:assetsLoader.TXT	},
        {name: "env_fs", 		url: "./glsl/env_fs.glsl",			type:assetsLoader.TXT	},

		{
			name: "spiderTexture",
			url: "./assets/textures/matcap/chrome_eye.png",type:assetsLoader.IMG
		},
		{
			name: "particlesTexture",
			url: "./assets/textures/particles.png",type:assetsLoader.IMG
		},
		{
			name: "spider",
			url: "./assets/models/binaries/spider.js",type:assetsLoader.MOD
		},

		{
			name: "particles",
			url:"./assets/models/particles/spider/spider32k.txt", type:assetsLoader.TXT,
			onLoad:function (txt) {
				var obj = {};
				var res = txt.split( '|' );
				obj.pos = res[0].split(',').map( function( v ){return parseFloat( v ); } );
				obj.dst = res[1].split(',').map( function( v ){return parseFloat( v ); } );
				assetsLoader.particles = obj;
			}
		}
//*/
	];

	assetsLoader.load(queue, init);
};

function init() {

    init3D();

    camera.position.x = -275;
	camera.position.y = 225;
	camera.position.z = 275;

    createMaterials();
    createMeshes();
    createParticles();
    render();

}

function createMaterials(){

	startTime = Date.now();

	materials.spiderTexture = new THREE.ShaderMaterial({
		uniforms:{
			tMatCap : {type:"t", value:assetsLoader.spiderTexture },
			time:{type:"f", value:0 },
			alpha:{type:"f", value:0.75 }
		},
		vertexShader:assetsLoader.sem_vs,
		fragmentShader:assetsLoader.sem_fs,
		transparent: true,
		side:THREE.DoubleSide,
		depthWrite:false,
		// wireframe:true
	});

	materials.particles = new THREE.ShaderMaterial({
		uniforms : {
			color:{type:"v3", value:new THREE.Color( 0xCCCCCC )},
			bounds:{type:"v2", value:new THREE.Vector2( .25, .5 )},//start / length
			time:{type:"f", value:0},
			modBig:{type:"f", value:100},
			pointSize:{type:"f", value:2},
			alpha:{type:"f", value:1}
		},
		vertexShader:	assetsLoader.particles_vs,
		fragmentShader:	assetsLoader.particles_fs,
		transparent:	true
	});

	materials.environment = new THREE.ShaderMaterial({
		uniforms : {
			horizon:{type:"f", value: .5 },
			spread:{type:"f", value: .25 },
			topColor:{type:"v3", value:new THREE.Color( 0x202020 )},
			bottomColor:{type:"v3", value:new THREE.Color( 0x101010 )}
		},
		vertexShader:	assetsLoader.env_vs,
		fragmentShader:	assetsLoader.env_fs,
		side:THREE.BackSide
	});

}

function createMeshes() {

    spider = new THREE.Mesh(assetsLoader.spider, materials.spiderTexture );
    scene.add(spider);

    var env = new THREE.Mesh(new THREE.CylinderBufferGeometry(.5, .5, 1, 64), materials.environment);
    env.scale.multiplyScalar(1000);
    scene.add(env);

}


function createParticles(){

	if( assetsLoader.particles === undefined ){

		var model = spider;
		var count = Math.pow( 2, 15 );

		assetsLoader.particles = Scatter.distribute( model, count );
		Scatter.toString( assetsLoader.particles, 3, "spider32k" );

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
	scene.add( particles );

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
