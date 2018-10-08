// This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
var videoLink = 'xGRjCa49C6U';
var videoPos = 5;
var videoLinkNum = 0;
// This function creates an <iframe> (and YouTube player)
// after the API code downloads.
var player;
var playerHeight = 1800;
var playerWidth = 3200;

var os = require('os');
var Kinect2 = require('kinect2');
var kinect = new Kinect2();
var canvas = null;
var DEPTHWIDTH = 0;
var DEPTHHEIGHT = 0;
var currentCamera = null;
var sendAllBodies = false;
var x = 0;
var y = 0;
var  img = null;  // Load the image
var X = 0.0;
var Y = 0.0;
var Z = 0.0;
var sizeP = 2;
var scaleZ =0.8;
var scalePow = 1.2;
var startSec = 30;
var handPos = [];

// Setup AWS IoT
const myWindow = require('./myWindow')
var self = this
		
// Key Tracking needs cleanup
var trackedBodyIndex = -1;
window.addEventListener('load', init);

function init() {
  window.scrollTo($(window).width()/2, $(window).height()/2);
  chooseCamera();
  myWindow.setup();
}

function updateWindowScroll(X,Y,Z)
{
	var rect = document.getElementById("player").getBoundingClientRect();
	if(((rect.top + Math.abs(2*Y*100*1/(Z*Math.pow(scaleZ,scalePow))))*((1/(Z*Math.pow(scaleZ,scalePow)))) < -15) && ((rect.bottom + Math.abs(2*Y*100*1/(Z*Math.pow(scaleZ,scalePow)))) < playerHeight+15))
	{
		window.scrollTo((playerWidth-$(window).width())/2 + X*100*1/(Z*Math.pow(scaleZ,scalePow)),(playerHeight-$(window).height())/2 - Y*100*1/(Z*Math.pow(scaleZ,scalePow)));
		document.getElementById("player").style.transform="scale("+String(1/(Z*Math.pow(scaleZ,scalePow)))+")";
	}
}

function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: String(playerHeight),
    width: String(playerWidth),

	 playerVars: {
            'controls': 0,
            'showinfo': 0,
            'rel': 0
          },

    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

// Listener for IoT event
myWindow.onMessage(function(topic, payload) {
      if (topic === myWindow.TOPIC_TEXT) {
		console.log("HERE: "+payload);
		var payloadArray = payload.split(" ");
		var i = 0;
		var j = 0;
	    for(i = 0; i < payloadArray.length; i++)
		{
			for(j = 0; j < videos.length; j++)
			{
				if(videos[j].label.includes(payloadArray[i]))
				{
					videoLinkNum = Math.floor(Math.random() * videos[j].links.length);
					videosPos = videos[j].pos;
					videoLink = videos[j].links[videoLinkNum];
					videoLoadandPlay();
					break;
				}
			}
		}
      } 
});

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
	player.loadVideoById({'videoId': videoLink,
							 'suggestedQuality': 'highres',
				 		 	 'startSeconds': startSec,
				 });
  event.target.setPlaybackQuality('highres');
  event.target.playVideo();
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        player.playVideo();
    }
}

function videoLoadandPlay(){
	$('#player').fadeOut(1000,function(){					
		player.loadVideoById({'videoId': videoLink,
			 'suggestedQuality': 'highres',
			 'startSeconds': startSec,
					 });
		
		player.playVideo();						
		$('#player').fadeIn(1000);
	});
}
////////////////////////////////////////////////////////////////////////
//////////////////////////// Feed Choice //////////////////////////////
function chooseCamera() {
  var camera = "skeleton";
  if (currentCamera) {
    changeCameraState(currentCamera, 'stop');
    toggleFeedDiv(currentCamera, "none");
  }
  changeCameraState(camera, 'start');
  toggleFeedDiv(camera, "block");
  currentCamera = camera;
}

function toggleFeedDiv(camera, state) {
  var divId = "skeleton"+ "-div";
  var feedDiv = document.getElementById(divId);
}

function changeCameraState(camera, state) {
  var cameraCode = 'SkeletonTracking';
  var changeStateFunction;
  sendAllBodies = false;
  changeStateFunction = window[state + cameraCode];
  changeStateFunction();
}

