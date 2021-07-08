import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as remoteActions from '../actions/remoteVideoUserActions';
import * as localActions from '../actions/localVideoUserActions';
import * as participantActions from '../actions/participantListActions';
import * as deviceManagementActions from '../actions/deviceActions';
import * as threadActions from '../actions/threadActions';
import Participants from './participantList';
import copy from '../assets/images/copy.svg';
import mic from '../assets/images/mic.svg';
import mute_mic from '../assets/images/mute_mic.svg';
import video from '../assets/images/video.svg';
import video_off from '../assets/images/video-off.svg';
import callend from '../assets/images/callend.svg';
import '../styles/videocall.css';
import { CallClient, VideoStreamRenderer, LocalVideoStream } from '@azure/communication-calling';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import MessageContainer from './messageContainer';
import DeviceSettings from './deviceSettings';

const VideoCall = () => {
  const localStore = useSelector((state) => state.localVideoUser);
  const remoteStore = useSelector((state) => state.remoteVideoUser);
  const navStore = useSelector((state) => state.navigation);
  const deviceStore = useSelector((state) => state.devices);
  const dispatch = useDispatch();
  const rendererViewRef = useRef();
  const remoteRendererViewRef = useRef();
  const callRef = useRef();
  const deviceManagerRef = useRef();
  const joinCall = async () => {
    const userToken =
      'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEwMiIsIng1dCI6IjNNSnZRYzhrWVNLd1hqbEIySmx6NTRQVzNBYyIsInR5cCI6IkpXVCJ9.eyJza3lwZWlkIjoiYWNzOmVjZTY2ZjY5LTEwMWQtNDVhYi05OTBjLTk2NDE1MjU1M2U2YV8wMDAwMDAwYi0yNDA0LTc2NDUtNTRiNy1hNDNhMGQwMGUzMzAiLCJzY3AiOjE3OTIsImNzaSI6IjE2MjU3MTQ1MTMiLCJleHAiOjE2MjU4MDA5MTMsImFjc1Njb3BlIjoidm9pcCIsInJlc291cmNlSWQiOiJlY2U2NmY2OS0xMDFkLTQ1YWItOTkwYy05NjQxNTI1NTNlNmEiLCJpYXQiOjE2MjU3MTQ1MTN9.iIgYq-Ywk0WvkE398kom0h_YJ_G9FjuEPe02kVfAIt3RuVRkfKhxnR0I01VCy6JNO_f9ZP5TfcrPuV7_SWbK0gqGSY0UVnrHS0_zatjWx1ImptCXHWrsKSij5X0Jr8GN0ZdW1tyQ8QbNobPboT0wC9F2afCzDziMa1HPIIcn6hc7n-A819S_Aqmp3fAn1uoB_v_c8pbMXD9lETOaGRkBNQF0WKMBT2qnuPTeGOY8S-tlO2ARBK4mgqCCnV39MZ3XvgmlnDBQEl1ixaLcLeIwuvmpjo4MZuKs_koCOCH2MYZ6P65JU57St5hTvL2bEqwfVnfouKklinHbLEoxzF4Ekg';
    let callClient = new CallClient();
    const tokenCredential = new AzureCommunicationTokenCredential(userToken);
    const callAgent = await callClient.createCallAgent(tokenCredential, {
      displayName: 'Mahak Gupta',
    });
    dispatch(localActions.SetDisplayName({ displayName: 'Mahak Gupta' }));
    dispatch(
      participantActions.AddParticipant({
        user: {
          userId: '8:acs:ece66f69-101d-45ab-990c-964152553e6a_0000000b-2404-7645-54b7-a43a0d00e330',
          displayName: 'Mahak Gupta',
        },
      }),
    );
    dispatch(
      localActions.SetUserId({
        userId: '8:acs:ece66f69-101d-45ab-990c-964152553e6a_0000000b-2404-7645-54b7-a43a0d00e330',
      }),
    );
    // dispatch(
    //   threadActions.SetThreadId({
    //     threadId: '19:HTOg4V-bNfYPLgr0a2T70v5Hv367bdf1Nh0X15meWOg1@thread.v2',
    //   }),
    // );
    const deviceManager = await callClient.getDeviceManager();
    deviceManagerRef.current = deviceManager;
    const context = { groupId: '577d1801-2912-49c4-9e3e-b9672e9fc0c6' };
    const call = callAgent.join(context);
    callRef.current = call;
    const cameras = await deviceManager.getCameras();
    const camera = cameras[0];
    const localVideo = new LocalVideoStream(camera);
    dispatch(localActions.AddLocalStream({ localVideoStream: localVideo }));
    await call.startVideo(localVideo);
    console.log(call.state);
    call.on('stateChanged', () => {
      console.log(call);
      if (localStore.isMute != call.isMuted) dispatch(localActions.ToggleMic());
      if (call.remoteParticipants.length !== 0) {
        dispatch(
          remoteActions.AddRemoteStream({
            remoteVideoStream: call.remoteParticipants[0].videoStreams[0],
          }),
        );
      }
    });
    call.on('remoteParticipantsUpdated', () => {
      if (call.remoteParticipants.length !== 0) {
        call.remoteParticipants[0].on('stateChanged', (state) => {
          console.log(state, call.remoteParticipants[0]);
          if (state === 'Connected') {
            dispatch(
              remoteActions.SetRemoteUserName({
                displayName: call.remoteParticipants[0].displayName,
              }),
            );
            dispatch(
              participantActions.AddParticipant({
                user: { userId: 'user 2', displayName: call.remoteParticipants[0].displayName },
              }),
            );
            dispatch(
              remoteActions.AddRemoteStream({
                remoteVideoStream: call.remoteParticipants[0].videoStreams[0],
              }),
            );
          }
        });
      }
    });
    call.on('isMutedChanged', () => {
      console.log(call.isMuted);
    });
    call.on('localVideoStreamsUpdated', () => {
      console.log('Local video stream updated');
    });
    deviceManager.on('audioDevicesUpdated', async () => {
      const microphones = await deviceManagerRef.current.getMicrophones();
      const speakers = await deviceManagerRef.current.getSpeakers();
      dispatch(
        deviceManagementActions.UpdateAudioDevices({
          microphones: microphones,
          speakers: speakers,
        }),
      );
    });
    deviceManager.on('selectedMicrophoneChanged', () => {
      console.log('microphone changed', deviceManager.selectedMicrophone);
    });
    deviceManager.on('selectedSpeakerChanged', () => {
      console.log('speaker changed', deviceManager.selectedSpeaker);
    });
  };

  const deviceManagement = async () => {
    const microphones = await deviceManagerRef.current.getMicrophones();
    const speakers = await deviceManagerRef.current.getSpeakers();
    const selectedMicrophone = deviceManagerRef.current.selectedMicrophone;
    const selectedSpeaker = deviceManagerRef.current.selectedSpeaker;
    dispatch(
      deviceManagementActions.SetDevices({
        microphones: microphones,
        speakers: speakers,
        microphone: selectedMicrophone,
        speaker: selectedSpeaker,
      }),
    );
  };

  const renderLocalVideoStream = async () => {
    if (localStore.localVideoStream && localStore.isVideoOn) {
      const renderer = new VideoStreamRenderer(localStore.localVideoStream);
      rendererViewRef.current = await renderer.createView({
        scalingMode: 'Crop',
        isMirrored: true,
      });
      const container = document.getElementById('local-video');
      container.appendChild(rendererViewRef.current.target);
    } else if (!localStore.isVideoOn) {
      const container = document.getElementById('local-video');
      container.innerHTML = '';
    }
  };

  const renderRemoteVideoStream = async () => {
    if (remoteStore.remoteVideoStream && remoteStore.remoteVideoStream.isAvailable) {
      const renderer = new VideoStreamRenderer(remoteStore.remoteVideoStream);
      remoteRendererViewRef.current = await renderer.createView({ scalingMode: 'Crop' });
      const container = document.getElementById('remote-video');
      container.appendChild(remoteRendererViewRef.current.target);
    }
  };
  useEffect(() => {
    joinCall();
  }, []);

  useEffect(() => {
    if (deviceManagerRef.current) deviceManagement();
  }, [deviceManagerRef.current]);

  useEffect(() => {
    renderRemoteVideoStream();
  }, [remoteStore.remoteVideoStream]);

  useEffect(() => {
    renderLocalVideoStream();
  }, [localStore.localVideoStream, localStore.isVideoOn]);

  useEffect(() => {
    if (deviceManagerRef.current && deviceStore.microphone !== {}) {
      const changeMicrophone = async () => {
        await deviceManagerRef.current.selectMicrophone(deviceStore.microphone);
      };
      changeMicrophone();
    }
  }, [deviceStore.microphone]);

  useEffect(() => {
    if (deviceManagerRef.current && deviceStore.speaker !== {}) {
      const changeSpeaker = async () => {
        await deviceManagerRef.current.selectSpeaker(deviceStore.speaker);
      };
      changeSpeaker();
    }
  }, [deviceStore.speaker]);

  const handleMute = async () => {
    console.log(localStore.isMute, callRef.current.isMuted);
    if (localStore.isMute) await callRef.current.unmute();
    else await callRef.current.mute();
    dispatch(localActions.ToggleMic());
  };

  const handleOutgoingVideo = async () => {
    if (localStore.isVideoOn) await callRef.current.stopVideo(localStore.localVideoStream);
    else await callRef.current.startVideo(localStore.localVideoStream);
    dispatch(localActions.ToggleVideo());
  };

  const endCall = async () => {
    await callRef.current.hangUp(false);
  };

  return (
    <div className="outer-container">
      <header className="header">
        <p className="light-text">Meeting Code: </p>
        <p className="dark-text">x3yw-hg7u</p>
        <img className="text-icon" src={copy} alt="copy" />
        <p className="time-text">00:45</p>
      </header>
      <div className="outer-video-container">
        {navStore.isParticipantListActive ? (
          <Participants />
        ) : navStore.isChatActive ? (
          <MessageContainer />
        ) : (
          <DeviceSettings />
        )}
        <div id="local-video" className="video-container"></div>
        <div id="remote-video" className="video-container"></div>
      </div>
      <footer className="controller">
        {localStore.isMute ? (
          <img className="controller-icon" src={mute_mic} alt="mic" onClick={handleMute} />
        ) : (
          <img className="controller-icon" src={mic} alt="mic" onClick={handleMute} />
        )}
        {localStore.isVideoOn ? (
          <img className="controller-icon" src={video} alt="video" onClick={handleOutgoingVideo} />
        ) : (
          <img
            className="controller-icon"
            src={video_off}
            alt="video_off"
            onClick={handleOutgoingVideo}
          />
        )}
        <img className="controller-icon" src={callend} alt="callend" onClick={endCall} />
      </footer>
    </div>
  );
};

export default VideoCall;