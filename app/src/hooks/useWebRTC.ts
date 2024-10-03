import { useCallback, useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import { PeerConnection } from "../types/peerconnection";
import { BACKEND_URL } from "../services/config";

type Props = {
  onMessageReceived: (message: string) => void;
}

export const useWebRTC = ({ onMessageReceived } : Props) => {
  const socketRef = useRef<Socket | undefined>(undefined);
  const localConnectionRef = useRef<PeerConnection|undefined>(undefined);
  const remoteConnectionsRef = useRef<PeerConnection[]>([]);

  const sendMessage = useCallback((message: string) => {
    // if(peerConnectionsRef.current?.rtcDataChannel 
    //   && peerConnectionsRef.current.rtcDataChannel.readyState === 'open') {
    //   peerConnectionsRef.current?.rtcDataChannel.send(message);
    // } else {
    //   console.error('Data channel is closed');
    // }
  }, []);

  useEffect(() => {
    const remoteConnections = remoteConnectionsRef.current;

    if(!socketRef.current) {
      socketRef.current = io(BACKEND_URL);
      socketRef.current.on('init', () => {
        localConnectionRef.current = new PeerConnection(socketRef.current!);
        localConnectionRef.current.initLocal();
      }); 
      socketRef.current.on('new-peer', () => {
        const newConnection = new PeerConnection(socketRef.current!);
        remoteConnectionsRef.current.push(newConnection);
      })
      socketRef.current.on('sdp-offer', (sdp: string) => {
        remoteConnectionsRef.current.forEach((connection) => {
          console.log(connection.rtcConnection.signalingState);
          connection.initRemote(JSON.parse(sdp));
        })
      });

      // socketRef.current.on('sdp-answer', (sdp: string) => {
      //   if(peerConnectionRef.current) {
      //     console.log(peerConnectionRef.current.rtcConnection.signalingState);
      //   }
      // });
    }

    return () => {
      if(localConnectionRef.current) {
        localConnectionRef.current.signalingServer.disconnect();
        localConnectionRef.current.rtcConnection.close();
      }
      remoteConnections.forEach((connection) => {
        connection.signalingServer.disconnect();
        connection.rtcConnection.close();
      })
    }
  }, []);

  return { sendMessage };
}