////////////////////////////////////////////////////////////////////////
//////////////////////////// Kinect2 Frames ////////////////////////////
function startSkeletonTracking() {
  //resetCanvas('depth');
  canvasState = 'depth';

  if(kinect.open()) {
    kinect.on('bodyFrame', function(bodyFrame){
      if(sendAllBodies) {
        sendToPeer('bodyFrame', bodyFrame);
        if (doRecord) {
          bodyFrame.record_startime = recordStartTime;
          bodyFrame.record_timestamp = Date.now() - recordStartTime;
          bodyChunks.push(bodyFrame);
        }
      }

      //skeletonContext.clearRect(0, 0, skeletonCanvas.width, skeletonCanvas.height);
      var index = 0;
      bodyFrame.bodies.forEach(function(body){
        if(body.tracked && (index == getClosestBodyIndex(bodyFrame.bodies))) {
          drawSkeleton(body, index);
        }
        index++;
      });
    });
    kinect.openBodyReader();
      }
}

function stopSkeletonTracking() {
  kinect.closeBodyReader();
  kinect.removeAllListeners();
  canvasState = null;
}

function setImageData() {
  imageData = context.createImageData(canvas.width, canvas.height);
  imageDataSize = imageData.data.length;
  imageDataArray = imageData.data;
}

function resetCanvas(size) {
  context.clearRect(0, 0, canvas.width, canvas.height);
  //outputContext.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
  canvas.width = DEPTHWIDTH;
  canvas.height = DEPTHHEIGHT;
}

function getClosestBodyIndex(bodies) {
  var closestZ = Number.MAX_VALUE;
  var closestBodyIndex = -1;
  for(var i = 0; i < bodies.length; i++) {
    if(bodies[i].tracked && bodies[i].joints[Kinect2.JointType.spineMid].cameraZ < closestZ) {
      closestZ = bodies[i].joints[Kinect2.JointType.spineMid].cameraZ;
      closestBodyIndex = i;
    }
  }
  return closestBodyIndex;
}

function calculateLength(joints) {
  var length = 0;
  var numJoints = joints.length;
  for(var i = 1; i < numJoints; i++) {
    length += Math.sqrt(Math.pow(joints[i].colorX - joints[i-1].colorX, 2) + Math.pow(joints[i].colorY - joints[i-1].colorY, 2));
  }
  return length;
}

function calculatePixelWidth(horizontalFieldOfView, depth) {
  // measure the size of the pixel
  var hFov = horizontalFieldOfView / 2;
  var numPixels = canvas.width / 2;
  var T = Math.tan((Math.PI * 180) / hFov);
  var pixelWidth = T * depth;
  return pixelWidth / numPixels;
}

function drawSkeleton(body, index) {
  // Skeleton variables
  var colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff'];
  //draw joints
  var jointType = 3;
  var joint = body.joints[jointType];
  //console.log("X:"+parseInt(joint.cameraX*1000000)/1000000+" ,Y:"+parseInt(joint.cameraY*1000000)/1000000+" ,Z:"+parseInt(joint.cameraZ*1000000)/1000000)
  X = Math.round(parseInt(joint.cameraX*1000000))/1000000;
  Y = Math.round(parseInt(joint.cameraY*1000000))/1000000;
  Z = Math.round(parseInt(joint.cameraZ*1000000))/1000000;
  
  updateHandState(X, body.rightHandState, body.joints[Kinect2.JointType.handRight]);
  updateWindowScroll(X,Y,Z);
}

function updateHandState(headJoint, handState, jointPoint) {
  if (handState == Kinect2.HandState.open) {
	  handPos.push(Math.round(parseInt(jointPoint.cameraX*1000000))/1000000);
	  if(handPos.length > 1)
	  {
		//console.log(headJoint);
		var i;
		var j = 0;
		for (i = 0; i < handPos.length - 1; i++) { 
			switch(checkConsist(headJoint, handPos[i], handPos[i+1])){
				case 1:	
					
					//videoLink = "CUaybv1jdHw";
					console.log("swipe right");					
					if(videoLinkNum ==  (videos[videoPos].links.length-1))
					{
						videoLinkNum = 0;
					}	
					else
					{
						videoLinkNum = videoLinkNum + 1;
						
					}	
					videoLink = videos[videoPos].links[videoLinkNum];
					videoLoadandPlay();
					handPos = [];
					break;
				case -1:
					console.log("swipe left");	
					if(videoLinkNum == 0)
					{
						videoLinkNum = videos[videoPos].links.length-1;
					}	
					else
					{
						videoLinkNum = videoLinkNum - 1;
						
					}						
					videoLink = videos[videoPos].links[videoLinkNum];
					videoLoadandPlay();
					handPos = [];
					break;
				default:
					break;
			}
		}		
	  }
  }
  else
  {
	  handPos = [];
  }
}

// check to see if the hand swipes are detected using coordinates
function checkConsist(head, num1, num2) {
	if(((num1 > head) && (num2 > head)) || ((num1 < head) && (num2 < head)))
	{
		return 0;
	}
	else
	{
		if(num1 > num2)
		{
			return -1;
		}
		else
		{
			return 1;
		}
	}
}
