import { useCallback, useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import { PeerConnection } from "../services/peerconnection";

import { SDP } from '../../../common/types';
import { FileMetadata } from "../types/FileMetadata";

type Props = {
  onMessageReceived: (message: string) => void;
}

const BACKEND_URL = 'localhost:3001';
const CHUNK_SIZE = 16384;

export const useWebRTC = ({ onMessageReceived } : Props) => {
  const socketRef = useRef<Socket | undefined>(undefined);
  const localConnectionRef = useRef<PeerConnection|undefined>(undefined);
  const remoteConnectionRef = useRef<PeerConnection|undefined>(undefined);

  const sendMetadata = (file: File) => {
    if(localConnectionRef.current?.rtcDataChannel) {
      const metaData = {
        filename: file.name,
        chunksize: CHUNK_SIZE,
        chunkcount: Math.ceil(file.size / CHUNK_SIZE),
      } as FileMetadata;
      localConnectionRef.current.rtcDataChannel.send(JSON.stringify(metaData));
      console.log('sending message ' + metaData);
    } else {
      console.warn('data channel is closed');
    }
  };

  const sendFile = useCallback((file: File) => {
      sendMetadata(file);
      console.log(`File is ${[file.name, file.size, file.type, file.lastModified].join(' ')}`);
      const fr = new FileReader();
      let offset = 0;
      fr.addEventListener('error', error => console.error('Error reading file:', error));
      fr.addEventListener('abort', event => console.log('File reading aborted:', event));
      fr.addEventListener('load', e => {
        console.log('FileRead.onload ', e);
          if(localConnectionRef.current?.rtcDataChannel) {
          localConnectionRef.current?.rtcDataChannel.send(e.target!.result! as ArrayBuffer);
          offset += (e.target!.result! as ArrayBuffer).byteLength;
          if (offset < file.size) {
            readSlice(offset);
          }
        } else {
          console.warn('data channel is closed');
        }
      });
    const readSlice = (o: number) => {
      const slice = file.slice(offset, o + CHUNK_SIZE);
      fr.readAsArrayBuffer(slice);
    };
    readSlice(0);
  }, []);

  const setHandlers = () => {
    if(socketRef.current) {
      socketRef.current.on('init', (status) => {
        if(status === 'peer') {
          localConnectionRef.current = new PeerConnection(socketRef.current!);
          localConnectionRef.current.initLocal();
        }
      }); 

      socketRef.current.on('new-peer', () => {
        localConnectionRef.current = new PeerConnection(socketRef.current!);
        localConnectionRef.current.initLocal();
        remoteConnectionRef.current = new PeerConnection(socketRef.current!);
      })

      socketRef.current.on('disconnect-remote', async () => {
        if(remoteConnectionRef.current) {
          localConnectionRef.current?.rtcConnection.restartIce();
          remoteConnectionRef.current.rtcConnection.close();
          remoteConnectionRef.current.rtcDataChannel?.close();
          remoteConnectionRef.current = undefined;
        }
      });

      // Already existing user receives this when a new client connects
      socketRef.current.on('new-sdp-offer', async (sdp: SDP) => {
        if(remoteConnectionRef.current) {
          await remoteConnectionRef.current.initRemote(JSON.parse(sdp.sdp));
          const res: SDP = { 
            origin: localConnectionRef.current!.signalingServer.id,
            sdp: JSON.stringify(localConnectionRef.current!.rtcConnection.localDescription),
          };
          socketRef.current?.emit('sdp-offer', res);
        }
      });
      
      // This is the offer the new client receives from the already existing user
      socketRef.current.on('sdp-offer', async (sdp: SDP) => {
        remoteConnectionRef.current = new PeerConnection(socketRef.current!, sdp.origin);
        await remoteConnectionRef.current.initRemote(JSON.parse(sdp.sdp));
      });

      socketRef.current.on('sdp-answer', async (sdp: string) => {
        if(localConnectionRef.current) {
          await localConnectionRef.current.rtcConnection.setRemoteDescription(JSON.parse(sdp));
        }
      });
      
      socketRef.current.on('ice-candidate', async (candidate: string) => {
        if(localConnectionRef.current && localConnectionRef.current.rtcConnection.remoteDescription != null) {
            await localConnectionRef.current.rtcConnection.addIceCandidate(JSON.parse(candidate));
        }
      });
    }
  }

  useEffect(() => {
    if(!socketRef.current) {
      socketRef.current = io(BACKEND_URL);
      setHandlers();
    }
    
    return () => {
      if(localConnectionRef.current) {
        localConnectionRef.current.signalingServer.disconnect();
        localConnectionRef.current.rtcDataChannel?.close();
        localConnectionRef.current.rtcConnection.close();
      }
      if(remoteConnectionRef.current) {
        remoteConnectionRef.current.signalingServer.disconnect();
        remoteConnectionRef.current.rtcDataChannel?.close();
        remoteConnectionRef.current.rtcConnection.close();
      }
    }
  }, []);

  return { sendFile, clients: remoteConnectionRef };
}