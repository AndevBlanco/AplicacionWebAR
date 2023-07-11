// Init the stats

stats = new Stats();
stats.setMode(0);
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';
stats.domElement.style.zIndex = 100;
document.body.appendChild( stats.domElement );

// var renderer = new THREE.WebGLRenderer({antialias	: true,	alpha		: true});
var renderer = new THREE.WebGLRenderer({alpha		: true});
renderer.setSize( window.innerWidth, window.innerHeight ); 
document.body.appendChild( renderer.domElement );

var scene = new THREE.Scene();

// Create a camera and set it into world space
// This camera will provide a perspective projection
// Arguments are (fov, aspect, near_plane, far_plane)

var initialfoclength = 320; // Initial value for focal length

var camera = new THREE.PerspectiveCamera(40, window.innerWidth/window.innerHeight, 0.1, 1000);
scene.add(camera);
camera.position.z = 2;

var localToCameraAxesPlacement;
var axes = new THREE.AxesHelper( 0.1 );
localToCameraAxesPlacement = new THREE.Vector3(-0.7 * camera.aspect,-0.5, -2);
scene.add(axes);

var markerObject3D1 = new THREE.Object3D();
scene.add(markerObject3D1);

var controls = new function(){
	this.foclength = initialfoclength;
	this.manualfoclength = false;
	this.playvideo = true;
	this.playvideoprev = true;
	this.debugmarkers = false;
	this.detectmarkers = true;
	this.num_markers = 1024;  // Número de posibles IDs. Usado para dimensionar array de filtrado POSIT
	this.cualdebug = 255;  // ID del marcador a depurar
	
	this.colormesh1 = 0xc8c8c8;
	this.colormesh2 = 0xff0000;
	this.colormesh3 = 0x00ff00;
	this.objectrotationH = 0.0;
	this.objectrotationV = 0.0;
	this.layer1 = true;
	this.layer2 = true;
	this.layer3 = true;
	this.changes_in_material = false;
	this.start = false;
	this.restart = false;
	this.rotationx = 0;
	this.rotationy = 0;
	this.rotationz = 0;
	this.inclination = 0;
	this.onStart = function (e) {
		this.start = true;
	}
	
	this.onRestart = function (e) {
		this.restart = true;
	}

	this.updateFov = function (e) {               
		camera.fov = e;
		camera.updateProjectionMatrix();
	}
	
	this.updateDebugMarkers = function (e) {
		jsArucoMarker.debugEnabled = e;
	}
	this.updateMatFlag = function (){
		controls.changes_in_material = true;
	}
	this.updateRotationX = function (e){
		controls.rotationx = e;
		markerObject3D1.rotation.x = Math.PI / e;
	}
	this.updateRotationY = function (e){
		controls.rotationy = e;
		markerObject3D1.rotation.y = Math.PI / e;
	}
	this.updateRotationZ = function (e){
		controls.rotationz = e;
		markerObject3D1.rotation.z = Math.PI / e;
	}
	this.updateInclination = function (e){
		controls.inclination = e;
		markerObject3D1.quaternion.setFromEuler(new THREE.Euler(this.rotationx, this.rotationy, this.rotationz));
	}
}

var light_point = new THREE.PointLight(controls.colorpointlight, 0.8);
camera.add(light_point);
light_point.position.set(0,0,3);
light_point.visible = true;

// Array usado en jsarucomarker.js para pasar en la invocación a POSIT.pose los valores históricos usados para filtrar la salida de POSIT
// El orden es: candidatoprev, cambiospropuestos
// Usado como variable global para poder tener un array de objetos PersistID, con cada marcador (ID) distinto recibiendo su propio objeto
// Los objetos proporcionan la persistencia necesaria para el seguimiento de la salida de POSIT
// El ID del objeto se utiliza como índice para acceder al objeto correspondiente

var PersistID = {
	candidatoprev: 0,  // valor histórico para filtrado POSIT
	cambiospropuestos: 0 // valor histórico para filtrado POSIT
};

