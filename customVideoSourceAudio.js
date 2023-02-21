const paramsString = document.location.search;
const searchParams = new URLSearchParams(paramsString);
const p2pid = searchParams.get("channel");

let rpid = searchParams.get("r");
let usewebcam = searchParams.get("w");

if (rpid && (rpid == 'false' || rpid == '0')) {
  rpid = null;
}
if (usewebcam && (usewebcam == 'false' || usewebcam == '0')) {
  usewebcam = null;
}

var myvideo = document.createElement('video');
const constraints = {
  video: { width: 1280, height: 720 },
  audio: true
};

var peer;
var conn;
var peerConnection;
var canv;
var ctx;
var loc;

var start_p;
var end_p;
var start_a;
var end_a;

var br_a = {
  br: 0,
  brtime: 0
}

var br_p = {
  br: 0,
  brtime: 0
}

var rendervol_a = {
  renderFrameRate: 0,
  renderRateMean: 0,
  renderRateStdDeviation: 0,
  renderRateStdDeviationPerc: 0,
  renderRateStdDeviationPercMax: 0,
  renderRateStdDeviationPercSum: 0,
  renderRateStdDeviationPercAvg: 0,
  renderRateStdDeviationPercCount: 0,
  jittersum: 0,
  jittercount: 0,
  jitteravg: 0,
  jittermax: 0,
  renderRates: []
}


var rendervol_p = {
  renderFrameRate: -1,
  renderRateMean: 0,
  renderRateStdDeviation: 0,
  renderRateStdDeviationPerc: 0,
  renderRateStdDeviationPercMax: 0,
  renderRateStdDeviationPercSum: 0,
  renderRateStdDeviationPercAvg: 0,
  renderRateStdDeviationPercCount: 0,
  jittersum: 0,
  jittercount: 0,
  jitteravg: 0,
  jittermax: 0,
  renderRates: []
}

$.get('https://www.cloudflare.com/cdn-cgi/trace', function (data) {
  // Convert key-value pairs to JSON
  // https://stackoverflow.com/a/39284735/452587
  data = data.trim().split('\n').reduce(function (obj, pair) {
    pair = pair.split('=');
    return obj[pair[0]] = pair[1], obj;
  }, {});
  document.getElementById("location").textContent = data.loc;
  document.getElementById("ip").textContent = data.ip;
  loc = data.loc;

});

let p2pids = p2pid + (100 + Math.floor(Math.random() * 100));
let p2pice = "{ config: { 'iceServers': [ { 'url': 'stun:stun.l.google.com:19302' } ] , trickle: true}, trickle: true }"
if (rpid)
  peer = new Peer(p2pid, p2pice);
else
  peer = new Peer(p2pids, p2pice);

var currentCall;

peer.on("open", function (id) {
  document.getElementById("uuid").textContent = id;
  if (!rpid) {
    document.getElementById("connect").style.display = 'inline-block';
  }
  document.getElementById("canvas").style.display = 'inline-block';
  document.getElementById("localv").style.display = 'inline-block';
  canv = document.getElementById("canvas");
  ctx = document.getElementById("canvas").getContext('2d');
  if (usewebcam) {
    setInterval(webcam, 15);
  } else {
    setInterval(clock, 33);
  }
});

peer.on('connection', function (conn) {
  conn.on('open', function () {
    conn.on('data', function (data) {
      console.log('Received', data);
    });
    conn.send("loc:" + loc);
  });
});


var connect_p = -1;
var connect_a = -1;

peer.on("call", async (call) => {
  var mstream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  call.answer(mstream);
  currentCall = call;
  call.on("stream", (remoteStream) => {
    document.getElementById("received-video").srcObject = remoteStream;
    document.getElementById("received-video").play();
    var stream = document.getElementById("received-video").captureStream(30);
    var newTrack = stream.getVideoTracks()[0];
    //currentCall.peerConnection.getSenders()[0].replaceTrack(newTrack);
    currentCall.peerConnection.getSenders()[1].replaceTrack(newTrack);
  });
});

function webcam() {
  ctx.drawImage(myvideo, 0, 0, 1280, 720);
}
function clock() {
  ctx.font = '200px serif';
  var d = new Date();
  ctx.clearRect(0, 0, 1280, 720);
  ctx.fillStyle = "#ec9706";
  ctx.font = "200px Arial";
  ctx.fillText(d.toLocaleTimeString('en-US', { hour12: false }) + "." + d.getMilliseconds(), 30, 400);
  document.getElementById("gmt").textContent = d.toUTCString();

}


