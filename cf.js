const paramsString = document.location.search;
const searchParams = new URLSearchParams(paramsString);
const channel = searchParams.get("channel");

let rpid = searchParams.get("r");
let usewebcam = searchParams.get("w");
let forcempd = searchParams.get("f");

if (rpid && (rpid == 'false' || rpid == '0')) {
  rpid = null;
}
if (usewebcam && (usewebcam == 'false' || usewebcam == '0')) {
  usewebcam = null;
}
if (forcempd && (forcempd == 'false' || forcempd == '0')) {
  forcempd = null;
} else {
  forcempd = true;
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
var start_c;
var end_c;
var br_a = {
  br: 0,
  brtime: 0
}
var br_p = {
  br: 0,
  brtime: 0
}

var br_c = {
  br: 0,
  brtime: 0
}

const { createWorker, createScheduler } = Tesseract;
const scheduler = createScheduler();
const video = document.getElementById('poem-video');
const messages = document.getElementById('messages');

let timerId = null;
let samplecount = 0;
let p2p_total = 0;
let agora_total = 0;
let cf_total = 0;
let p_min = 100000;
let p_max = 0;
let a_min = 100000;
let a_max = 0;
let c_min = 100000;
let c_max = 0;

var callStatsMap_a = {
  renderFrameRate: 0,
  renderRateMean: 0,
  renderRateStdDeviation: 0,
  renderRateStdDeviationPerc: 0,
  renderRateStdDeviationPercMax: 0,
  renderRateStdDeviationPercSum: 0,
  renderRateStdDeviationPercAvg: 0,
  renderRateStdDeviationPercCount: 0,
  jitter: 0,
  jittersum: 0,
  jittercount: 0,
  jitteravg: 0,
  jittermax: 0,
  renderRates: [],
  nack: 0,
  kbps: 0,
  framesDropped: 0,
  freezeCount: 0,
  totalFreezesDuration: 0,
  packetsLost: 0,
  bytesReceived: 0,
  frameHeight: 0,
  frameHeightSum: 0,
  frameHeightCount: 0,
  frameHeightAvg: 0,
  frameWidth: 0,
  frameWidthSum: 0,
  frameWidthCount: 0,
  frameWidthAvg: 0,
  fps: 0,
  fpsSum: 0,
  fpsCount: 0,
  fpsAvg: 0,
  jitterBufferDelayAudio: 0,
  packetsLostAudio: 0,
  packetsDiscardedAudio: 0
}

var callStatsMap_p = {
  renderFrameRate: -1,
  renderRateMean: 0,
  renderRateStdDeviation: 0,
  renderRateStdDeviationPerc: 0,
  renderRateStdDeviationPercMax: 0,
  renderRateStdDeviationPercSum: 0,
  renderRateStdDeviationPercAvg: 0,
  renderRateStdDeviationPercCount: 0,
  jitter: 0,
  jittersum: 0,
  jittercount: 0,
  jitteravg: 0,
  jittermax: 0,
  renderRates: [],
  nack: 0,
  kbps: 0,
  framesDropped: 0,
  freezeCount: 0,
  totalFreezesDuration: 0,
  packetsLost: 0,
  bytesReceived: 0,
  frameHeight: 0,
  frameHeightSum: 0,
  frameHeightCount: 0,
  frameHeightAvg: 0,
  frameWidth: 0,
  frameWidthSum: 0,
  frameWidthCount: 0,
  frameWidthAvg: 0,
  fps: 0,
  fpsSum: 0,
  fpsCount: 0,
  fpsAvg: 0,
  jitterBufferDelayAudio: 0,
  packetsLostAudio: 0,
  packetsDiscardedAudio: 0
}

var callStatsMap_c = {
  renderFrameRate: 0,
  renderRateMean: 0,
  renderRateStdDeviation: 0,
  renderRateStdDeviationPerc: 0,
  renderRateStdDeviationPercMax: 0,
  renderRateStdDeviationPercSum: 0,
  renderRateStdDeviationPercAvg: 0,
  renderRateStdDeviationPercCount: 0,
  jitter: 0,
  jittersum: 0,
  jittercount: 0,
  jitteravg: 0,
  jittermax: 0,
  renderRates: [],
  nack: 0,
  kbps: 0,
  framesDropped: 0,
  freezeCount: 0,
  totalFreezesDuration: 0,
  packetsLost: 0,
  bytesReceived: 0,
  frameHeight: 0,
  frameHeightSum: 0,
  frameHeightCount: 0,
  frameHeightAvg: 0,
  frameWidth: 0,
  frameWidthSum: 0,
  frameWidthCount: 0,
  frameWidthAvg: 0,
  fps: 0,
  fpsSum: 0,
  fpsCount: 0,
  fpsAvg: 0,
  jitterBufferDelayAudio: 0,
  packetsLostAudio: 0,
  packetsDiscardedAudio: 0
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

let p2pids = channel + (100 + Math.floor(Math.random() * 100));

//let p2pice = "{ config: { 'iceServers': [ { 'url': 'stun:stun.l.google.com:19302' } ] , trickle: true}, trickle: true }"
let x = [{
  urls: ["stun:eu-turn4.xirsys.com"]
}, {
  username: "17BT8AZvZxdSBFARL8ccV7cJWM7PllP7jSci28fhIaILUnWjSO-LMzLda1tHWZkhAAAAAF6D2qNiZW53ZWVrZXM3Mw==",
  credential: "685ddd3c-73ac-11ea-b446-d68f74b5db2a",
  urls: [
    "turn:eu-turn4.xirsys.com:80?transport=udp",
    "turn:eu-turn4.xirsys.com:3478?transport=udp",
    "turn:eu-turn4.xirsys.com:80?transport=tcp",
    "turn:eu-turn4.xirsys.com:3478?transport=tcp",
    "turns:eu-turn4.xirsys.com:443?transport=tcp",
    "turns:eu-turn4.xirsys.com:5349?transport=tcp"
  ]
}];

let p2pice = { config: { iceServers: x, trickle: true }, trickle: true }

if (rpid) {
  peer = new Peer(channel, p2pice);
}
else {
  peer = new Peer(p2pids, p2pice);
}

var currentCall;
peer.on("open", function (id) {
  document.getElementById("uuid").textContent = channel;//id;
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
var connect_c = -1;

peer.on("call", async (call) => {
  var mstream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  call.answer(mstream);
  currentCall = call;
  call.on("stream", async (remoteStream) => {
    //return;
    document.getElementById("received-video").srcObject = remoteStream;
    //await document.getElementById("received-video").play();
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


function endCallP2P() {
  if (!currentCall) return;
  // Close the call, and reset the function
  try {
    currentCall.close();
  } catch { }
  currentCall = undefined;
}

var client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
if (forcempd) {
  AgoraRTC.setParameter("AV_SYNC", false);
  AgoraRTC.setParameter("SYNC_GROUP", false);
  AgoraRTC.setParameter("SUBSCRIBE_TWCC", true);
  AgoraRTC.setParameter("PUBLISH_TWCC", true);
}

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
options.channel = channel; //"peer";

var lstream;

const cf_appId = 'dab938c1507e512caf9a583f4cc42ae1';
const appSecret = '5f5f54251a7ff6e9b61848f8e0b58ed1e62317711393e7db6d525a8852ca43c8';

class CallsApp {
  constructor(cf_appId, basePath = 'https://rtc.live.cloudflare.com/v1') {
    this.prefixPath = `${basePath}/apps/${cf_appId}`;
  }

  async sendRequest(url, body, method = 'POST') {
    const request = {
      method: method,
      mode: 'cors',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${appSecret}`
      },
      body: JSON.stringify(body)
    };
    const response = await fetch(url, request);
    const result = await response.json();
    return result;
  }

  checkErrors(result, tracksCount = 0) {
    if (result.errorCode) {
      throw new Error(result.errorDescription);
    }
    for (let i = 0; i < tracksCount; i++) {
      if (result.tracks[i].errorCode) {
        throw new Error(
          `tracks[${i}]: ${result.tracks[i].errorDescription}`
        );
      }
    }
  }

  // newSession sends the initial offer and creates a session
  async newSession(offerSDP) {
    const url = `${this.prefixPath}/sessions/new`;
    const body = {
      sessionDescription: {
        type: 'offer',
        sdp: offerSDP
      }
    };
    const result = await this.sendRequest(url, body);
    this.checkErrors(result);
    this.sessionId = result.sessionId;
    return result;
  }

  // newTracks shares local tracks or gets tracks
  async newTracks(trackObjects, offerSDP = null) {
    const url = `${this.prefixPath}/sessions/${this.sessionId}/tracks/new`;
    const body = {
      sessionDescription: {
        type: 'offer',
        sdp: offerSDP
      },
      tracks: trackObjects
    };
    if (!offerSDP) {
      delete body['sessionDescription'];
    }
    const result = await this.sendRequest(url, body);
    this.checkErrors(result, trackObjects.length);
    return result;
  }


  // sendAnswerSDP sends an answer SDP if a renegotiation is required
  async sendAnswerSDP(answer) {
    const url = `${this.prefixPath}/sessions/${this.sessionId}/renegotiate`;
    const body = {
      sessionDescription: {
        type: 'answer',
        sdp: answer
      }
    };
    const result = await this.sendRequest(url, body, 'PUT');
    this.checkErrors(result);
  }
}

async function setStreamP2P() {
  if (usewebcam) {
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      myvideo.srcObject = stream;
      myvideo.play();
    });
  }

  lstream = document.getElementById("canvas").captureStream(30);
}

async function joinAgora() {
  client.on("user-published", handleUserPublished);
  client.on("user-unpublished", handleUserUnpublished);
  localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
  localTracks.videoTrack = await AgoraRTC.createCustomVideoTrack({ mediaStreamTrack: lstream.getVideoTracks()[0] });
  start_a = Date.now();
  options.uid = await client.join(options.appid, options.channel, options.token || null, options.uid || null);
  await client.publish([localTracks.videoTrack, localTracks.audioTrack]);
  end_a = Date.now();
  connect_a = end_a - start_a;
}

async function joinAgora2() {
  client.on("user-published", handleUserPublished);
  client.on("user-unpublished", handleUserUnpublished);
  options.uid = await client.join(options.appid, options.channel, options.token || null, options.uid || null);
}


let rtmClient = null;
let rtmUid = p2pids + rpid;
let rtmChannel = null;
let rtmChannelName = channel;

function initRTM() {
  rtmClient = AgoraRTM.createInstance(options.appid, { logFilter: AgoraRTM.LOG_FILTER_OFF });
  rtmClient.on('ConnectionStateChanged', (newState, reason) => {
    if (newState == "CONNECTED") {
    }
  });

  rtmClient.login({ token: null, uid: rtmUid }).then(() => {
    rtmChannel = rtmClient.createChannel(rtmChannelName);
    rtmChannel.join().then(() => {
      rtmChannel.on('ChannelMessage', ({ text }, senderId) => {
        cfpublished(senderId, text);
      });
    }).catch(error => {
      console.error('AgoraRTM client join failure', error);
    });
  }).catch(error => {
    console.error('AgoraRTM client login failure', error);
  });
}

async function cfpublished(senderId, text) {
  // receive user published   
  console.warn('senderId', senderId, text);
  const published = JSON.parse(text);

  if (rpid) {
    await publishCF(false);
  }
  await subscribeCF(published);
  if (rpid) {
    var stream = document.getElementById("received-video-cf").captureStream(30);
    var newTrack = stream.getVideoTracks()[0];
    //currentCall.peerConnection.getSenders()[0].replaceTrack(newTrack);
    self.pc.getSenders()[1].replaceTrack(newTrack);
  }
}

async function createCF() {
  self.pc = new RTCPeerConnection({
    iceServers: [
      {
        urls: 'stun:stun.cloudflare.com:3478'
      }
    ],
    bundlePolicy: 'max-bundle'
  });
  self.app = new CallsApp(cf_appId);
}

async function publishCF(videoTrack) {  
  start_c = Date.now();
  createCF();
  const localStream = await navigator.mediaDevices.getUserMedia({
    video: !videoTrack,
    audio: true
  });

  if (videoTrack) {
    localStream.addTrack(videoTrack);
  }
  
  self.transceivers = localStream.getTracks().map(track =>
    self.pc.addTransceiver(track, {
      direction: 'sendonly'
    })
  );

  await self.pc.setLocalDescription(await self.pc.createOffer());
  const newSessionResult = await self.app.newSession(
    self.pc.localDescription.sdp
  );
  await self.pc.setRemoteDescription(
    new RTCSessionDescription(newSessionResult.sessionDescription)
  );

  // Make the peer connection was established
  await new Promise((resolve, reject) => {
    self.pc.addEventListener('iceconnectionstatechange', ev => {
      if (ev.target.iceConnectionState === 'connected') {
        resolve();
      }
      setTimeout(reject, 5000, 'connect timeout');
    });
  });

  let trackObjects = self.transceivers.map(transceiver => {
    return {
      location: 'local',
      mid: transceiver.mid,
      trackName: transceiver.sender.track.id
    };
  });

  // Get local description, create a new track, set remote description with the response
  await self.pc.setLocalDescription(await self.pc.createOffer());
  const newLocalTracksResult = await self.app.newTracks(
    trackObjects,
    self.pc.localDescription.sdp
  );
  await self.pc.setRemoteDescription(
    new RTCSessionDescription(newLocalTracksResult.sessionDescription)
  );

  end_c = Date.now();
  connect_c = end_c - start_c;
  const publishEvent = {
    sessionId: self.app.sessionId,
    audioTrack: newLocalTracksResult.tracks[0].trackName,
    videoTrack: newLocalTracksResult.tracks[1].trackName,
  };

  rtmChannel.sendMessage({ text: JSON.stringify(publishEvent) });
}

async function subscribeCF(published) {

  let trackObjects = [
    {
      location: 'remote',
      sessionId: published.sessionId,
      trackName: published.audioTrack
    },
    {
      location: 'remote',
      sessionId: published.sessionId,
      trackName: published.videoTrack
    }
  ];

  // Prepare to receive the tracks before asking for them
  const remoteTracksPromise = new Promise(resolve => {
    let tracks = [];
    self.pc.ontrack = event => {
      tracks.push(event.track);
      console.debug(`Got track mid=${event.track.mid}`);
      if (tracks.length >= 2) {
        // remote video & audio are ready
        resolve(tracks);
      }
    };
  });

  // Calls API request to ask for the tracks
  const newRemoteTracksResult = await self.app.newTracks(trackObjects);
  if (newRemoteTracksResult.requiresImmediateRenegotiation) {
    switch (newRemoteTracksResult.sessionDescription.type) {
      case 'offer':
        // We let Cloudflare know we're ready to receive the tracks
        await self.pc.setRemoteDescription(
          new RTCSessionDescription(
            newRemoteTracksResult.sessionDescription
          )
        );
        await self.pc.setLocalDescription(await self.pc.createAnswer());
        await self.app.sendAnswerSDP(self.pc.localDescription.sdp);
        break;
      case 'answer':
        throw new Error('An offer SDP was expected');
    }
  }

  // Once started receiving the tracks (video & audio) send the data to the video tag
  const remoteTracks = await remoteTracksPromise;
  const remoteVideoElement = document.getElementById('received-video-cf');
  const remoteStream = new MediaStream();
  remoteStream.addTrack(remoteTracks[0]);
  remoteStream.addTrack(remoteTracks[1]);
  remoteVideoElement.srcObject = remoteStream;
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
    ret();
  }
  if (mediaType === 'audio') {
    // avoid echo
    // user.audioTrack.play();
  }
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

async function connectButtonClicked() {
  start_p = null;
  end_p = null;
  start_a = null;
  end_a = null;
  start_c = null;
  end_c = null;
  conn = peer.connect(channel);
  conn.on('open', function () {
    conn.on('data', function (data) {
      console.log('Received', data);
      if (data.indexOf("loc:") > -1) {
        document.getElementById("remloc").textContent = data.substring(4);
      }
    });
    conn.send("H2");
  });
  setStreamP2P();
  joinAgora(); // Agora 1
  setupP2P();
  publishCF(lstream.getVideoTracks()[0]);  
}

if (rpid) {
  joinAgora2();
}

async function setupP2P() {
  let gstream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
  await gstream.addTrack(lstream.getVideoTracks()[0]);
  start_p = Date.now();
  const call = await peer.call(channel, gstream);
  call.on("stream", async (stream) => {
    document.getElementById("received-video").srcObject = stream;

    let v = stream.getVideoTracks().length;
    let a = stream.getAudioTracks().length;

    //console.error("stream", a,v);
    //await document.getElementById("received-video").play();
    if (!end_p && v > 0 && a > 0) {
      end_p = Date.now();
      connect_p = end_p - start_p;
    }
  });
  call.on("data", (stream) => {
    console.error("data");
    // document.querySelector("#received-video").srcObject = stream;
  });
  call.on("error", (err) => {
    console.log(err);
  });
  call.on('close', () => {
    endCallP2P()
  })
  currentCall = call;
}

function setStatsAudio(report, mode, callStatsMap) {

  var jitterBufferDelay = (report["jitterBufferDelay"] / report["jitterBufferEmittedCount"]).toFixed(3);
  if (jitterBufferDelay && jitterBufferDelay > 0 && !isNaN(jitterBufferDelay)) {
    callStatsMap.jitterBufferDelayAudio = jitterBufferDelay;
  }

  var packetsLost = report["packetsLost"];
  if (packetsLost && packetsLost > 0 && !isNaN(packetsLost)) {
    callStatsMap.packetsLostAudio = packetsLost;
  }

  var packetsDiscarded = report["packetsDiscarded"];
  if (packetsDiscarded && packetsDiscarded > 0 && !isNaN(packetsDiscarded)) {
    callStatsMap.packetsDiscardedAudio = packetsDiscarded;
  }

  //console.log("audio ",mode, jitter,jitterBufferDelay,jitterBufferEmittedCount,jitterBufferMinimumDelay,jitterBufferTargetDelay,removedSamplesForAcceleration,packetsLost,packetsDiscarded,packetsReceived);
  //console.log("audio ",mode, "jitterBufferDelay",jitterBufferDelay,"jitterBufferTargetDelay",jitterBufferTargetDelay,"packetsLost",packetsLost,"packetsDiscarded",packetsDiscarded);
}

// video
function setStats(report, div, connect, brref, callStatsMap) {

  var framesDropped = report["framesDropped"];
  if (framesDropped && framesDropped > 0 && !isNaN(framesDropped)) {
    callStatsMap.framesDropped = framesDropped;
  }

  var freezeCount = report["freezeCount"];
  if (freezeCount && freezeCount > 0 && !isNaN(freezeCount)) {
    callStatsMap.freezeCount = freezeCount;
  }

  var totalFreezesDuration = report["totalFreezesDuration"];
  if (totalFreezesDuration && totalFreezesDuration > 0 && !isNaN(totalFreezesDuration)) {
    callStatsMap.totalFreezesDuration = totalFreezesDuration;
  }

  var packetsLost = report["packetsLost"];
  if (packetsLost && packetsLost > 0 && !isNaN(packetsLost)) {
    callStatsMap.packetsLost = packetsLost;
  }

  var bytesReceived = report["bytesReceived"];
  if (bytesReceived && bytesReceived > 0 && !isNaN(bytesReceived)) {
    callStatsMap.bytesReceived = bytesReceived;
  }

  var jitter = report["jitter"];
  if (jitter && jitter > 0 && !isNaN(jitter)) {
    callStatsMap.jitter = jitter;
    callStatsMap.jittersum = jitter + callStatsMap.jittersum;
    callStatsMap.jittercount++;
    callStatsMap.jitteravg = callStatsMap.jittersum / callStatsMap.jittercount;
    if (isNaN(callStatsMap.jitteravg)) {
      console.log("nan");
    }
    if (jitter > callStatsMap.jittermax) {
      callStatsMap.jittermax = jitter;
    }
  }
  jitter = jitter.toFixed(3);

  var frameHeight = report["frameHeight"];
  if (frameHeight && frameHeight > 0 && !isNaN(frameHeight)) {
    callStatsMap.frameHeight = frameHeight;
    callStatsMap.frameHeightSum = frameHeight + callStatsMap.frameHeightSum;
    callStatsMap.frameHeightCount++;
    callStatsMap.frameHeightAvg = (callStatsMap.frameHeightSum / callStatsMap.frameHeightCount).toFixed(0);
  }

  var frameWidth = report["frameWidth"];
  if (frameWidth && frameWidth > 0 && !isNaN(frameWidth)) {
    callStatsMap.frameWidth = frameWidth;
    callStatsMap.frameWidthSum = frameWidth + callStatsMap.frameWidthSum;
    callStatsMap.frameWidthCount++;
    callStatsMap.frameWidthAvg = (callStatsMap.frameWidthSum / callStatsMap.frameWidthCount).toFixed(0);
  }

  var fps = report["framesPerSecond"];
  if (fps && fps > 0 && !isNaN(fps)) {
    callStatsMap.fps = fps;
    callStatsMap.fpsSum = fps + callStatsMap.fpsSum;
    callStatsMap.fpsCount++;
    callStatsMap.fpsAvg = (callStatsMap.fpsSum / callStatsMap.fpsCount).toFixed(1);
  }

  //console.log("video",div,"packetsLost",packetsLost,"framesDropped",framesDropped,"freezeCount",freezeCount,"totalFreezesDuration",totalFreezesDuration);

  if (fps && !isNaN(fps))
    callStatsMap.renderFrameRate = fps;
  else
    callStatsMap.renderFrameRate = -1;

  calculateRenderRateVolatility(callStatsMap);

  var now = Date.now();
  var bb = brref.br;
  var br_delta = bytesReceived - brref.br;
  var brtime_delta = now - brref.brtime;
  brref.brtime = now;
  brref.br = bytesReceived;

  if (bb > 0) {
    callStatsMap.kbps = (br_delta * 8 / 1000) / (brtime_delta / 1000);
  }

  var nack = report["nackCount"];
  if (nack && nack > 0 && !isNaN(nack)) {
    callStatsMap.nack = nack;
  }


}

async function getStats() {
  let dd = "";

  if (start_p && !isNaN(start_p)) {
    document.getElementById("durat").textContent = dd + (((Date.now() - start_p) / 1000).toFixed(0));
  }
  if (client && client._p2pChannel && client._p2pChannel.connection && client._p2pChannel.connection.peerConnection) {
    await client._p2pChannel.connection.peerConnection.getStats().then(async stats => {
      await stats.forEach(report => {
        if (report.type === "inbound-rtp" && report.kind === "video") {
          setStats(report, "statsc2", connect_a, br_a, callStatsMap_a);
        }
        if (report.type === "inbound-rtp" && report.kind === "audio") {
          setStatsAudio(report, "sd-rtn", callStatsMap_a);
        }
      })
    })
  }

  if (currentCall && currentCall.peerConnection) {
    await currentCall.peerConnection.getStats().then(async stats => {
      await stats.forEach(report => {
        if (report.type === "inbound-rtp" && report.kind === "video") {
          setStats(report, "statsb2", connect_p, br_p, callStatsMap_p);
        }
        if (report.type === "inbound-rtp" && report.kind === "audio") {
          setStatsAudio(report, "p2p", callStatsMap_p);
        }
      })
    })
  }


  if (self && self.pc) {
    await self.pc.getStats().then(async stats => {
      await stats.forEach(report => {
        if (report.type === "inbound-rtp" && report.kind === "video") {
          setStats(report, "statsd2", connect_c, br_c, callStatsMap_c);
        }
        if (report.type === "inbound-rtp" && report.kind === "audio") {
          setStatsAudio(report, "p2p", callStatsMap_c);
        }
      })
    })
  }

  /* Display Stats */
  let connectt = connect_a;
  let csm = callStatsMap_a;
  let latency_avg_a = Math.floor(agora_total / samplecount);
  let genius_score = (csm.fpsAvg * csm.frameWidthAvg * csm.frameHeightAvg) / (1 + latency_avg_a + (20 * csm.totalFreezesDuration) + (10 * (csm.packetsDiscardedAudio + csm.packetsLostAudio)));
  if (isNaN(genius_score)) {
    genius_score = 0;
  }
  genius_score = genius_score / 1000;
  genius_score = genius_score.toFixed(0);

  var stats = "Connect time: " + connectt + " ms, W: " + csm.frameWidth + ", H: " + csm.frameHeight + " <br>FPS: " + csm.fps + ", Nack: " + csm.nack + ", Lost: " + csm.packetsLost + " kbps: " + Math.floor(csm.kbps);
  stats = stats + " <br>Drop: " + csm.framesDropped + ", Freezes: " + csm.freezeCount + ", Freeze Dur: " + csm.totalFreezesDuration;
  stats = stats + " <br>Jitter: " + csm.jitter + ", avg:" + csm.jitteravg.toFixed(3) + ", max: " + csm.jittermax.toFixed(3);
  stats = stats + " <br>FPS Vol%: " + csm.renderRateStdDeviationPerc.toFixed(0) + ", avg:" + csm.renderRateStdDeviationPercAvg.toFixed(0) + ", max:" + csm.renderRateStdDeviationPercMax.toFixed(0);
  stats = stats + " <br>Averages fps: " + csm.fpsAvg + ", W: " + csm.frameWidthAvg + ", H: " + csm.frameHeightAvg;
  stats = stats + " <br>Audio lost: " + csm.packetsLostAudio + ", discard: " + csm.packetsDiscardedAudio + ", delay: " + csm.jitterBufferDelayAudio;
  stats = stats + " <br><b>Genius Score</b> : " + genius_score;
  document.getElementById("statsc2").innerHTML = stats;

  connectt = connect_p;
  csm = callStatsMap_p;
  let latency_avg_p = Math.floor(p2p_total / samplecount);
  genius_score = (csm.fpsAvg * csm.frameWidthAvg * csm.frameHeightAvg) / (1 + latency_avg_p + (20 * csm.totalFreezesDuration) + (10 * (csm.packetsDiscardedAudio + csm.packetsLostAudio)));
  if (isNaN(genius_score)) {
    genius_score = 0;
  }
  genius_score = genius_score / 1000;
  genius_score = genius_score.toFixed(0);
  stats = "Connect time: " + connectt + " ms, W: " + csm.frameWidth + ", H: " + csm.frameHeight + " <br>FPS: " + csm.fps + ", Nack: " + csm.nack + ", Lost: " + csm.packetsLost + " kbps: " + Math.floor(csm.kbps);
  stats = stats + " <br>Drop: " + csm.framesDropped + ", Freezes: " + csm.freezeCount + ", Freeze Dur: " + csm.totalFreezesDuration;
  stats = stats + " <br>Jitter: " + csm.jitter + ", avg:" + csm.jitteravg.toFixed(3) + ", max: " + csm.jittermax.toFixed(3);
  stats = stats + " <br>FPS Vol%: " + csm.renderRateStdDeviationPerc.toFixed(0) + ", avg:" + csm.renderRateStdDeviationPercAvg.toFixed(0) + ", max:" + csm.renderRateStdDeviationPercMax.toFixed(0);
  stats = stats + " <br>Averages fps: " + csm.fpsAvg + ", W: " + csm.frameWidthAvg + ", H: " + csm.frameHeightAvg;
  stats = stats + " <br>Audio lost: " + csm.packetsLostAudio + ", discard: " + csm.packetsDiscardedAudio + ", delay: " + csm.jitterBufferDelayAudio;
  stats = stats + " <br><b>Genius Score</b> : " + genius_score;
  document.getElementById("statsb2").innerHTML = stats;

  connectt = connect_c;
  csm = callStatsMap_c;
  let latency_avg_c = Math.floor(cf_total / samplecount);
  genius_score = (csm.fpsAvg * csm.frameWidthAvg * csm.frameHeightAvg) / (1 + latency_avg_c + (20 * csm.totalFreezesDuration) + (10 * (csm.packetsDiscardedAudio + csm.packetsLostAudio)));
  if (isNaN(genius_score)) {
    genius_score = 0;
  } 
  genius_score = genius_score / 1000;
  genius_score = genius_score.toFixed(0);
  stats = "Connect time: " + connectt + " ms, W: " + csm.frameWidth + ", H: " + csm.frameHeight + " <br>FPS: " + csm.fps + ", Nack: " + csm.nack + ", Lost: " + csm.packetsLost + " kbps: " + Math.floor(csm.kbps);
  stats = stats + " <br>Drop: " + csm.framesDropped + ", Freezes: " + csm.freezeCount + ", Freeze Dur: " + csm.totalFreezesDuration;
  stats = stats + " <br>Jitter: " + csm.jitter + ", avg:" + csm.jitteravg.toFixed(3) + ", max: " + csm.jittermax.toFixed(3);
  stats = stats + " <br>FPS Vol%: " + csm.renderRateStdDeviationPerc.toFixed(0) + ", avg:" + csm.renderRateStdDeviationPercAvg.toFixed(0) + ", max:" + csm.renderRateStdDeviationPercMax.toFixed(0);
  stats = stats + " <br>Averages fps: " + csm.fpsAvg + ", W: " + csm.frameWidthAvg + ", H: " + csm.frameHeightAvg;
  stats = stats + " <br>Audio lost: " + csm.packetsLostAudio + ", discard: " + csm.packetsDiscardedAudio + ", delay: " + csm.jitterBufferDelayAudio;
  stats = stats + " <br><b>Genius Score</b> : " + genius_score;
  document.getElementById("statsd2").innerHTML = stats;
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


  video = document.getElementById('received-video-cf');
  const c4 = document.createElement('canvas');
  c4.width = 1280;
  c4.height = 720;
  if (video && !video.paused) {
    c4.getContext('2d').drawImage(video, 0, 0, 1280, 720);
  }


  var ms_local = -1;
  var ms_p2p = -1;
  var ms_agora = -1;
  var ms_cf = -1;

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

  ocr = await scheduler.addJob('recognize', c4);
  if (ocr.data && ocr.data.text) {
    ocr.data.text.split('\n').forEach((line) => {
      if (line.length > 4) {
        ms_cf = getMS(line);
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

  if (isNaN(ms_cf)) {
    ms_cf = -1;
  }

  if (ms_local > -1 && ms_p2p > -1 && ms_agora > -1 && ms_cf > -1) {
    let lp = (ms_local - ms_p2p);
    let la = (ms_local - ms_agora);
    let lc = (ms_local - ms_cf);
    if (la < 1000 && lp < 1000  && lc < 1000 && la > 0 && lp > 0 && lc > 0) {
      samplecount++;
      p2p_total = lp + p2p_total;
      agora_total = la + agora_total;
      cf_total = lc + cf_total;
      if (la < a_min) {
        a_min = la;
      }
      if (lp < p_min) {
        p_min = lp;
      }
      if (lc < c_min) {
        c_min = lc;
      }
      if (la > a_max) {
        a_max = la;
      }
      if (lp > p_max) {
        p_max = lp;
      }
      if (lc > p_max) {
        c_max = lc;
      }
      document.getElementById("statsb").textContent = "RT Latency: avg: " + Math.floor(p2p_total / samplecount) + ", min: " + Math.floor(p_min) + ", max: " + Math.floor(p_max) + "";
      document.getElementById("statsc").textContent = "RT Latency: avg: " + Math.floor(agora_total / samplecount) + ", min: " + Math.floor(a_min) + ", max: " + Math.floor(a_max) + "";
      document.getElementById("statsd").textContent = "RT Latency: avg: " + Math.floor(cf_total / samplecount) + ", min: " + Math.floor(c_min) + ", max: " + Math.floor(c_max) + "";
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

  initRTM();
  if (!rpid) {
    for (let i = 0; i < 4; i++) {
      const worker = createWorker({
        workerPath: './dist/worker.min.js',
        corePath: './dist/tesseract-core.wasm.js',
      });
      await worker.load();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      scheduler.addWorker(worker);
    }
    timerId = setInterval(doOCR, 2000);
    setInterval(getStats, 1000);
    document.getElementById("connect").disabled = false;
    document.getElementById("connect").style.backgroundColor = "#007bff";
  }
})();
