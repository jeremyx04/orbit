import { Socket } from "socket.io-client";

export class PeerConnection {
  rtcConnection: RTCPeerConnection;
  signalingServer: Socket;
  rtcDataChannel?: RTCDataChannel;
  constructor(signalingServer: Socket) {
    this.rtcConnection = new RTCPeerConnection();
    this.signalingServer = signalingServer;

    this.rtcConnection.onicecandidate = (event) => {
      console.log('new candidate boys');
      
      this.signalingServer.emit('ice-candidate', event.candidate);
    }

    // this.rtcDataChannel = this.rtcConnection.createDataChannel("channel");
    
    // this.rtcDataChannel.onopen = (event) => {
    //   console.log('opened data channel');
    // }

    this.setHandlers();
  }

  async initLocal() {
    const res = await this.rtcConnection.createOffer();
    this.rtcConnection.setLocalDescription(res);
    const offer = {
      origin: this.signalingServer.id,
      sdp: JSON.stringify(res),
    }
    this.signalingServer.emit('sdp-offer', offer);
  }

  async initRemote(sdp: RTCSessionDescriptionInit) {
    this.rtcConnection.setRemoteDescription(sdp);
    const res = await this.rtcConnection.createAnswer();
    const answer = {
      origin: this.signalingServer.id,
      sdp: JSON.stringify(res),
    }
    this.signalingServer.emit('sdp-answer', answer);
  }

  private setHandlers = () => {
    this.signalingServer.on('ping', (_event) => {
      console.log('pong');
    })
    this.signalingServer.on('offer', async (offer) => {
      await this.rtcConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.rtcConnection.createAnswer();
      this.rtcConnection.setLocalDescription(answer);
      this.signalingServer.emit('answer', answer);
    })
    this.signalingServer.on('answer', async (answer) => {
      await this.rtcConnection.setRemoteDescription(new RTCSessionDescription(answer));
    })
    this.signalingServer.on('ice-candidate', async (candidate) => {
      await this.rtcConnection.addIceCandidate(candidate);
    });
  }
  
  private setUpDataChannel = () => {
    if(this.rtcDataChannel) {
      this.rtcDataChannel.onopen = () => {
        console.log('data channel open');
      }
      this.rtcDataChannel.onmessage = (event) => {
        console.log(`received message: ${event.data}`);
      }
      this.rtcDataChannel.onclose = () => {
        console.log('data channel closed');
      }
    }
    else {
      console.error('No data channel');
    }
  }
} 