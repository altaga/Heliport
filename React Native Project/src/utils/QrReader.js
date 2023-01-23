import { useCameraDevices, Camera } from 'react-native-vision-camera';
import { useScanBarcodes, BarcodeFormat } from 'vision-camera-code-scanner';
import React, { useContext } from 'react';
import ContextModule from './contextModule';
import { useNavigation } from '@react-navigation/native';

export default function QrReader() {
  const Context = useContext(ContextModule)
  const navigation = useNavigation();
  const devices = useCameraDevices();
  const device = devices.back;

  const [frameProcessor, barcodes] = useScanBarcodes([
    BarcodeFormat.ALL_FORMATS, // You can only specify a particular format
  ]);

  const [hasPermission, setHasPermission] = React.useState(false);
  const [isScanned, setIsScanned] = React.useState(false);

  React.useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    const status = await Camera.getCameraPermissionStatus();
    setHasPermission(status === 'authorized');
  };

  React.useEffect(() => {
    toggleActiveState();
    return () => {
      barcodes;
    };
  }, [barcodes]);

  const toggleActiveState = async () => {
    if (barcodes && barcodes.length > 0 && isScanned === false) {
      setIsScanned(true);
      barcodes.forEach(async (scannedBarcode) => {
        if (scannedBarcode.rawValue !== '' && scannedBarcode.rawValue.length === 44) {
          Context.setValue({
            to:scannedBarcode.rawValue
          })
          navigation.goBack();
        }
        else{
          setIsScanned(false);
        }
      });
    }
  };

  return (
    device != null &&
    hasPermission && (
      <Camera
        style={{
          width: '100%',
          height: '100%',
        }}
        device={device}
        isActive={!isScanned}
        frameProcessor={frameProcessor}
        frameProcessorFps={5}
        audio={false}
      />
    )
  );
}