var array_PersistIDs = [];
for (var i=0; i < controls.num_markers; i++){
	// Poblamos el array de objetos PersistID
	var cualPersist = Object.create(PersistID);
	array_PersistIDs.push(cualPersist);
}


var gui = new dat.GUI({autoplace:false, width:400});

var f2 = gui.addFolder('Controls');
f2.add(controls, 'start').onChange(controls.onStart);
f2.add(controls, 'restart').onChange(controls.onRestart);

var f4 = gui.addFolder('Interaction');
f4.add(controls, 'rotationx', 1, 10).onChange(controls.updateRotationX);
f4.add(controls, 'rotationy', 1, 10).onChange(controls.updateRotationY);
f4.add(controls, 'rotationz', 1, 10).onChange(controls.updateRotationZ);
f4.add(controls, 'inclination', 1, 10).onChange(controls.updateInclination);
/*
var f3 = gui.addFolder('Debug');
f3.add(controls, 'debugmarkers').onChange(controls.updateDebugMarkers);
f3.add(controls, 'detectmarkers');
f3.add(controls, 'cualdebug',0,1023); */

/* var f6 = gui.addFolder('Scene control');
// f6.add(controls, 'playvideo');
f6.addColor(controls, 'colormesh1').onChange(controls.updateMatFlag);
f6.addColor(controls, 'colormesh2').onChange(controls.updateMatFlag);
f6.addColor(controls, 'colormesh3').onChange(controls.updateMatFlag); */




var axesPlacement = new THREE.Vector3();  // Instanced for reuse in render method
	
// Trigger to start live image grabbing
var videoGrabbing = new THREEx.WebcamGrabbing(); 
document.body.appendChild(videoGrabbing.domElement);


//		create 3D objects to be rendered on the detected markers
var markerObject3D1023 = new THREE.Object3D();
scene.add(markerObject3D1023);
var markerObject3D = new THREE.Object3D();
scene.add(markerObject3D);
var markerObject3D2 = new THREE.Object3D();
scene.add(markerObject3D2);
var markerObject3D3 = new THREE.Object3D();
scene.add(markerObject3D3);
var markerObject3D4 = new THREE.Object3D();
scene.add(markerObject3D4);
var markerObject3D5 = new THREE.Object3D();
scene.add(markerObject3D5);
var marker1;
var marker1023;

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

var manager = new THREE.LoadingManager();
var loader = new THREE.ThreeMFLoader(manager);
var threemfObjects = [ 'Jupiter.3mf', 'Luna.3mf', 'Marte.3mf', 'shuttle.3mf', 'Tierra.3mf', 'Iss.3mf',];
var objectsInserted = [], indexObjectsInserted = [], count = 0;
var paths = [];
var markers = [];
var t = 0.0;
var newPosition, secondPath = false, isFirstSegmentFinished = false, isSecondSegmentFinished = false, isThirdSegmentFinished = false, isFourthSegmentFinished = false;
var raycasterCrash = new THREE.Raycaster();
var originCrash;
var directionCrash;
var objectCrash;
var crash;

