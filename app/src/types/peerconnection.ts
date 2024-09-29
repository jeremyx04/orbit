import { Socket } from "socket.io-client";

export class PeerConnection {
  rtcConnection: RTCPeerConnection;
  signalingServer: Socket;
  rtcDataChannel?: RTCDataChannel;
  constructor(signalingServer: Socket) {
    this.rtcConnection = new RTCPeerConnection();
    this.signalingServer = signalingServer;
    
    this.rtcConnection.onicecandidate = (event) => {
      this.signalingServer.emit('ice-candidate', event.candidate);
    }

    this.rtcDataChannel = this.rtcConnection.createDataChannel('channel');
    this.rtcConnection.ondatachannel = (event) => {
      const receiveChannel = event.channel;
      receiveChannel.onmessage = (e) => {
         console.log(`ondatachannel message: ${e.data}`);
      };
    }

    this.setHandlers();
    
  }
  private setHandlers = () => {
    this.signalingServer.on('ping', (_event) => {
      console.log('pong');
    })
  }
  
} 