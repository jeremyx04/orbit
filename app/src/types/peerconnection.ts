export class PeerConnection {
  rtcConnection: RTCPeerConnection;
  rtcDataChannel?: RTCDataChannel;
  
  constructor(rtcConnection: RTCPeerConnection, rtcDataChannel?: RTCDataChannel) {
    this.rtcConnection = rtcConnection;
    this.rtcDataChannel = rtcDataChannel
  }
  
}