
// VARIABLES
const app = document.getElementById('app')
const local_username = 'anonymous'
const local_uuid = createUUID()
var socket
var local_stream
var peers = {} // key is uuid

var pc_config = {
    'iceServers': [
        { 'urls': 'stun:stun.stunprotocol.org:3478' },
        { 'urls': 'stun:stun.l.google.com:19302' },
    ]
}

var call_settings = {
    video: true,
    audio: true
}


start()


function start() {
    setup_local_stream()
    window.addEventListener('resize', resize_layout)
}




// FUNCTIONAL COMPONENTS
function setup_local_stream() {
    let vc = document.createElement('div')
    vc.setAttribute('class', 'vc')
    vc.setAttribute('id', 'local')

    let v = document.createElement('video')
    v.setAttribute('autoplay', '')
    v.muted = 'muted'

    vc.appendChild(v)
    app.appendChild(vc)
    resize_layout()

    if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(call_settings)
            .then(stream => {
                local_stream = stream
                v.srcObject = stream
            }).catch(error_handler)
            .then(() => {
                socket = new WebSocket('wss://' + window.location.hostname + ':3000')
                socket.onmessage = (m) => socket_on_message(m)
                socket.onopen = () => socket_on_open()
            }).catch(error_handler)
    }
    else alert('Your browser does not support getUserMedia API')
}

function add_peer(uuid, username, starter = false) {
    console.log('add_peer fired ', uuid)
    peers[uuid] = { 'username': username, 'pc': new RTCPeerConnection(pc_config) }
    peers[uuid].pc.onicecandidate = (event) => ice_candidate(event, uuid)
    peers[uuid].pc.ontrack = (e) => setup_stream(e, uuid)
    peers[uuid].pc.oniceconnectionstatechange = (e) => check_disconnect(e, uuid)
    peers[uuid].pc.addStream(local_stream)

    if (starter) {
        peers[uuid].pc.createOffer()
            .then(description => created_description(description, uuid)).catch(error_handler)
    }
}

function ice_candidate(e, uuid) {
    console.log('ice_candidate fired, ', e)
    if (e.candidate != null) {
        socket.send(JSON.stringify({ 'ice': e.candidate, 'uuid': local_uuid, 'target': uuid }))
    }
}

function setup_stream(e, uuid) {
    console.log('setup_stream called, ', uuid)
    if (!document.getElementById(uuid)) {
        let vc = document.createElement('div')
        vc.setAttribute('class', 'vc')
        vc.setAttribute('id', uuid)

        let v = document.createElement('video')
        v.setAttribute('autoplay', '')

        v.srcObject = e.streams[0]

        vc.appendChild(v)
        app.appendChild(vc)
        resize_layout()
    }
}

function check_disconnect(e, uuid) {
    let state = peers[uuid].pc.iceConnectionState
    if (state === "failed" || state === "closed" || state === "disconnected") {
        delete peers[uuid]
        document.getElementById(uuid).remove()
        resize_layout()
    }
}

function created_description(desc, uuid) {
    console.log('created_description fired ', uuid)
    peers[uuid].pc.setLocalDescription(desc).then(function () {
        socket.send(JSON.stringify({ 'sdp': peers[uuid].pc.localDescription, 'uuid': local_uuid, 'target': uuid }))
    }).catch(error_handler)
}

function socket_on_message(m) {
    m = JSON.parse(m.data)
    //console.log('socket.onmessage fired ', m)
    let peer_uuid = m.uuid

    // ignore messages from ourselves
    if (peer_uuid == local_uuid || (m.target != local_uuid && m.target != 'all')) return

    if (m.username && m.target == 'all') {
        add_peer(peer_uuid, m.username)
        socket.send(JSON.stringify({ 'username': local_username, 'uuid': local_uuid, 'target': peer_uuid }))
    }
    else if (m.username && m.target == local_uuid) {
        add_peer(peer_uuid, m.username, true)
    }
    else if (m.sdp) {
        peers[peer_uuid].pc.setRemoteDescription(new RTCSessionDescription(m.sdp))
            .then(function () {
                if (m.sdp.type == 'offer') {
                    peers[peer_uuid].pc.createAnswer()
                        .then(description => created_description(description, peer_uuid)).catch(error_handler)
                }
            })
    }
    else if (m.ice) {
        peers[peer_uuid].pc.addIceCandidate(new RTCIceCandidate(m.ice)).catch(error_handler)
    }
}

function socket_on_open() {
    console.log('socket.onopen fired')
    socket.send(JSON.stringify({
        'username': local_username,
        'uuid': local_uuid,
        'target': 'all'
    }))
}

function error_handler(error) {
    console.log(error)
}


function resize_layout() {
    let video_count = app.children.length
    let ow = app.offsetWidth
    let oh = app.offsetHeight

    let resize = (w, h, el, flexDirection = 'column') => {
        el.style.width = w + 'px'
        el.style.height = h + 'px'
        app.style.flexDirection = flexDirection
    }

    for (var i = 0; i < video_count; i++) {
        let w = 0, h = 0
        if (video_count == 1) { w = ow; h = oh; resize(w, h, app.children[i]); }

        if (video_count == 2) {
            if (ow > oh) { w = ow / 2; h = oh; }
            else { w = ow; h = oh / 2; }
            resize(w, h, app.children[i]);
        }

        if (video_count == 3) {
            if (ow > oh) {
                w = ow / 2
                h = oh / 2
                if (i == 2) h = oh
                resize(w, h, app.children[i])
            }
            else {
                w = ow / 2
                h = oh / 2
                if (i == 2) w = ow
                resize(w, h, app.children[i], 'row')
            }
        }

        if (video_count == 4) {
            w = ow / 2
            h = oh / 2
            resize(w, h, app.children[i])
        }

        if (video_count == 5 || video_count == 6) {
            if (ow > oh) { w = ow / 3; h = oh / 2; }
            else { w = ow / 2; h = oh / 3; }
            resize(w, h, app.children[i])
        }

        if (video_count > 6) {
            if (ow > oh) { w = ow / 4; h = oh / 3; }
            else { w = ow / 3; h = oh / 4; }
            resize(w, h, app.children[i])
        }
    }

}





// Taken from http://stackoverflow.com/a/105074/515584
// Strictly speaking, it's not a real UUID, but it gets the job done here
function createUUID() {
    function s4() { return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1) }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4()
}