function onMouseClick(event) {
	if(!controls.playvideo){
		mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
		raycaster.setFromCamera( mouse, camera );
		var intersects = [raycaster.intersectObjects(markerObjects[0].children, false), raycaster.intersectObjects(markerObjects[1].children, false), raycaster.intersectObjects(markerObjects[2].children, false), raycaster.intersectObjects(markerObjects[3].children, false), raycaster.intersectObjects(markerObjects[4].children, false)];
		intersects.forEach((item, index) => {
			if(item.length > 0 && objectsInserted.length < 3){
				loader.load('objects/' + threemfObjects[index], function (markerObject) {
					let position = markerObjects[index].position.clone();
					// let scale = markerObjects[index].scale.clone();
					let scale = new THREE.Vector3(45, 45, 45);
					scene.remove(markerObjects[index]);
					markerObjects[index] = markerObject;
					markerObjects[index].position.copy(position);
					markerObjects[index].scale.copy(scale);
					scene.add(markerObjects[index]);
					objectsInserted.push({marker: markers[index], object: markerObjects[index]});
					indexObjectsInserted.push(index);
				});
				count++;
			}
		});
		if(count == 3){
			setTimeout(() => {
				markerObjects.filter(function(item, index) {
					if(!indexObjectsInserted.includes(index)){
						markerObjects[index].visible = false;
					}
				});
				markerObjectsFinal.push(markerObject3D1);
				let mks = [...objectsInserted].sort((a, b) => a.marker.id - b.marker.id);
				mks.forEach((item) => {
					markerObjectsFinal.push(item.object);
				});
				markerObjectsFinal.push(markerObject3D1023);
				objectsInserted.push({marker: marker1, object: markerObject3D1});
				objectsInserted.push({marker: marker1023, object: markerObject3D1023});
				for(var i = 0; i < markerObjectsFinal.length - 1; i++){
					let position1 = markerObjectsFinal[i].position.clone();
					let position2 = markerObjectsFinal[i + 1].position.clone();		
					var lineGeometry = new THREE.Geometry();
					lineGeometry.vertices.push(position1, position2);
					let materialLine = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 10 });
					var line = new THREE.Line(lineGeometry, materialLine);
					scene.add(line);
					paths.push(line);
				}
				loader.load('objects/Satelite.3mf', function (markerObject) {
					let position = markerObject3D1.position.clone();
					let scale = new THREE.Vector3(75, 75, 50)/* markerObject3D1.scale.clone() */;
					scene.remove(markerObject3D1);
					markerObject3D1 = markerObject
					markerObject3D1.position.copy(position);
					markerObject3D1.scale.copy(scale);
					scene.add(markerObject3D1);
					let target = new THREE.Vector3().copy(paths[0].geometry.vertices[1]);
					markerObject3D1.lookAt(target);
					// markerObject3D1.position.z = 100;
				});
			}, 1000);
		}
	}
}

/* 
var material1 = new THREE.MeshLambertMaterial( {color: controls.colormesh1} );
var objLayer1 = new THREE.Object3D();  
markerObject3D.add(objLayer1);
markerObject3D.add(objLayer2);
markerObject3D.add(objLayer3);  // Crea la jerarquía de capas


var loader = new THREE.STLLoader();

// Layer 1

	loader.load( 'Modelos_STL/bulldozer.stl', function ( geometry ) {
	  
		var mesh = new THREE.Mesh(geometry, material1);
		mesh.scale.set(0.02, 0.02, 0.02);
		mesh.rotation.set(  - Math.PI / 2, 0, 0);
		objLayer1.add(mesh);
	} ); */


// Pablo: Third 3D object is associated to marker with id = 200
;(function(){
	let mesh = new THREE.Mesh(new THREE.TorusGeometry(0.5,0.1,8,20), new THREE.MeshBasicMaterial({ color: 0xc77000, wireframe : false } ));
	markerObject3D1.add( mesh );
})()

;(function(){
	let mesh = new THREE.Mesh(new THREE.TorusGeometry(0.5,0.1,8,20), new THREE.MeshBasicMaterial({ color: 0xc77000, wireframe : false } ));
	markerObject3D1023.add( mesh );
})()

;(function(){
		let mesh = new THREE.Mesh(new THREE.TorusGeometry(0.5,0.1,8,20), new THREE.MeshBasicMaterial({ color: 0xc77000, wireframe : false } ));
		markerObject3D.add( mesh );
	})()

// Add 3D objects for 7 markers
;(function(){
		let mesh = new THREE.Mesh(new THREE.TorusGeometry(0.5,0.1,8,20), new THREE.MeshBasicMaterial({ color: 0xc77000, wireframe : false } ));
		markerObject3D2.add( mesh );
	})()

