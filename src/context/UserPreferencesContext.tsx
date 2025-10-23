
"use client";

import { createContext, useContext, useReducer, useCallback, useEffect } from "react";
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
    fontWeight: "400" | "500" | "600";
    letterSpacing: "normal" | "-0.05em" | "0.05em";
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
    fontWeight: "400",
    letterSpacing: "normal",
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
            return { ...state, preferences: { ...defaultPreferences, ...action.payload } };
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
            await setDoc(userPrefsRef, prefs, { merge: true });
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
            
            const localPrefsRaw = localStorage.getItem('userPreferences');
            if (localPrefsRaw) {
                try {
                    dispatch({ type: 'SET_PREFERENCES', payload: JSON.parse(localPrefsRaw) });
                } catch (e) { console.error("Could not parse local preferences:", e); }
            }

            if (userId) {
                try {
                    const userPrefsRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/usuarios", userId, "config", "preferences");
                    const docSnap = await getDoc(userPrefsRef);
                    if (docSnap.exists()) {
                        const firestorePrefs = docSnap.data() as Partial<UserPreferences>;
                        dispatch({ type: 'SET_PREFERENCES', payload: firestorePrefs });
                        localStorage.setItem('userPreferences', JSON.stringify({ ...defaultPreferences, ...firestorePrefs }));
                    }
                } catch (error) { console.error("Failed to fetch preferences from Firestore:", error); }
            }
            dispatch({ type: 'SET_LOADING', payload: false });
        };
        
        loadPreferences();
    }, []);

    // 2. Apply styles and save to persistence when preferences change
    useEffect(() => {
        const { preferences } = state;
        const root = document.documentElement;

        root.classList.toggle('dark', preferences.themeMode === 'dark');
        
        document.body.classList.remove('density-compact', 'density-normal', 'density-spacious');
        document.body.classList.add(`density-${preferences.density}`);

        const setVar = (key: string, value: string) => root.style.setProperty(key, value);

        setVar('--primary', `hsl(${preferences.primaryColor.hue}, ${preferences.primaryColor.saturation}%, ${preferences.primaryColor.lightness}%)`);
        setVar('--accent', `hsl(${preferences.accentColor.hue}, ${preferences.accentColor.saturation}%, ${preferences.accentColor.lightness}%)`);
        setVar('--font-family', preferences.fontFamily);
        setVar('--global-font-size', preferences.fontSize);
        setVar('--font-weight', preferences.fontWeight);
        setVar('--letter-spacing', preferences.letterSpacing);
        setVar('--radius', `${preferences.borderRadius}rem`);
        setVar('--blur-intensity', `${preferences.blurIntensity}px`);
        
        root.setAttribute('data-card-style', preferences.cardStyle);
        root.setAttribute('data-animations-enabled', String(preferences.animationsEnabled));
        root.setAttribute('data-show-shadows', String(preferences.showShadows));

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
