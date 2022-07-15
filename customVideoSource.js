const paramsString = document.location.search;
const searchParams = new URLSearchParams(paramsString);
const p2pid=searchParams.get("p");
const rpid=searchParams.get("r");

var peer;
var conn;
var peerConnection;
var canv;
var ctx;

$.get('https://www.cloudflare.com/cdn-cgi/trace', function(data) {
  // Convert key-value pairs to JSON
  // https://stackoverflow.com/a/39284735/452587
  data = data.trim().split('\n').reduce(function(obj, pair) {
    pair = pair.split('=');
    return obj[pair[0]] = pair[1], obj;
  }, {});
  document.getElementById("location").textContent = data.loc;
  document.getElementById("ip").textContent = data.ip;
});

if (rpid)
	peer= new Peer(p2pid);
else
	peer= new Peer();

var currentCall;
peer.on("open", function (id) {
  document.getElementById("uuid").textContent = id;
  if (!rpid) {
	  canv=document.getElementById("canvas");
          ctx=document.getElementById("canvas").getContext('2d');
	  document.getElementById("connect").style.display='inline-block';
	  document.getElementById("canvas").style.display='inline-block';
	  document.getElementById("localv").style.display='inline-block';
	  setInterval(clock,50);
  }
});

peer.on('connection', function(conn) { 
	conn.on('open', function() {
		conn.on('data', function(data) {
		  console.log('Received', data);
		});
	        conn.send("H1");
  	});
});


peer.on("call", async (call) => {

	var mstream=await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        call.answer(mstream);
        currentCall = call;
        call.on("stream", (remoteStream) => {
          document.getElementById("received-video").srcObject = remoteStream;
          document.getElementById("received-video").play();
	  var stream=document.getElementById("received-video").captureStream(30);
          var newTrack=stream.getVideoTracks()[0];
          currentCall.peerConnection.getSenders()[1].replaceTrack(newTrack);
        });
});

                function clock(){
                        ctx.font = '200px serif';
                        var d = new Date();
                        ctx.clearRect(0,0,1280,720);
                        ctx.fillStyle = "#ec9706";
                        ctx.font = "200px Arial";
                        ctx.fillText( d.toLocaleTimeString()+"."+d.getMilliseconds(), 30, 400);
                }


function switchUp(){
	setStream();
	var newTrack=lstream.getVideoTracks()[0];
	currentCall.peerConnection.getSenders()[1].replaceTrack(newTrack);
}
function switchUp2(){
	var stream=document.getElementById("received-video").captureStream(30);
	var newTrack=stream.getVideoTracks()[0];
	currentCall.peerConnection.getSenders()[1].replaceTrack(newTrack);
}

function endCall() {
    if (!currentCall) return;
  // Close the call, and reset the function
    try {
      currentCall.close();
    } catch {}
    currentCall = undefined;
  }

var client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
var localTracks = {
  videoTrack: null,
  audioTrack: null
};

var remoteUsers = {};

var options = {
  appid: null,
  channel: null,
  uid: null,
  token: null
};

  options.appid = "20b7c51ff4c644ab80cf5a4e646b0537";
  options.channel = p2pid; //"peer";


var lstream;
function setStream() {
	lstream=document.getElementById("canvas").captureStream(30);
}

async function join() {
  client.on("user-published", handleUserPublished);
  client.on("user-unpublished", handleUserUnpublished);

  //localTracks.audioTrack =  await AgoraRTC.createMicrophoneAudioTrack();
  [options.uid, localTracks.videoTrack ] = await Promise.all([
  // Join the channel.
  client.join(options.appid, options.channel, options.token || null, options.uid || null),
  // Create tracks to the customized video source.
  AgoraRTC.createCustomVideoTrack({mediaStreamTrack:lstream.getVideoTracks()[0]})
  ]);
  await client.publish(localTracks.videoTrack);
}

async function join2() {

  client.on("user-published", handleUserPublished);
  client.on("user-unpublished", handleUserUnpublished);

  options.uid=await  client.join(options.appid, options.channel, options.token || null, options.uid || null);
  //await client.publish(Object.values(localTracks));
  //localTracks.videoTrack.play("local-player");
}


async function subscribe(user, mediaType) {
  const uid = user.uid;
  await client.subscribe(user, mediaType);
  if (mediaType === 'video') {
    await user.videoTrack.play("received-video-agora");
  }
  if (mediaType === 'audio') {
    user.audioTrack.play();
  }
	ret();
}

async function ret() {
  if (rpid){
	  var el=document.getElementsByClassName('agora_video_player')[0];
          var stream=el.captureStream(30);
	  var track=AgoraRTC.createCustomVideoTrack({mediaStreamTrack:stream.getVideoTracks()[0]});
  await client.publish(track);
  }

}
function handleUserPublished(user, mediaType) {
  const id = user.uid;
  remoteUsers[id] = user;
  subscribe(user, mediaType);
}

function handleUserUnpublished(user, mediaType) {
  if (mediaType === 'video') {
  }
}

function connect() {
  setStream();
	setupP2P();
	join(); // Agora 1
}

  if (rpid) {
	  join2();
  }
async function setupP2P() {
  const call = peer.call(p2pid, lstream);
	call.on("stream", (stream) => {
    document.getElementById("received-video").srcObject = stream;
    document.getElementById("received-video").play();
  });
  call.on("data", (stream) => {
    document.querySelector("#received-video").srcObject = stream;
  });
  call.on("error", (err) => {
    console.log(err);
  });
  call.on('close', () => {
    endCall()
  })
  currentCall = call;
}
