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

    this.rtcConnection.ondatachannel = (event) => {
      console.log(event);
      this.rtcDataChannel = event.channel;
      this.setUpDataChannel();
    }

    this.setHandlers();
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