;(function(){
		let mesh = new THREE.Mesh(new THREE.TorusGeometry(0.5,0.1,8,20), new THREE.MeshBasicMaterial({ color: 0xc77000, wireframe : false } ));
		markerObject3D3.add( mesh );
	})()

;(function(){
		let mesh = new THREE.Mesh(new THREE.TorusGeometry(0.5,0.1,8,20), new THREE.MeshBasicMaterial({ color: 0xc77000, wireframe : false } ));
		markerObject3D4.add( mesh );
	})()

;(function(){
		let mesh = new THREE.Mesh(new THREE.TorusGeometry(0.5,0.1,8,20), new THREE.MeshBasicMaterial({ color: 0xc77000, wireframe : false } ));
		markerObject3D5.add( mesh );
	})()

const markerObjects = [markerObject3D, markerObject3D2, markerObject3D3, markerObject3D4, markerObject3D5]
const markerObjectsFinal = [];
const markerObjectsChildrens = [markerObject3D.children, markerObject3D2.children, markerObject3D3.children, markerObject3D4.children, markerObject3D5.children]
markerObject3D1.visible = false;
markerObject3D1023.visible = false;
markerObject3D.visible = false;
markerObject3D2.visible = false;
markerObject3D3.visible = false;
markerObject3D4.visible = false;
markerObject3D5.visible = false;
	
// handle window resize
$( window ).resize(function() {
  renderer.setSize( window.innerWidth, window.innerHeight );
	camera.aspect	= window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
});

// init the marker recognition
var jsArucoMarker	= new THREEx.JsArucoMarker();
jsArucoMarker.videoScaleDown = 2;
// jsArucoMarker.debugEnabled = true; // QUITAR. SOLO PARA DEPURACION


var domElement	= videoGrabbing.domElement;  // Evita invocaciones en bucle de render
// Declaraciones para evitar reinvocaciones en bucle de render
var cualfocallength = 320;

renderer.compile( scene, camera );  // Precompila los shaders antes de comenzar la renderización

