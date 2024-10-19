import { Socket } from "socket.io-client";
import {v4 as uuidv4} from "uuid";
import { FileMetadata } from "../types/FileMetadata";
import { getAvatar } from "./avatar";

const config = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }, 
  ]
};

export class PeerConnection {
  id: string;
  avatar: string;
  rtcConnection: RTCPeerConnection;
  signalingServer: Socket;
  onFileReceivedCallback: () => void;
  private rtcDataChannel?: RTCDataChannel;
  private receivedFile?: Blob;
  private receivedBuffer: ArrayBuffer[] = [];
  private receivedChunks = 0;
  private fileMetaData?: FileMetadata;
  private receivedFileUrl?: string;
  
  constructor(signalingServer: Socket, onFileReceivedCallback: () => void, id?: string, avatar?: string) {
    this.id = id ?? uuidv4();
    this.avatar = avatar ?? getAvatar();
    this.signalingServer = signalingServer;
    this.onFileReceivedCallback = onFileReceivedCallback;

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

  async sendData(message: any) {
    if(this.rtcDataChannel) {
      this.rtcDataChannel.send(message);
    } else {
      console.warn("Data channel not initialized");
    }
  }

  async disconnect() {
    this.rtcConnection.restartIce();
    this.rtcDataChannel?.close();
    this.rtcConnection.close();
  }
  
  getReceivedFileURL() {
    return this.receivedFileUrl;
  }

  getfileMetaData() {
    return this.fileMetaData
  }

  private setUpDataChannel = () => {
    if(this.rtcDataChannel) {
      this.rtcDataChannel.binaryType = 'arraybuffer';
      this.rtcDataChannel.onopen = () => {
        console.log('data channel open');
      }

      this.rtcDataChannel.onmessage = (event) => {
        console.log(event);
        const data = event.data;
        if (typeof data === 'string') {
          const metadata: FileMetadata = JSON.parse(data);
          console.log('Received metadata:', metadata);
          this.receivedFile = new Blob();  
          this.fileMetaData = metadata;
        } else if (data instanceof ArrayBuffer) {
          this.receivedBuffer.push(data);
          this.receivedChunks++;
          if(this.receivedChunks === this.fileMetaData?.chunkCount) {
            this.receivedFile = new Blob(this.receivedBuffer);
            this.receivedBuffer = [];
            this.receivedChunks = 0;
            console.log('Fully received file');
            const fileURL = URL.createObjectURL(this.receivedFile);
            this.receivedFileUrl = fileURL;
            this.onFileReceivedCallback();    
          }
        } else {
          console.warn('Unrecognized message');
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
