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
  constructor(signalingServer: Socket, id?: string) {
    this.id = id ?? uuidv4();
    this.signalingServer = signalingServer;

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
  }

  async initLocal() {
    this.rtcDataChannel = this.rtcConnection.createDataChannel(`channel-${this.id}`);
    this.setUpDataChannel();
    const res = await this.rtcConnection.createOffer({
      iceRestart: true,
    });
    await this.rtcConnection.setLocalDescription(res);
    const offer = {
      origin: this.signalingServer.id,
      sdp: JSON.stringify(res),
    };
    this.signalingServer.emit('new-sdp-offer', offer);
  }

  async initRemote(sdp: RTCSessionDescriptionInit) {
    await this.rtcConnection.setRemoteDescription(sdp);
    const res = await this.rtcConnection.createAnswer();
    await this.rtcConnection.setLocalDescription(res);
    const answer = {
      sdp: JSON.stringify(res),
    };
    this.signalingServer.emit('sdp-answer', answer);
  }

  private setUpDataChannel = () => {
    if(this.rtcDataChannel) {
      this.rtcDataChannel.onopen = () => {
        console.log('data channel open');
      }
      this.rtcDataChannel.onmessage = (event) => {
        console.log(`received message: ${event.data}`);
        const receiveBuffer = [];
        receiveBuffer.push(event.data);
        const received = new Blob(receiveBuffer);
        console.log(received);
        const fr = new FileReader();
        fr.onload = (event) => {
          console.log('on load', event);
        }
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