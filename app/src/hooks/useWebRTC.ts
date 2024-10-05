import { useCallback, useEffect, useRef } from "react";
import io, { Socket } from "socket.io-client";
import { PeerConnection } from "../types/peerconnection";
import { BACKEND_URL } from "../services/config";
import { SDP } from '../../../common/types';

type Props = {
  onMessageReceived: (message: string) => void;
}

export const useWebRTC = ({ onMessageReceived } : Props) => {
  const socketRef = useRef<Socket | undefined>(undefined);
  const localConnectionRef = useRef<PeerConnection|undefined>(undefined);
  const remoteConnectionsRef = useRef<PeerConnection[]>([]);

  const sendMessage = useCallback((message: string) => {
    if(localConnectionRef.current?.rtcDataChannel) {
      console.log(localConnectionRef.current.rtcDataChannel);
      localConnectionRef.current.rtcDataChannel.send(message);
      console.log('sending message ' + message);
    } else {
      console.error('Data channel is closed');
    }
  }, []);

  useEffect(() => {
    const remoteConnections = remoteConnectionsRef.current;

    if(!socketRef.current) {
      socketRef.current = io(BACKEND_URL);
      // Make connection to signaling server, which will respond with init
      // On init, make a local PeerConnection instance, and send an offer to already existing users
      // Already existing users should reply with an answer, and also their own offer
      // Then, reply to existing users with an answer, and connections should be made.
      socketRef.current.on('init', () => {
        localConnectionRef.current = new PeerConnection(socketRef.current!);
        localConnectionRef.current.initLocal();
        console.log(localConnectionRef.current.signalingServer.id);
      }); 

      socketRef.current.on('new-peer', (id) => {
        const newConnection = new PeerConnection(socketRef.current!, id);
        remoteConnectionsRef.current.push(newConnection);
      })

      // Already existing users receive this when a new client connects
      socketRef.current.on('new-sdp-offer', async (sdp: SDP) => {
        let remoteConnection = remoteConnectionsRef.current.find((current) => {
          return current.id === sdp.origin;
        });
        if(remoteConnection) {
          console.log('replying to sender');
          await remoteConnection.initRemote(JSON.parse(sdp.sdp), remoteConnection.id);
          const res: SDP = { 
            origin: localConnectionRef.current!.signalingServer.id,
            target: remoteConnection.id,
            sdp: JSON.stringify(localConnectionRef.current!.rtcConnection.localDescription),
          };
          socketRef.current?.emit('sdp-offer', res);
        }
      });
      
      // This is the offer the new client receives from already existing users
      socketRef.current.on('sdp-offer', async (sdp: SDP) => {
        // Add the new peer
        const newConnection = new PeerConnection(socketRef.current!, sdp.origin);
        remoteConnectionsRef.current.push(newConnection);
        console.log(sdp.sdp);
        newConnection.initRemote(JSON.parse(sdp.sdp), sdp.origin!);
      });

      socketRef.current.on('sdp-answer', async (sdp: string) => {
        if(localConnectionRef.current) {
          await localConnectionRef.current.rtcConnection.setRemoteDescription(JSON.parse(sdp));
        }
      });
      
      socketRef.current.on('new-sdp-answer', async (sdp: string) => {
        
      });

      socketRef.current.on('ice-candidate', async (candidate: string) => {
        if(localConnectionRef.current && localConnectionRef.current.rtcConnection.remoteDescription != null) {
            await localConnectionRef.current.rtcConnection.addIceCandidate(JSON.parse(candidate));
        }
      })
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