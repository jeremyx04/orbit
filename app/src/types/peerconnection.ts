import { Socket } from "socket.io-client";
import {v4 as uuidv4} from "uuid";

const config = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }, 
  ]
};
export class PeerConnection {
  id: string;
  rtcConnection: RTCPeerConnection;
  signalingServer: Socket;
  rtcDataChannel?: RTCDataChannel;
  constructor(signalingServer: Socket) {
    console.log('making a peer connection');
    this.id = uuidv4();
    this.signalingServer = signalingServer;
    console.log(signalingServer.id);
    this.rtcConnection = new RTCPeerConnection(config);



    this.rtcConnection.onicecandidate = (event) => {
      if(event.candidate) {
        this.signalingServer.emit('ice-candidate', JSON.stringify(event.candidate));
      }
    }
    
    this.rtcConnection.onicegatheringstatechange = () => {
      console.log('ICE gathering state:', this.rtcConnection.iceGatheringState);
    };
    
    this.rtcConnection.ondatachannel = (event) => {
      console.log(`my id is ${this.signalingServer.id} getting a data channel `, event.channel);
      this.rtcDataChannel = event.channel;
      this.setUpDataChannel();
    }

    this.setServerHandlers();
  }

  async initLocal() {
    this.rtcDataChannel = this.rtcConnection.createDataChannel(`channel-${this.signalingServer.id}`);
    this.setUpDataChannel();
    const res = await this.rtcConnection.createOffer({
      iceRestart: true,
    });
    await this.rtcConnection.setLocalDescription(res);
    const offer = {
      origin: this.signalingServer.id,
      sdp: JSON.stringify(res),
    };
    this.signalingServer.emit('sdp-offer', offer);
  }

  async initRemote(sdp: RTCSessionDescriptionInit) {
    await this.rtcConnection.setRemoteDescription(sdp);
    const res = await this.rtcConnection.createAnswer();
    await this.rtcConnection.setLocalDescription(res);
    const answer = {
      origin: this.signalingServer.id,
      sdp: JSON.stringify(res),
    };
    this.signalingServer.emit('sdp-answer', answer);
    console.log(this.rtcConnection.currentLocalDescription);
    console.log(this.rtcConnection.currentRemoteDescription);
  }

  private setServerHandlers = () => {
    this.signalingServer.on('ping', (_event) => {
      console.log('pong');
    })
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