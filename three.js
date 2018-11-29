var camera, scene, renderer, controls, scenery, windowFrame;
var tubeWidth = 30,
  tubeFaceNum = 3,
  stretch = 0,
  initalScenePos = -700;
var frameSides = 4,
  frameTexture,
  frameNormalMap,
  frameBumpMap;
var currentVid = "xGRjCa49C6U";
/*
 * Scenery() creates an object of an iframe "scene" using youtube API 
 * id gives the id of the video
 * x, y, z are positions of the scene
 */
var Scenery = function(id, x, y, z, live) {
  var div = document.createElement("div");
  div.style.width = window.outerWidth * 2;
  div.style.height = window.outerHeight * 2;
  div.style.backgroundColor = "#000";
  var iframe = document.createElement("iframe");
  iframe.style.width = "2880px";
  iframe.style.height = "2160px";
  iframe.style.border = "0px";
  if(live){
	  iframe.src = id;
  }
  else{
	  iframe.src = [
		"https://www.youtube.com/embed/",
		id,
		"?autoplay=1",
		"&mute=1"
	  ].join("");
  }

  div.appendChild(iframe);
  var object = new THREE.CSS3DObject(div);
  object.position.set(x, y, z);
  return object;
};
/*
 * TorusFrame() is the main Frame of the Window
 * x, y, z are positions of the window
 */
var TorusFrame = function(x, y, z) {
  var geometry = new THREE.TorusGeometry(1, tubeWidth, tubeFaceNum, frameSides);
  var materials = [
    new THREE.MeshPhongMaterial({
      map: new THREE.TextureLoader().load(
        "https://static.vecteezy.com/system/resources/previews/000/125/950/non_2x/vector-wood-texture.jpg"
      ),
      side: THREE.DoubleSide,
      bumpMap: new THREE.TextureLoader().load(
        "https://static.vecteezy.com/system/resources/previews/000/125/950/non_2x/vector-wood-texture.jpg"
      ),
      normalMap: new THREE.TextureLoader().load(
        "https://static.vecteezy.com/system/resources/previews/000/125/950/non_2x/vector-wood-texture.jpg"
      ),
      flatShading: THREE.SmoothShading
    })
  ];
  winframe = new THREE.Mesh(geometry, materials);
  winframe.position.set(x, y, z);
  winframe.recieveShadow = true;
  winframe.castShadow = true;

  return winframe;
};
/*
 * BarFrame() is the bars in a window frame
 * x, y, z are positions of the bar frame
 */
var BarFrame = function(x, y, z) {
  bar = new THREE.Mesh(
    new THREE.BoxGeometry(tubeWidth / 2, tubeWidth, tubeWidth * 1.3),
    new THREE.MeshPhongMaterial({
      map: new THREE.TextureLoader().load(
        "https://static.vecteezy.com/system/resources/previews/000/125/950/non_2x/vector-wood-texture.jpg"
      ),
      side: THREE.DoubleSide,
      bumpMap: new THREE.TextureLoader().load(
        "https://static.vecteezy.com/system/resources/previews/000/125/950/non_2x/vector-wood-texture.jpg"
      ),
      normalMap: new THREE.TextureLoader().load(
        "https://static.vecteezy.com/system/resources/previews/000/125/950/non_2x/vector-wood-texture.jpg"
      ),
      flatShading: THREE.SmoothShading
    })
  );
  bar.position.set(x, y, z);
  bar.recieveShadow = true;
  bar.castShadow = true;

  return bar;
};
/*
 * Frame() is the combination of the TorusFrame and BarFrame and Wall()
 * x, y, z are positions of the window
 */
var Frame = function(x, y, z) {
  var torusFrame = new TorusFrame(x, y, z);
  var torusData = {};

  var barFrame = new BarFrame(x, y, z);
  var barVerticesY = [];
  for (var j = 0; j < 8; j++) {
    barVerticesY.push(barFrame.geometry.vertices[j].y);
  }

  data = rotateTorus(torusData, torusFrame, tubeFaceNum, frameSides);
  var dist = camera.position.z - data.depth;

  var widthChange = changedWidth(dist);
  var heightChange = changedHeight(dist);

  stretchTorusFrame(
    torusFrame,
    widthChange,
    heightChange,
    data.verticesX,
    data.verticesY
  );

  stretchBarFrame(barFrame, barVerticesY, heightChange);

  var group = new THREE.Group();
  group.add(torusFrame);
  group.add(barFrame);
  group.add(new Wall(dist));
  return group;
};
/*
 * Light() Gives light to the frame
 */
