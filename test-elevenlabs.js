// Simple test to show exactly what gets sent to ElevenLabs
// Run this with: node test-elevenlabs.js

const testElevenLabs = async () => {
  const testData = {
    text: "go home",
    voiceId: "DGzg6RaUqxGRTHSBjfgF", // Drill sergeant
    speed: 1.1,
    stability: 0.95,
    similarityBoost: 1.0
  };

  console.log('🧪 Testing ElevenLabs with exact data:');
  console.log(JSON.stringify(testData, null, 2));

  try {
    const response = await fetch('http://localhost:5000/api/elevenlabs/generate-alarm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    if (response.ok) {
      console.log('✅ ElevenLabs responded successfully');
      console.log('📊 Audio size:', response.headers.get('content-length'), 'bytes');
    } else {
      const error = await response.json();
      console.log('❌ ElevenLabs error:', error);
    }
  } catch (error) {
    console.log('🔥 Network error:', error.message);
  }
};

// Run if this file is executed directly
if (require.main === module) {
  testElevenLabs();
}

module.exports = { testElevenLabs };