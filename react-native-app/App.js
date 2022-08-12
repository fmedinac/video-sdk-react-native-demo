import 'react-native-get-random-values';
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */
import React, {useState} from 'react';
import {Video} from '@signalwire/js';
import {RTCView} from 'react-native-webrtc';
import InCallManager from 'react-native-incall-manager';
import styles from './styles';
import Button from './button';
import MyPicker from './picker';
import {NativeModules, Platform} from 'react-native';
import {
  SafeAreaView,
  Text,
  View,
  Modal,
  Image,
  TextInput,
  DeviceEventEmitter,
} from 'react-native';

const App = () => {
  const {InteractionModule} = NativeModules;

  const [stream, setStream] = useState(null);

  const [modal, setModalVisibility] = useState(true);
  const [joinEnabled, setJoinEnabled] = useState(true);
  const [roomObj, setRoomObj] = useState(null);

  const [token, onChangeToken] = React.useState('');

  React.useEffect(() => {
    checkPermission();
    DeviceEventEmitter.addListener('Proximity', function (data) {
      console.log('Proximity sensor data', data);
    });
    DeviceEventEmitter.addListener('WiredHeadset', function (data) {
      console.log('WiredHeadset data', data);
    });
    DeviceEventEmitter.addListener('onAudioFocusChange', function (data) {
      console.log('onAudioFocusChange data', data);
    });
  }, []);

  const start = async isAudience => {
    if (!joinEnabled) {
      return;
    }
    setJoinEnabled(false);

    const room = new Video.RoomSession({
      token: token,
      logLevel: 'silent',
    });
    setRoomObj(room);

    InCallManager.start({media: 'audio'});

    room.on('room.ended', params => {
      console.debug('>> DEMO room.ended', params);
    });

    room.on('room.joined', params => {
      console.debug('>> DEMO room.joined', params);

      setStream(room.remoteStream);
      console.log(room);
      console.log('Remote stream:', room.remoteStream.toURL());
      setModalVisibility(false);
      setJoinEnabled(true);
    });

    try {
      if (isAudience) {
        await room.joinAudience();
      } else {
        await room.join();
      }
      console.log(`Room Joined as ${isAudience ? 'audience' : 'host'}`);
    } catch (error) {
      setJoinEnabled(true);
      console.error('Error', error);
    }
  };

  const stop = () => {
    if (stream) {
      stream.release();
      setStream(null);
      setRoomObj(null);
      InCallManager.stop();
    }
  };

  const leaveMeeting = async () => {
    try {
      await roomObj?.leave();
    } catch (e) {}
    stop();
    setModalVisibility(true);
    setJoinEnabled(true);
  };

  const startScreenShare = async () => {
    if (Platform.OS === 'android') {
      InteractionModule.launch();
    }
    await roomObj?.startScreenShare();
  };

  const checkPermission = async () => {
    if (InCallManager.recordPermission !== 'granted') {
      InCallManager.requestRecordPermission()
        .then(requestedRecordPermissionResult => {
          console.log(
            'InCallManager.requestRecordPermission() requestedRecordPermissionResult: ',
            requestedRecordPermissionResult,
          );
        })
        .catch(err => {
          console.log('InCallManager.requestRecordPermission() catch: ', err);
        });
    }
  };

  const setSpeakerOn = () => InCallManager.setForceSpeakerphoneOn(true);
  const setSpeakerOff = () => InCallManager.setForceSpeakerphoneOn(false);

  return (
    <>
      <SafeAreaView style={styles.body}>
        {/* Login */}
        <Modal visible={modal}>
          <View style={styles.body2}>
            <Image
              style={styles.logo}
              source={require('./assets/sw_logo.png')}
            />
            <Text style={styles.titleText}>Video Demo</Text>
            <TextInput
              style={styles.input}
              onChangeText={onChangeToken}
              value={token}
              placeholder="Token"
              keyboardType="default"
            />

            <Button
              style={styles.buttonStyleBlue}
              onTap={() => start(false)}
              titleText={joinEnabled ? 'Join' : 'Loading...'}
              disabled={!joinEnabled}
            />

            <Button
              style={styles.buttonStyleBlue}
              onTap={() => start(true)}
              titleText={joinEnabled ? 'Join as Audience' : 'Loading...'}
              disabled={!joinEnabled}
            />
            <View style={{flex: 1}} />
          </View>
        </Modal>

        {/* Main */}
        {stream && <RTCView streamURL={stream.toURL()} style={styles.stream} />}
        <View style={styles.footer}>
          <View style={styles.container}>
            <MyPicker
              onValueChange={(itemValue, itemIndex) => {
                if (itemValue !== '0') {
                  roomObj?.setLayout({name: itemValue});
                }
              }}
            />
          </View>

          <View style={styles.footer2}>
            <Button
              style={styles.buttonStyle}
              onTap={() => roomObj?.audioMute()}
              titleText="Mute Self"
            />

            <Button
              style={styles.buttonStyle}
              onTap={() => roomObj?.audioUnmute()}
              titleText="UnMute Self"
            />

            <Button
              style={styles.buttonStyle}
              onTap={() => roomObj?.deaf()}
              titleText="Deaf"
            />
            <Button
              style={styles.buttonStyle}
              onTap={() => roomObj?.undeaf()}
              titleText="UnDeaf"
            />
          </View>

          <View style={styles.footer2}>
            <Button
              style={styles.buttonStyle}
              onTap={() => roomObj?.videoMute()}
              titleText="Video mute"
            />

            <Button
              style={styles.buttonStyle}
              onTap={() => roomObj?.videoUnmute()}
              titleText="Video UnMute"
            />

            <Button
              style={styles.buttonStyle}
              onTap={() => roomObj?.hideVideoMuted()}
              titleText="Hide"
            />
            <Button
              style={styles.buttonStyle}
              onTap={() => roomObj?.showVideoMuted()}
              titleText="Show"
            />
          </View>
          <View style={styles.footer2}>
            <Button
              style={styles.buttonStyle}
              onTap={startScreenShare}
              titleText="Screen share"
            />

            <Button
              style={styles.buttonStyle}
              onTap={setSpeakerOn}
              titleText="Speaker"
            />

            <Button
              style={styles.buttonStyle}
              onTap={setSpeakerOff}
              titleText="Earpiece"
            />
          </View>

          <Button
            style={styles.buttonStyleRed}
            onTap={leaveMeeting}
            titleText="Leave"
          />
        </View>
      </SafeAreaView>
    </>
  );
};

export default App;