// Render loop
function render() { 

if (controls.playvideo != controls.playvideoprev){
	  // Starts or pauses video rendering on screen
		if (controls.playvideo){
		  videoGrabbing.domElement.play(); // Starts rendering
		} else {
		  videoGrabbing.domElement.pause(); // Stops rendering
		}
		controls.playvideoprev = controls.playvideo;
	}
	
	
	if (controls.detectmarkers){
		var mk	= jsArucoMarker.detectMarkers(domElement);
		// Check if are there 7 AR markers
		if(mk.length >= 7){
			mk.forEach(function(marker){
				// Check 1 and 1023 markers exist
				if(marker.id == 1){
					marker1 = marker;
					jsArucoMarker.markerToObject3D(marker, markerObject3D1, cualfocallength);
				}else if(marker.id == 1023){
					marker1023 = marker;
					jsArucoMarker.markerToObject3D(marker, markerObject3D1023, cualfocallength);
				}else if(markers.length < 5){
					markers.push(marker);
				}
			});
			if(marker1 && marker1023){
				// console.log("1 and 1023 markers detected");
				controls.playvideo = false;
				// Add 3D object to every marker detected
				for(var i = 0; i < markers.length; i++){
					if(markers[i].id != 1 && markers[i].id != 1023){
						jsArucoMarker.markerToObject3D(markers[i], markerObjects[i], cualfocallength);
						markerObjects[i].visible = true;
					}
				}
				controls.detectmarkers = false;
			}
		}
	}

	if(controls.start){
		console.log("Starting...");
		var target;
		if (!isFirstSegmentFinished) {
			t += 0.005;
			var newPosition = new THREE.Vector3().lerpVectors(markerObjectsFinal[0].position, markerObjectsFinal[1].position, t);
			markerObject3D1.position.copy(newPosition);
			if (t > 1.0) {
				t = 0.0;
				isFirstSegmentFinished = true;
			}
			/* console.log(objectsInserted);
			console.log(newPosition.x + " - " + newPosition.y);
			console.log(objectsInserted[1].marker.x + " - " + objectsInserted[1].marker.y);
			if (newPosition.x > objectsInserted[1].marker.x && newPosition.y > objectsInserted[1].marker.y) {
				isFirstSegmentFinished = true;
				isSecondSegmentFinished = false;
				t = 0.0;
			 } */
		} else if (!isSecondSegmentFinished) {
			t += 0.005;
			if(controls.rotationx == 0 && controls.rotationy == 0 && controls.rotationz == 0){
				target = new THREE.Vector3().copy(paths[1].geometry.vertices[1]);
				markerObject3D1.lookAt(target);
			}
			var newPosition = new THREE.Vector3().lerpVectors(markerObjectsFinal[1].position, markerObjectsFinal[2].position, t);
			markerObject3D1.position.copy(newPosition);
			if (t > 1.0) {
				t = 0.0;
				isSecondSegmentFinished = true;
			}
		} else if (!isThirdSegmentFinished) {
			t += 0.005;
			if(controls.rotationx == 0 && controls.rotationy == 0 && controls.rotationz == 0){
				target = new THREE.Vector3().copy(paths[2].geometry.vertices[1]);
				markerObject3D1.lookAt(target);
			}
			var newPosition = new THREE.Vector3().lerpVectors(markerObjectsFinal[2].position, markerObjectsFinal[3].position, t);
			markerObject3D1.position.copy(newPosition);
			if (t > 1.0) {
				t = 0.0;
				isThirdSegmentFinished = true;
			}
		} else if (!isFourthSegmentFinished) {
			t += 0.005;
			if (t > 1.0) {
				t = 0.0;
				isFourthSegmentFinished = true;
			}
			if(controls.rotationx == 0 && controls.rotationy == 0 && controls.rotationz == 0){
				target = new THREE.Vector3().copy(paths[3].geometry.vertices[1]);
				markerObject3D1.lookAt(target);
			}
			var newPosition = new THREE.Vector3().lerpVectors(markerObjectsFinal[3].position, markerObjectsFinal[4].position, t);
			markerObject3D1.position.copy(newPosition);
		}else{
			var newPosition = new THREE.Vector3().lerpVectors(markerObjectsFinal[3].position, markerObjectsFinal[4].position, 1);
			markerObject3D1.position.copy(newPosition);
		}
		detectCrash(target);
		
	}else if(controls.restart){
		isFirstSegmentFinished = false, isSecondSegmentFinished = false, isThirdSegmentFinished = false, isFourthSegmentFinished = false;
		newPosition = new THREE.Vector3().lerpVectors(markerObjectsFinal[0].position, markerObjectsFinal[1].position, t);
		markerObject3D1.position.copy(newPosition);
		let target = new THREE.Vector3().copy(paths[0].geometry.vertices[1]);
		markerObject3D1.lookAt(target);
		t = 0;
	}
	
	
	camera.updateMatrixWorld();
	axesPlacement = camera.localToWorld(localToCameraAxesPlacement.clone());
	axes.position.copy(axesPlacement);
	
	requestAnimationFrame( render );
	stats.update();
	renderer.domElement.addEventListener('click', onMouseClick);
	
	renderer.render( scene, camera ); 
}

function detectCrash(target) {
	console.log(markerObject3D1);
	console.log(markerObjectsFinal);
	raycaster.setFromCamera( markerObject3D1, camera );
	crash = raycaster.intersectObjects(markerObjectsFinal[1].children);
	console.log(crash);
	if (crash.length > 0) {
		console.log("Colisioooon");
		// ¡Se ha detectado una colisión!
		// Aquí puedes realizar las acciones necesarias, como ajustar la velocidad del satélite o realizar otras operaciones.
	  }

}


render();

	