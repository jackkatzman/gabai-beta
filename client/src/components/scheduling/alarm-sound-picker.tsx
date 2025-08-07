import React, { useState, useEffect } from 'react';
import { useAlarmSounds } from '@/hooks/use-alarm-sounds';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Mic, Volume2, Play, Square, Upload } from 'lucide-react';

interface AlarmSoundPickerProps {
  onSoundSelected: (soundConfig: any) => void;
  currentSound?: any;
}

export function AlarmSoundPicker({ onSoundSelected, currentSound }: AlarmSoundPickerProps) {
  const { getUserRingtones, generateVoiceAlarm, recordVoiceNote } = useAlarmSounds();
  
  const [soundType, setSoundType] = useState<'system' | 'ringtone' | 'voice-note' | 'ai-voice'>('system');
  const [ringtones, setRingtones] = useState<string[]>([]);
  const [selectedRingtone, setSelectedRingtone] = useState('default');
  const [voiceText, setVoiceText] = useState('Time to wake up! You have important things to do today.');
  const [voicePersonality, setVoicePersonality] = useState<'drill-sergeant' | 'gentle' | 'motivational' | 'funny' | 'angry-mom' | 'grandma'>('gentle');
  const [isRecording, setIsRecording] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [voiceNoteUrl, setVoiceNoteUrl] = useState<string | null>(null);

  useEffect(() => {
    loadRingtones();
  }, []);

  const loadRingtones = async () => {
    const availableRingtones = await getUserRingtones();
    setRingtones(availableRingtones);
  };

  const handleRecordVoiceNote = async () => {
    setIsRecording(true);
    try {
      const audioUrl = await recordVoiceNote();
      if (audioUrl) {
        setVoiceNoteUrl(audioUrl);
        setSelectedSound({
          type: 'voice-note',
          source: audioUrl
        });
      }
    } catch (error) {
      console.error('Recording failed:', error);
    } finally {
      setIsRecording(false);
    }
  };

  const handleGenerateAIVoice = async () => {
    setIsGenerating(true);
    try {
      const audioUrl = await generateVoiceAlarm({
        text: voiceText,
        personality: voicePersonality
      });
      
      if (audioUrl) {
        setSelectedSound({
          type: 'ai-voice',
          source: audioUrl,
          voiceOptions: {
            text: voiceText,
            personality: voicePersonality
          }
        });
      }
    } catch (error) {
      console.error('AI voice generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const setSelectedSound = (soundConfig: any) => {
    onSoundSelected(soundConfig);
  };

  const playPreview = async (soundConfig: any) => {
    try {
      if (previewAudio) {
        previewAudio.pause();
        previewAudio.currentTime = 0;
      }

      let audioUrl = soundConfig.source;
      
      if (soundConfig.type === 'ai-voice' && !audioUrl) {
        setIsGenerating(true);
        audioUrl = await generateVoiceAlarm({
          text: voiceText,
          personality: voicePersonality
        });
        setIsGenerating(false);
      }

      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.volume = 0.5;
        setPreviewAudio(audio);
        
        audio.addEventListener('ended', () => {
          setPreviewAudio(null);
        });
        
        await audio.play();
      }
    } catch (error) {
      console.error('Preview playback failed:', error);
    }
  };

  const stopPreview = () => {
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
      setPreviewAudio(null);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Alarm Sound
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sound Type Selection */}
        <div className="space-y-2">
          <Label>Sound Type</Label>
          <Select value={soundType} onValueChange={(value: any) => setSoundType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System Sound</SelectItem>
              <SelectItem value="ringtone">Device Ringtone</SelectItem>
              <SelectItem value="voice-note">Voice Note</SelectItem>
              <SelectItem value="ai-voice">AI Voice</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ringtone Selection */}
        {soundType === 'ringtone' && (
          <div className="space-y-2">
            <Label>Choose Ringtone</Label>
            <Select value={selectedRingtone} onValueChange={setSelectedRingtone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ringtones.map((ringtone) => (
                  <SelectItem key={ringtone} value={ringtone}>
                    {ringtone.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedSound({ type: 'ringtone', source: selectedRingtone })}
              className="w-full"
            >
              Use This Ringtone
            </Button>
          </div>
        )}

        {/* Voice Note Recording */}
        {soundType === 'voice-note' && (
          <div className="space-y-3">
            <Label>Record Voice Note (Max 10 seconds)</Label>
            <div className="flex gap-2">
              <Button
                variant={isRecording ? "destructive" : "outline"}
                onClick={handleRecordVoiceNote}
                disabled={isRecording}
                className="flex-1"
              >
                <Mic className="h-4 w-4 mr-2" />
                {isRecording ? 'Recording...' : 'Record Voice Note'}
              </Button>
              
              {voiceNoteUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => playPreview({ type: 'voice-note', source: voiceNoteUrl })}
                >
                  <Play className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {voiceNoteUrl && (
              <div className="p-2 bg-muted rounded text-sm">
                ✅ Voice note recorded successfully
              </div>
            )}
          </div>
        )}

        {/* AI Voice Configuration */}
        {soundType === 'ai-voice' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Wake-up Message</Label>
              <Textarea
                value={voiceText}
                onChange={(e) => setVoiceText(e.target.value)}
                placeholder="Enter your custom wake-up message..."
                rows={3}
                maxLength={200}
              />
              <div className="text-xs text-muted-foreground">
                {voiceText.length}/200 characters
              </div>
            </div>

            <div className="space-y-2">
              <Label>Voice Personality</Label>
              <Select value={voicePersonality} onValueChange={(value: any) => setVoicePersonality(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gentle">😌 Gentle & Calm</SelectItem>
                  <SelectItem value="motivational">💪 Motivational Coach</SelectItem>
                  <SelectItem value="drill-sergeant">🎖️ Drill Sergeant</SelectItem>
                  <SelectItem value="funny">😄 Funny & Quirky</SelectItem>
                  <SelectItem value="angry-mom">😤 Angry Mom</SelectItem>
                  <SelectItem value="grandma">👵 Sweet Grandma</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleGenerateAIVoice}
                disabled={isGenerating || !voiceText.trim()}
                className="flex-1"
              >
                {isGenerating ? 'Generating...' : 'Generate AI Voice'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => playPreview({
                  type: 'ai-voice',
                  voiceOptions: { text: voiceText, personality: voicePersonality }
                })}
                disabled={isGenerating}
              >
                <Play className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* System Sound */}
        {soundType === 'system' && (
          <Button
            variant="outline"
            onClick={() => setSelectedSound({ type: 'system' })}
            className="w-full"
          >
            Use Default System Sound
          </Button>
        )}

        {/* Preview Controls */}
        {previewAudio && (
          <div className="flex items-center justify-between p-2 bg-muted rounded">
            <span className="text-sm">Playing preview...</span>
            <Button variant="ghost" size="sm" onClick={stopPreview}>
              <Square className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}