const paramsString = document.location.search;
const searchParams = new URLSearchParams(paramsString);
const p2pid=searchParams.get("channel");
let rpid=searchParams.get("r");

if (rpid && (rpid=='false' || rpid=='0')) {
	rpid=null;
}

var peer;
var conn;
var peerConnection;
var canv;
var ctx;
var loc;
$.get('https://www.cloudflare.com/cdn-cgi/trace', function(data) {
  // Convert key-value pairs to JSON
  // https://stackoverflow.com/a/39284735/452587
  data = data.trim().split('\n').reduce(function(obj, pair) {
    pair = pair.split('=');
    return obj[pair[0]] = pair[1], obj;
  }, {});
  document.getElementById("location").textContent = data.loc;
  document.getElementById("ip").textContent = data.ip;
	loc= data.loc;

});

let p2pids=p2pid+(100+Math.floor(Math.random() * 100));
let p2pice="{ config: { 'iceServers': [ { 'url': 'stun:stun.l.google.com:19302' } ] , trickle: true}, trickle: true }"
if (rpid)
	peer= new Peer(p2pid,p2pice);
else
	peer= new Peer(p2pids,p2pice);

var currentCall;
peer.on("open", function (id) {
  document.getElementById("uuid").textContent = id;
  if (!rpid ) {
	  document.getElementById("connect").style.display='inline-block';
	  document.getElementById("canvas").style.display='inline-block';
	  document.getElementById("localv").style.display='inline-block';
  }
	  canv=document.getElementById("canvas");
          ctx=document.getElementById("canvas").getContext('2d');
	  setInterval(clock,33);
});

peer.on('connection', function(conn) { 
	conn.on('open', function() {
		conn.on('data', function(data) {
		  console.log('Received', data);
		});
	        conn.send("loc:"+loc);
  	});
});


peer.on("call", async (call) => {
	//var mstream=await navigator.mediaDevices.getUserMedia({ video: false, audio: false });
	setStream();
        call.answer(lstream);
        //call.answer(mstream);
        currentCall = call;
        call.on("stream", (remoteStream) => {
          document.getElementById("received-video").srcObject = remoteStream;
          document.getElementById("received-video").play();
	  var stream=document.getElementById("received-video").captureStream(30);
          var newTrack=stream.getVideoTracks()[0];
          //currentCall.peerConnection.getSenders()[1].replaceTrack(newTrack);
          currentCall.peerConnection.getSenders()[0].replaceTrack(newTrack);
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
	conn = peer.connect(p2pid);
        conn.on('open', function() {
                conn.on('data', function(data) {
                  console.log('Received', data);
			if (data.indexOf("loc:")>-1) {
			document.getElementById("remloc").textContent = data.substring(4);
			}
                });
                conn.send("H2");
        });

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

    async function getStats() {
              await client._p2pChannel.connection.peerConnection.getStats().then(async stats => {
                await stats.forEach(report => {                
                  if (report.type === "inbound-rtp" && report.kind === "video") {
                    var now = Date.now();
                    var nack = report["nackCount"];
                    var fps = report["framesPerSecond"];
                    var packetsLost = report["packetsLost"];
                    var bytesReceived = report["bytesReceived"];
                    var packetsReceived = report["packetsReceived"];
        	    document.getElementById("statsc2").textContent = "fps: "+fps+", nack:"+nack+", lost:"+packetsLost+", MB:"+Math.floor(bytesReceived/1000000);
		  }
		})
	      })

              await currentCall.peerConnection.getStats().then(async stats => {
                await stats.forEach(report => {                
                  if (report.type === "inbound-rtp" && report.kind === "video") {
                    var now = Date.now();
                    var nack = report["nackCount"];
                    var fps = report["framesPerSecond"];
                    var packetsLost = report["packetsLost"];
                    var bytesReceived = report["bytesReceived"];
                    var packetsReceived = report["packetsReceived"];
        	    document.getElementById("statsb2").textContent = "fps: "+fps+", nack:"+nack+", lost:"+packetsLost+", MB:"+Math.floor(bytesReceived/1000000);
		  }
		})
	      })
    }


    function getMS(parsedDate){
	var tokens = parsedDate.split(".");
	var ms=tokens[1]*1;
	tokens=tokens[0].split(":");
	var hms=tokens[0]*60*60*1000;
	var mms=tokens[1]*60*1000;
	var sms=tokens[2]*1000;
	return ms+hms+mms+sms;
    }

    const { createWorker, createScheduler } = Tesseract;
    const scheduler = createScheduler();
    const video = document.getElementById('poem-video');
    const messages = document.getElementById('messages');

    let timerId = null;
    let samplecount=0;
    let p2p_total=0;
    let agora_total=0;

    const doOCR = async () => {
      const c = document.getElementById('canvas');

      let video=document.getElementById('received-video');
      const c2 = document.createElement('canvas');
      c2.width = 1280;
      c2.height = 720;
      if (video && !video.paused) {
      	c2.getContext('2d').drawImage(video, 0, 0, 1280, 720);
      }

      video=document.getElementsByClassName('agora_video_player')[0];
      const c3 = document.createElement('canvas');
      c3.width = 1280;
      c3.height = 720;
      if (video && !video.paused) {
      	c3.getContext('2d').drawImage(video, 0, 0, 1280, 720);
      }

      var ms_local=-1;
      var ms_p2p=-1;
      var ms_agora=-1;

      let ocr = await scheduler.addJob('recognize', c);
      if (ocr.data && ocr.data.text) {
	      ocr.data.text.split('\n').forEach((line) => {
	      if (line.length>4) {
		      ms_local=getMS(line);
		}
	      });
      }

      ocr = await scheduler.addJob('recognize', c2);
      if (ocr.data && ocr.data.text) {
	      ocr.data.text.split('\n').forEach((line) => {
		if (line.length>4) {
		      ms_p2p=getMS(line);
		}
	      });
      }

      ocr = await scheduler.addJob('recognize', c3);
      if (ocr.data && ocr.data.text) {
	      ocr.data.text.split('\n').forEach((line) => {
		if (line.length>4) {
		      ms_agora=getMS(line);
		}
	      });
      }
     if (isNaN(ms_local)) {
             ms_local=-1;
     }

     if (isNaN(ms_p2p)) {
             ms_p2p=-1;
     }

     if (isNaN(ms_agora)) {
             ms_agora=-1;
     }

     console.log("ms_local",ms_local,"ms_p2p",ms_p2p,"ms_agora",ms_agora, "ms_local-ms_agora", ms_local-ms_agora, "ms_local-ms_p2p", ms_local-ms_p2p);
    if (ms_local>-1 && ms_p2p>-1 && ms_agora>-1) {
        samplecount++;
        p2p_total=(ms_local-ms_p2p)+p2p_total;
        agora_total=(ms_local-ms_agora)+agora_total;
        document.getElementById("statsb").textContent = "Average round trip duration: "+Math.floor(p2p_total/samplecount)+" ms";
        document.getElementById("statsc").textContent = "Average round trip duration: "+Math.floor(agora_total/samplecount)+" ms";
	getStats();
    }
    };

    (async () => {
      if (!rpid ) {
      for (let i = 0; i < 4; i++) {
        const worker = createWorker();
        await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        scheduler.addWorker(worker);
      }
      timerId = setInterval(doOCR, 2000);
      }
    })();