function switchUp() {
  setStream();
  var newTrack = lstream.getVideoTracks()[0];
  currentCall.peerConnection.getSenders()[1].replaceTrack(newTrack);
}
function switchUp2() {
  var stream = document.getElementById("received-video").captureStream(30);
  var newTrack = stream.getVideoTracks()[0];
  currentCall.peerConnection.getSenders()[1].replaceTrack(newTrack);
}

function endCall() {
  if (!currentCall) return;
  // Close the call, and reset the function
  try {
    currentCall.close();
  } catch { }
  currentCall = undefined;
}

var client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
AgoraRTC.setParameter("JOIN_EXTEND", "{ 'force_playoutdelay_0': true }");
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
async function setStream() {
  if (usewebcam) {
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      myvideo.srcObject = stream;
      myvideo.play();
    });
  }

  lstream = document.getElementById("canvas").captureStream(30);
}

async function join() {
  client.on("user-published", handleUserPublished);
  client.on("user-unpublished", handleUserUnpublished);

  localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
  [options.uid, localTracks.videoTrack] = await Promise.all([
    // Join the channel.
    client.join(options.appid, options.channel, options.token || null, options.uid || null),
    // Create tracks to the customized video source.
    AgoraRTC.createCustomVideoTrack({ mediaStreamTrack: lstream.getVideoTracks()[0] })
  ]);
  await client.publish([localTracks.videoTrack, localTracks.audioTrack]);
  start_a = Date.now();
}

async function join2() {

  client.on("user-published", handleUserPublished);
  client.on("user-unpublished", handleUserUnpublished);

  options.uid = await client.join(options.appid, options.channel, options.token || null, options.uid || null);
  //await client.publish(Object.values(localTracks));
  //localTracks.videoTrack.play("local-player");
}


async function subscribe(user, mediaType) {
  const uid = user.uid;
  await client.subscribe(user, mediaType);
  if (mediaType === 'video') {
    await user.videoTrack.play("received-video-agora");
    if (!end_a) {
      end_a = Date.now();
      connect_a = end_a - start_a;
    }
  }
  if (mediaType === 'audio') {
    user.audioTrack.play();
  }
  ret();
}