var Light = function() {
  var group = new THREE.Group();
  // White directional light at half intensity shining from the top.
  var directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
  directionalLight.position.set(5, -10, 15);
  scene.add(directionalLight);

  var spotLight = new THREE.PointLight(0xffffff, 1, 100);
  spotLight.castShadow = true;
  var ambiLight = new THREE.AmbientLight(0xffffff, 0.3, 10);
  scene.add(spotLight);
  spotLight.position.x = 0;
  spotLight.position.y = 30;
  spotLight.position.z = -40;
  group.add(directionalLight);
  group.add(ambiLight);
  group.add(spotLight);
  return group;
};
/*
 * Wall() Creates a wall around the frame
 * dist is the distance from camera to wall
 */
var Wall = function(dist) {
  var torusData = {};
  var geometry = new THREE.TorusGeometry(30, 1, 2, 4);
  var material = new THREE.MeshPhongMaterial({ color: 0xffe8bb });
  var wall = new THREE.Mesh(geometry, material);
  var data = rotateTorus(torusData, wall, 2, 4);

  var h = changedHeight(dist);
  var w = changedWidth(dist);
  var i = 1;

  for (var j = 0; j < 4; j += 2) {
    wall.geometry.vertices[j].x = i * window.outerWidth;
    wall.geometry.vertices[j + 4].x += i * w;
    wall.geometry.vertices[j].y = -i * window.outerHeight;
    wall.geometry.vertices[j + 4].y = -i * h;
    wall.geometry.vertices[j + 1].x = i * window.outerWidth;
    wall.geometry.vertices[j + 5].x += i * w;
    wall.geometry.vertices[j + 1].y = i * window.outerHeight;
    wall.geometry.vertices[j + 5].y = i * h;
    i = -1;
  }

  return wall;
};
// functions to be called

/*
 * main function
 */
function initial() {
  var container = document.getElementById("parent_frame");
  camera = new THREE.PerspectiveCamera(
    50,
    window.outerWidth / window.outerHeight,
    1,
    5000
  );
  camera.position.set(0, 0, 600);
  scene = new THREE.Scene();
  scene.add(camera);
  // CSS3D
  renderer1 = new THREE.CSS3DRenderer();
  renderer1.setSize(window.outerWidth, window.outerHeight);
  renderer1.domElement.style.position = "absolute";
  renderer1.domElement.style.top = 0;
  container.appendChild(renderer1.domElement);

  // WEBGL
  renderer2 = new THREE.WebGLRenderer({ alpha: true });
  renderer2.setSize(window.outerWidth, window.outerHeight);
  renderer2.setClearColor(0x000000, 0);
  renderer2.domElement.style.position = "absolute";
  renderer2.shadowMap.enabled = true;
  renderer2.shadowMap.type = THREE.BasicShadowMap;
  document.getElementById("parent_frame").appendChild(renderer2.domElement);

  scenery = new Scenery(currentVid, 0, 0, initalScenePos, 0);
  windowFrame = new THREE.Group();
  windowFrame.add(new Frame(0, 0, 0));
  windowFrame.add(new Light());
  scene.add(scenery);
  scene.add(windowFrame);

  window.addEventListener("resize", onWindowResize, false);
}
/*
 * Rotates the torus to a square shape (rather than diamond)
 * returns nearest depth of the torus
 */
function rotateTorus(data, torus, tubeFaceNum, frameSides) {
  var theta = Math.PI / 4;
  var depth = 0;
  var verticesX = [],
    verticesY = [];
  for (var j = 0; j < tubeFaceNum * frameSides; j++) {
    var tempx =
      Math.cos(theta) * torus.geometry.vertices[j].x +
      Math.sin(theta) * torus.geometry.vertices[j].y;
    var tempy =
      -Math.sin(theta) * torus.geometry.vertices[j].x +
      Math.cos(theta) * torus.geometry.vertices[j].y;
    torus.geometry.vertices[j].x = tempx;
    torus.geometry.vertices[j].y = tempy;
    verticesX.push(torus.geometry.vertices[j].x);
    verticesY.push(torus.geometry.vertices[j].y);

    if (depth < torus.geometry.vertices[j].z) {
      depth = torus.geometry.vertices[j].z;
    }
  }
  data.depth = depth;
  data.verticesX = verticesX;
  data.verticesY = verticesY;
  return data;
}
/*
 * Returns the height of the view plane given the distance of the camera to plane
 */
function changedHeight(dist) {
  var vFov = camera.fov * Math.PI / 180;
  var planeHeightAtDist = 2 * Math.tan(vFov / 2) * dist;
  var planeWidthAtDist = planeHeightAtDist * camera.aspect;
  var heightChange = planeHeightAtDist / 2 - tubeWidth / 1.5;
  return heightChange;
}
/*
 * Returns the width of the view plane given the distance of the camera to plane
 */
