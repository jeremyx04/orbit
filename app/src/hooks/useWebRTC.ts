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
  const remoteConnectionRef = useRef<PeerConnection|undefined>(undefined);

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
    if(!socketRef.current) {
      socketRef.current = io(BACKEND_URL);

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
      })
    }
    
    return () => {
      if(localConnectionRef.current) {
        localConnectionRef.current.signalingServer.disconnect();
        localConnectionRef.current.rtcConnection.close();
        localConnectionRef.current.rtcDataChannel?.close();
      }
      if(remoteConnectionRef.current) {
        remoteConnectionRef.current.signalingServer.disconnect();
        remoteConnectionRef.current.rtcConnection.close();
        remoteConnectionRef.current.rtcDataChannel?.close();
      }
    }
  }, []);

  return { sendMessage };
}