async function ret() {
  if (rpid) {
    var el = document.getElementsByClassName('agora_video_player')[0];
    var stream = el.captureStream(30);
    var track = await AgoraRTC.createCustomVideoTrack({ mediaStreamTrack: stream.getVideoTracks()[0] });
    var audioTrack = await AgoraRTC.createMicrophoneAudioTrack();

    await client.publish([track, audioTrack]);
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
  start_p = null;
  end_p = null;
  start_a = null;
  end_a = null;
  conn = peer.connect(p2pid);
  conn.on('open', function () {
    conn.on('data', function (data) {
      console.log('Received', data);
      if (data.indexOf("loc:") > -1) {
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
  start_p = Date.now();
  const call = peer.call(p2pid, lstream);
  call.on("stream", (stream) => {
    document.getElementById("received-video").srcObject = stream;
    document.getElementById("received-video").play();
    if (!end_p) {
      end_p = Date.now();
      connect_p = end_p - start_p;
    }
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

function setStats(report, div, connect, brref, rendervol) {
  var nack = report["nackCount"];
  var fps = report["framesPerSecond"];
  var framesDropped = report["framesDropped"];
  var frameHeight = report["frameHeight"];
  var frameWidth = report["frameWidth"];
  var totalSquaredInterFrameDelay = report["totalSquaredInterFrameDelay"].toFixed(3);
  var jitter = report["jitter"];//.toFixed(3);
  if (jitter && jitter > 0 && !isNaN(jitter)) {
    rendervol.jittersum = jitter + rendervol.jittersum;
    rendervol.jittercount++;
    rendervol.jitteravg = rendervol.jittersum / rendervol.jittercount;
    if (isNaN(rendervol.jitteravg)) {
      console.log("nan");
    }
    if (jitter > rendervol.jittermax) {
      rendervol.jittermax = jitter;
    }
  }
  jitter = jitter.toFixed(3);
  var jitterBufferDelay = report["jitterBufferDelay"].toFixed(2);
  var jitterBufferEmittedCount = report["jitterBufferEmittedCount"].toFixed(0);
  var packetsLost = report["packetsLost"];
  var bytesReceived = report["bytesReceived"];
  var packetsReceived = report["packetsReceived"];

  if (fps && !isNaN(fps))
    rendervol.renderFrameRate = fps;
  else
    rendervol.renderFrameRate = -1;
  calculateRenderRateVolatility(rendervol);

  var now = Date.now();
  var bb = brref.br;
  var br_delta = bytesReceived - brref.br;
  var brtime_delta = now - brref.brtime;

  brref.brtime = now;
  brref.br = bytesReceived;

  var kbps = 0;
  if (bb > 0) {
    kbps = (br_delta * 8 / 1000) / (brtime_delta / 1000);
  }

  //var stats = "Connect time: "+connect+" ms, W: "+frameWidth+", H: "+frameHeight+" <br>FPS: "+fps+", Nack: "+nack+", Lost: "+packetsLost+" kbps: "+Math.floor(kbps)+"  <br>Jitter: "+jitter+", avg:"+rendervol.jitteravg.toFixed(3)+", max: "+rendervol.jittermax.toFixed(3)+" <br>Jitter Delay: "+jitterBufferDelay+" <br>Jitter Emitted: "+jitterBufferEmittedCount+" <br>SquaredInterFrameDelay: "+totalSquaredInterFrameDelay+"<br>framesDropped: "+framesDropped+"<br>FPS Vol%: "+rendervol.renderRateStdDeviationPerc.toFixed(0)+", avg:"+rendervol.renderRateStdDeviationPercAvg.toFixed(0)+", max:"+rendervol.renderRateStdDeviationPercMax.toFixed(0) ;
  var stats = "Connect time: " + connect + " ms, W: " + frameWidth + ", H: " + frameHeight + " <br>FPS: " + fps + ", Nack: " + nack + ", Lost: " + packetsLost + " kbps: " + Math.floor(kbps) + "  <br>Jitter: " + jitter + ", avg:" + rendervol.jitteravg.toFixed(3) + ", max: " + rendervol.jittermax.toFixed(3) + "<br>FPS Vol%: " + rendervol.renderRateStdDeviationPerc.toFixed(0) + ", avg:" + rendervol.renderRateStdDeviationPercAvg.toFixed(0) + ", max:" + rendervol.renderRateStdDeviationPercMax.toFixed(0);
  console.log(stats);
  document.getElementById(div).innerHTML = stats;
}

async function getStats() {
  if (start_p && !isNaN(start_p)) {
    document.getElementById("durat").textContent = ((Date.now() - start_p) / 1000).toFixed(0);
  }
  if (client && client._p2pChannel && client._p2pChannel.connection && client._p2pChannel.connection.peerConnection) {
    await client._p2pChannel.connection.peerConnection.getStats().then(async stats => {
      await stats.forEach(report => {
        if (report.type === "inbound-rtp" && report.kind === "video") {
          setStats(report, "statsc2", connect_a, br_a, rendervol_a);
        }
      })
    })
  }

  if (currentCall && currentCall.peerConnection) {
    await currentCall.peerConnection.getStats().then(async stats => {
      await stats.forEach(report => {
        if (report.type === "inbound-rtp" && report.kind === "video") {
          setStats(report, "statsb2", connect_p, br_p, rendervol_p);
        }
      })
    })
  }
}

function getMS(parsedDate) {
  var tokens = parsedDate.split(".");
  var ms = tokens[1] * 1;
  tokens = tokens[0].split(":");
  var hms = tokens[0] * 60 * 60 * 1000;
  var mms = tokens[1] * 60 * 1000;
  var sms = tokens[2] * 1000;
  return ms + hms + mms + sms;
}

const { createWorker, createScheduler } = Tesseract;
const scheduler = createScheduler();
const video = document.getElementById('poem-video');
const messages = document.getElementById('messages');

let timerId = null;

let samplecount = 0;
let p2p_total = 0;
let agora_total = 0;
let p_min = 100000;
let p_max = 0;
let a_min = 100000;
let a_max = 0;

const doOCR = async () => {
  const c = document.getElementById('canvas');
  let video = document.getElementById('received-video');
  const c2 = document.createElement('canvas');
  c2.width = 1280;
  c2.height = 720;
  if (video && !video.paused) {
    c2.getContext('2d').drawImage(video, 0, 0, 1280, 720);
  }

  video = document.getElementsByClassName('agora_video_player')[0];
  const c3 = document.createElement('canvas');
  c3.width = 1280;
  c3.height = 720;
  if (video && !video.paused) {
    c3.getContext('2d').drawImage(video, 0, 0, 1280, 720);
  }

  var ms_local = -1;
  var ms_p2p = -1;
  var ms_agora = -1;

  let ocr = await scheduler.addJob('recognize', c);
  if (ocr.data && ocr.data.text) {
    ocr.data.text.split('\n').forEach((line) => {
      if (line.length > 4) {
        ms_local = getMS(line);
      }
    });
  }

  ocr = await scheduler.addJob('recognize', c2);
  if (ocr.data && ocr.data.text) {
    ocr.data.text.split('\n').forEach((line) => {
      if (line.length > 4) {
        ms_p2p = getMS(line);
      }
    });
  }

  ocr = await scheduler.addJob('recognize', c3);
  if (ocr.data && ocr.data.text) {
    ocr.data.text.split('\n').forEach((line) => {
      if (line.length > 4) {
        ms_agora = getMS(line);
      }
    });
  }

  if (isNaN(ms_local)) {
    ms_local = -1;
  }

  if (isNaN(ms_p2p)) {
    ms_p2p = -1;
  }

  if (isNaN(ms_agora)) {
    ms_agora = -1;
  }

  console.log("ms_local", ms_local, "ms_p2p", ms_p2p, "ms_agora", ms_agora, "ms_local-ms_agora", ms_local - ms_agora, "ms_local-ms_p2p", ms_local - ms_p2p);

  if (ms_local > -1 && ms_p2p > -1 && ms_agora > -1) {
    let lp = (ms_local - ms_p2p);
    let la = (ms_local - ms_agora);
    if (la < 1000 && lp < 1000 && la > 0 && lp > 0) {
      samplecount++;
      p2p_total = lp + p2p_total;
      agora_total = la + agora_total;
      if (la < a_min) {
        a_min = la;
      }
      if (lp < p_min) {
        p_min = lp;
      }
      if (la > a_max) {
        a_max = la;
      }
      if (lp > p_max) {
        p_max = lp;
      }
      document.getElementById("statsb").textContent = "RT Latency: avg: " + Math.floor(p2p_total / samplecount) + ", min: " + Math.floor(p_min) + ", max: " + Math.floor(p_max) + "";
      document.getElementById("statsc").textContent = "RT Latency: avg: " + Math.floor(agora_total / samplecount) + ", min: " + Math.floor(a_min) + ", max: " + Math.floor(a_max) + "";
    }
  }
};

var MaxRenderRateSamples = 8;

function calculateRenderRateVolatility(statsMap) {

  if (statsMap.renderFrameRate < 0) {
    return;
  }
  var arr = statsMap.renderRates;

  if (arr.length >= MaxRenderRateSamples) {
    arr.shift();
  }
  arr.push(statsMap.renderFrameRate);

  var i, j, total = 0;
  for (i = 0; i < arr.length; i += 1) {
    total += arr[i];
  }
  statsMap.renderRateMean = total / arr.length;
  var vol = 0;
  for (j = 0; j < arr.length; j += 1) {
    vol += Math.abs(arr[j] - statsMap.renderRateMean);
  }
  if (arr.length >= MaxRenderRateSamples) { // don't report vol on limited set
    statsMap.renderRateStdDeviation = vol / arr.length;
    statsMap.renderRateStdDeviationPerc = (statsMap.renderRateStdDeviation / statsMap.renderRateMean) * 100
    statsMap.renderRateStdDeviationPercCount++;
    statsMap.renderRateStdDeviationPercSum = statsMap.renderRateStdDeviationPercSum + statsMap.renderRateStdDeviationPerc;
    if (isNaN(statsMap.renderRateStdDeviationPercSum)) {
      console.log("nan");
    }
    statsMap.renderRateStdDeviationPercAvg = statsMap.renderRateStdDeviationPercSum / statsMap.renderRateStdDeviationPercCount;
    if (isNaN(statsMap.renderRateStdDeviationPercAvg)) {
      console.log("nan");
    }
    if (statsMap.renderRateStdDeviationPerc > statsMap.renderRateStdDeviationPercMax) {
      statsMap.renderRateStdDeviationPercMax = statsMap.renderRateStdDeviationPerc;
    }

  }

}

(async () => {
  if (!rpid) {
    for (let i = 0; i < 4; i++) {
      const worker = createWorker();
      await worker.load();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      scheduler.addWorker(worker);
    }
    timerId = setInterval(doOCR, 2000);
    setInterval(getStats, 1000);
  }
})();



