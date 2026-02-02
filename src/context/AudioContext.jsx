import { createContext, useContext, useState, useEffect } from 'react';
import { resumeAudioContext } from '@/utils/ambientSynth';

const AudioContext = createContext(null);

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (!context) {
        throw new Error('useAudio must be used within AudioProvider');
    }
    return context;
};

export const AudioProvider = ({ children }) => {
    const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
    const [volume, setVolume] = useState(0.3); // Global ambient volume

    // Load persistence
    useEffect(() => {
        const savedState = localStorage.getItem('ecoplay-ambient-playing');
        console.log('[AudioContext] Loaded persistence:', savedState);
        if (savedState === 'true') {
            setIsAmbientPlaying(true);
        }

        const savedVolume = localStorage.getItem('ecoplay-ambient-volume');
        if (savedVolume) {
            setVolume(parseFloat(savedVolume));
        }
    }, []);

    // Save persistence
    useEffect(() => {
        console.log('[AudioContext] Saving state:', isAmbientPlaying);
        localStorage.setItem('ecoplay-ambient-playing', isAmbientPlaying);
    }, [isAmbientPlaying]);

    useEffect(() => {
        localStorage.setItem('ecoplay-ambient-volume', volume);
    }, [volume]);

    const toggleAmbient = () => {
        console.log('[AudioContext] Toggling ambient. Current:', isAmbientPlaying);

        // Resume context immediately on user click to satisfy browser autoplay policy
        resumeAudioContext().catch(e => console.error(e));

        setIsAmbientPlaying(prev => !prev);
    };

    return (
        <AudioContext.Provider value={{ isAmbientPlaying, toggleAmbient, volume, setVolume }}>
            {children}
        </AudioContext.Provider>
    );
};
