
"use client";

import { createContext, useContext, useState, useEffect, useReducer, useCallback } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { debounce } from "@/lib/utils";

// --- Types ---
export interface ColorSettings {
    hue: number;
    saturation: number;
    lightness: number;
}

export interface UserPreferences {
    themeMode: "light" | "dark";
    primaryColor: ColorSettings;
    accentColor: ColorSettings;
    fontFamily: "Poppins" | "Inter" | "Roboto" | "Montserrat";
    fontSize: "14px" | "16px" | "18px";
    sidebarPosition: "left" | "right";
    cardStyle: "glass" | "flat" | "bordered";
    blurIntensity: number;
    borderRadius: number;
    animationsEnabled: boolean;
    density: "compact" | "normal" | "spacious";
    language: "es" | "en";
    customBackground: string;
    showShadows: boolean;
}

interface UserPreferencesContextType {
    preferences: UserPreferences;
    isLoading: boolean;
    updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
    setPreferences: (newPreferences: Partial<UserPreferences>) => void;
    resetPreferences: () => void;
}

// --- Default State ---
export const defaultPreferences: UserPreferences = {
    themeMode: "light",
    primaryColor: { hue: 221, saturation: 83, lightness: 53 },
    accentColor: { hue: 262, saturation: 83, lightness: 60 },
    fontFamily: "Poppins",
    fontSize: "16px",
    sidebarPosition: "left",
    cardStyle: "glass",
    blurIntensity: 10,
    borderRadius: 1,
    animationsEnabled: true,
    density: "normal",
    language: "es",
    customBackground: "",
    showShadows: true,
};

// --- Context ---
const UserPreferencesContext = createContext<UserPreferencesContextType>({
    preferences: defaultPreferences,
    isLoading: true,
    updatePreference: () => {},
    setPreferences: () => {},
    resetPreferences: () => {},
});

export const useUserPreferences = () => useContext(UserPreferencesContext);

// --- Reducer ---
type Action = 
    | { type: 'SET_PREFERENCES'; payload: Partial<UserPreferences> }
    | { type: 'UPDATE_PREFERENCE'; payload: { key: keyof UserPreferences; value: any } }
    | { type: 'SET_LOADING'; payload: boolean };

const preferencesReducer = (state: { preferences: UserPreferences; isLoading: boolean }, action: Action) => {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_PREFERENCES':
            return { ...state, preferences: { ...state.preferences, ...action.payload } };
        case 'UPDATE_PREFERENCE':
            return { ...state, preferences: { ...state.preferences, [action.payload.key]: action.payload.value } };
        default:
            return state;
    }
};

// --- Provider ---
export const UserPreferencesProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useReducer(preferencesReducer, {
        preferences: defaultPreferences,
        isLoading: true,
    });
    
    // --- Firestore Synchronization ---
    const saveToFirestore = useCallback(debounce(async (userId: string, prefs: UserPreferences) => {
        try {
            const userPrefsRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios", userId, "config", "preferences");
            await setDoc(userPrefsRef, prefs);
        } catch (error) {
            console.error("Failed to save preferences to Firestore:", error);
        }
    }, 1500), []);

    // --- Effects ---
    // 1. Initial load from localStorage and Firestore
    useEffect(() => {
        const userId = localStorage.getItem('userId');
        
        const loadPreferences = async () => {
            dispatch({ type: 'SET_LOADING', payload: true });
            
            // First, try loading from local storage for instant UI
            const localPrefsRaw = localStorage.getItem('userPreferences');
            if (localPrefsRaw) {
                try {
                    dispatch({ type: 'SET_PREFERENCES', payload: JSON.parse(localPrefsRaw) });
                } catch (e) {
                    console.error("Could not parse local preferences:", e);
                }
            }

            // Then, fetch from Firestore to get the most up-to-date version
            if (userId) {
                try {
                    const userPrefsRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios", userId, "config", "preferences");
                    const docSnap = await getDoc(userPrefsRef);
                    if (docSnap.exists()) {
                        const firestorePrefs = docSnap.data() as UserPreferences;
                        dispatch({ type: 'SET_PREFERENCES', payload: firestorePrefs });
                        localStorage.setItem('userPreferences', JSON.stringify(firestorePrefs));
                    }
                } catch (error) {
                    console.error("Failed to fetch preferences from Firestore:", error);
                }
            }
            dispatch({ type: 'SET_LOADING', payload: false });
        };
        
        loadPreferences();
    }, []);

    // 2. Apply styles and save to persistence when preferences change
    useEffect(() => {
        const { preferences } = state;
        const root = document.documentElement;

        // Theme mode
        root.classList.toggle('dark', preferences.themeMode === 'dark');

        // Dynamic CSS Variables
        root.style.setProperty('--primary-hue', String(preferences.primaryColor.hue));
        root.style.setProperty('--primary-saturation', `${preferences.primaryColor.saturation}%`);
        root.style.setProperty('--primary-lightness', `${preferences.primaryColor.lightness}%`);
        
        root.style.setProperty('--accent-hue', String(preferences.accentColor.hue));
        root.style.setProperty('--accent-saturation', `${preferences.accentColor.saturation}%`);
        root.style.setProperty('--accent-lightness', `${preferences.accentColor.lightness}%`);

        root.style.setProperty('--font-family', preferences.fontFamily);
        root.style.setProperty('--global-font-size', preferences.fontSize);
        root.style.setProperty('--radius', `${preferences.borderRadius}rem`);
        root.style.setProperty('--blur-intensity', `${preferences.blurIntensity}px`);
        
        // Data attributes for non-variable styles
        root.setAttribute('data-card-style', preferences.cardStyle);
        root.setAttribute('data-animations-enabled', String(preferences.animationsEnabled));
        root.setAttribute('data-show-shadows', String(preferences.showShadows));

        // Save changes
        const userId = localStorage.getItem('userId');
        localStorage.setItem('userPreferences', JSON.stringify(preferences));
        if (userId) {
            saveToFirestore(userId, preferences);
        }
    }, [state.preferences, saveToFirestore]);
    
    // --- Public API ---
    const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
        dispatch({ type: 'UPDATE_PREFERENCE', payload: { key, value } });
    };

    const setPreferences = (newPreferences: Partial<UserPreferences>) => {
        dispatch({ type: 'SET_PREFERENCES', payload: newPreferences });
    };

    const resetPreferences = () => {
        dispatch({ type: 'SET_PREFERENCES', payload: defaultPreferences });
    };
    
    const value = { preferences: state.preferences, isLoading: state.isLoading, updatePreference, setPreferences, resetPreferences };

    return <UserPreferencesContext.Provider value={value}>{children}</UserPreferencesContext.Provider>;
};
