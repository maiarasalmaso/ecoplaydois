import { useEffect } from 'react';
import { useAudio } from '@/context/AudioContext';
import { startAmbient, stopAmbient, setAmbientVolume } from '@/utils/ambientSynth';

const AmbientSoundPlayer = () => {
    const { isAmbientPlaying, volume } = useAudio();

    console.log('[AmbientPlayer] Render. Playing:', isAmbientPlaying);

    useEffect(() => {
        console.log('[AmbientPlayer] Effect triggered. Playing:', isAmbientPlaying);
        if (isAmbientPlaying) {
            console.log('[AmbientPlayer] Calling startAmbient...');
            startAmbient().catch(err => console.error('[AmbientPlayer] Error starting:', err));
        } else {
            console.log('[AmbientPlayer] Calling stopAmbient...');
            stopAmbient();
        }

        return () => {
            stopAmbient();
        };
    }, [isAmbientPlaying]);

    useEffect(() => {
        if (isAmbientPlaying) {
            setAmbientVolume(volume);
        }
    }, [volume, isAmbientPlaying]);

    return null; // Logic only
};

export default AmbientSoundPlayer;
