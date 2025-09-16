import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CordovaDirect } from "@/lib/cordova-direct";
import { useState } from "react";

export default function CordovaTestPage() {
  const [testResults, setTestResults] = useState<string>("");
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [isTestingCamera, setIsTestingCamera] = useState(false);

  const testPlugins = () => {
    const plugins = CordovaDirect.getAvailablePlugins();
    const results = Object.entries(plugins)
      .map(([key, value]) => `${key}: ${value ? '✅' : '❌'}`)
      .join('\n');
    setTestResults(results);
    alert('Plugins available:\n' + results);
  };

  const testMicrophone = async () => {
    setIsTestingMic(true);
    try {
      const file = await CordovaDirect.captureAudio();
      setTestResults(`✅ Audio captured: ${file.name} (${file.size} bytes)`);
      alert('Audio captured successfully!');
    } catch (error: any) {
      setTestResults(`❌ Mic error: ${error.message}`);
      alert('Mic error: ' + error.message);
    } finally {
      setIsTestingMic(false);
    }
  };

  const testCamera = async () => {
    setIsTestingCamera(true);
    try {
      const imageUri = await CordovaDirect.capturePhoto();
      setTestResults(`✅ Photo captured: ${imageUri}`);
      alert('Photo captured: ' + imageUri);
    } catch (error: any) {
      setTestResults(`❌ Camera error: ${error.message}`);
      alert('Camera error: ' + error.message);
    } finally {
      setIsTestingCamera(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Cordova Plugin Test (v30 - Bulletproof Fixes)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button 
              onClick={testPlugins}
              className="w-full"
              variant="outline"
              data-testid="button-test-plugins"
            >
              Test Plugin Availability
            </Button>
            
            <Button 
              onClick={testMicrophone}
              className="w-full"
              disabled={isTestingMic}
              data-testid="button-test-mic"
            >
              {isTestingMic ? 'Recording... (5 sec test)' : 'Test Microphone (Media Plugin)'}
            </Button>
            
            <Button 
              onClick={testCamera}
              className="w-full"
              disabled={isTestingCamera}
              data-testid="button-test-camera"
            >
              {isTestingCamera ? 'Capturing...' : 'Test Camera (Direct)'}
            </Button>
          </div>

          {testResults && (
            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <pre className="text-sm whitespace-pre-wrap">{testResults}</pre>
            </div>
          )}

          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>v30 Changes (Bulletproof Fixes):</p>
            <ul className="list-disc list-inside">
              <li>Enhanced fetch shim with cleaner init handling</li>
              <li>Camera always returns Blob (no more type errors)</li>
              <li>Robust toImageBlob converter handles all formats</li>
              <li>Audio uses mp4 MIME type for better compatibility</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}