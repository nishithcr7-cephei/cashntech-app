import React, {useEffect, useMemo, useRef, useState} from 'react';
import {View, ActivityIndicator, TouchableOpacity, Text, StyleSheet} from 'react-native';
import {Camera, useCameraDevice} from 'react-native-vision-camera';

type Props = {
  onCaptured: (filePath: string) => void;
  onClose?: () => void;
};

export const InvoiceCamera: React.FC<Props> = ({onCaptured, onClose}) => {
  const device = useCameraDevice('back');
  const cameraRef = useRef<Camera>(null);
  const [busy, setBusy] = useState(false);
  const [waitedMs, setWaitedMs] = useState(0);

  const canUse = useMemo(() => !!device, [device]);

  useEffect(() => {
    if (device) return;
    const id = setInterval(() => setWaitedMs(ms => ms + 250), 250);
    return () => clearInterval(id);
  }, [device]);

  const takePhoto = async () => {
    if (!cameraRef.current || !canUse) return;
    try {
      setBusy(true);
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
        qualityPrioritization: 'balanced',
      });
      onCaptured(photo.path);
    } finally {
      setBusy(false);
    }
  };

  if (!device) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Initializing camera…</Text>
        {waitedMs > 3000 && (
          <Text style={styles.helpText}>Still loading. Ensure camera permission is granted and try reopening.</Text>
        )}
      </View>
    );
  }

  return (
    <View style={{flex: 1}}>
      <Camera
        ref={cameraRef}
        style={{flex: 1}}
        device={device}
        isActive
        photo
      />
      <View style={styles.footer}>
        <TouchableOpacity style={styles.btn} onPress={onClose}><Text style={styles.btnText}>Close</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.primary]} onPress={takePhoto} disabled={busy}>
          <Text style={styles.btnText}>{busy ? 'Capturing…' : 'Capture'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8},
  footer: {position: 'absolute', bottom: 24, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around'},
  btn: {backgroundColor: '#444', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8},
  primary: {backgroundColor: '#0a84ff'},
  btnText: {color: '#fff', fontWeight: '600'},
  helpText: {color: '#666'},
});