function changedWidth(dist) {
  var vFov = camera.fov * Math.PI / 180;
  var planeHeightAtDist = 2 * Math.tan(vFov / 2) * dist;
  var planeWidthAtDist = planeHeightAtDist * camera.aspect;
  var widthChange = planeWidthAtDist / 2 - tubeWidth / 1.5;
  return widthChange;
}
/*
 * stretches the torus(winframe) with verticesX and verticesY to widthChange and heightChange
 */
function stretchTorusFrame(
  winframe,
  widthChange,
  heightChange,
  verticesX,
  verticesY
) {
  var i = 1;
  for (var j = 0; j < tubeFaceNum * frameSides; j += 2) {
    winframe.geometry.vertices[j].x = verticesX[j] + widthChange * i;
    winframe.geometry.vertices[j + 1].x = verticesX[j + 1] + widthChange * i;
    winframe.geometry.vertices[j + 1].y = verticesY[j + 1] + heightChange * i;
    i *= -1;
    winframe.geometry.vertices[j].y = verticesY[j] + heightChange * i;
  }
  var i = 1;
  for (var j = 0; j < frameSides; j += 2) {
    winframe.geometry.vertices[j].x += stretch * i;
    winframe.geometry.vertices[j].y += stretch * -i;
    winframe.geometry.vertices[j + 1].x += stretch * i;
    winframe.geometry.vertices[j + 1].y += stretch * i;
    i = -1;
  }
}
/*
 * stretches the bar frame to the height of the view plane 
 */
function stretchBarFrame(bar, barVerticesY, heightChange) {
  bar.geometry.vertices[0].y = barVerticesY[0] + heightChange - tubeWidth / 2;
  bar.geometry.vertices[1].y = barVerticesY[1] + heightChange - tubeWidth / 2;
  bar.geometry.vertices[4].y = barVerticesY[4] + heightChange - tubeWidth / 2;
  bar.geometry.vertices[5].y = barVerticesY[5] + heightChange - tubeWidth / 2;
  bar.geometry.vertices[6].y = barVerticesY[6] - heightChange + tubeWidth / 2;
  bar.geometry.vertices[7].y = barVerticesY[7] - heightChange + tubeWidth / 2;
  bar.geometry.vertices[2].y = barVerticesY[2] - heightChange + tubeWidth / 2;
  bar.geometry.vertices[3].y = barVerticesY[3] - heightChange + tubeWidth / 2;
}
/*
 * resets the window size on the call onWindowResize()
 */
function onWindowResize() {
  camera.aspect = window.outerWidth / window.outerHeight;
  camera.updateProjectionMatrix();
  renderer1.setSize(window.outerWidth, window.outerHeight);
  renderer2.setSize(window.outerWidth, window.outerHeight);
}
/*
 * updates the renderes and objects (location...)
 */
function animate() {
  requestAnimationFrame(animate);
  update();
  //controls.update();
  renderer1.render(scene, camera);
  renderer2.render(scene, camera);
}
// Game Logic
function update() {
  var time = Date.now() * 0.0005;
  var scale = 1;
  var X = localStorage.getItem("X") * scale;
  var Y = localStorage.getItem("Y") * scale;
  var Z = localStorage.getItem("Z") * scale;
  

  if (X != null && Y != null && Z != null) {
	windowFrame.lookAt(-X,-Y,Z*15);	
	scenery.position.set(-X*200, -Y*200, initalScenePos+Z*100);
  }
  
  var liveVid = localStorage.getItem("videoLive");
  var notLiveVid = localStorage.getItem("videoNotLive");
  
  if (liveVid != "null") {
	  if(currentVid != liveVid){
	    console.log("l:"+liveVid+" vs "+ currentVid);	
		currentVid = liveVid;	
		localStorage.setItem('videoLive',null);	  
		localStorage.setItem('videoNotLive',null);
	  }
	scene.remove( scenery );  
	scenery = new Scenery(currentVid, 0, 0, initalScenePos, 1);
	scene.add(scenery);
  }
  if (notLiveVid != "null") { 
	  if(currentVid != notLiveVid){ 
	    console.log("n:"+notLiveVid+" vs "+ currentVid);
		currentVid = notLiveVid;	
		localStorage.setItem('videoLive',null);	
		localStorage.setItem('videoNotLive',null);
	  }
	scene.remove( scenery );
	scenery = new Scenery(currentVid, 0, 0, initalScenePos, 0);
	scene.add(scenery);
  }
  
}