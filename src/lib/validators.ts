// src/lib/validators.ts

// --- General Validators ---

export const validateRequired = (value: string | number | null | undefined): string | true => {
    if (value === null || value === undefined || String(value).trim() === '') {
        return 'Este campo es requerido.';
    }
    return true;
};

export const validateSelection = (value: string): string | true => {
    if (!value || value === '') {
        return 'Debes seleccionar una opción.';
    }
    return true;
};

// --- Text & Name Validators ---

export const validateName = (value: string): string | true => {
    const requiredValidation = validateRequired(value);
    if (requiredValidation !== true) return requiredValidation;

    if (value.length < 2) return 'Debe tener al menos 2 caracteres.';
    if (value.length > 50) return 'No puede exceder los 50 caracteres.';
    if (!/^[a-zA-Z\s]+$/.test(value)) return 'Solo se permiten letras y espacios.';
    
    return true;
};

// --- Email Validator ---

export const validateEmail = (value: string): string | true => {
    const requiredValidation = validateRequired(value);
    if (requiredValidation !== true) return requiredValidation;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
        return 'Por favor, introduce un correo electrónico válido.';
    }
    return true;
};

// --- Password Validators ---

export const validatePassword = (value: string): string | true => {
    const requiredValidation = validateRequired(value);
    if (requiredValidation !== true) return requiredValidation;

    if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (!/[A-Z]/.test(value)) return 'Debe contener al menos una letra mayúscula.';
    if (!/[a-z]/.test(value)) return 'Debe contener al menos una letra minúscula.';
    if (!/[0-9]/.test(value)) return 'Debe contener al menos un número.';
    if (!/[@#$%^&*]/.test(value)) return 'Debe contener al menos un carácter especial (@, #, $, %, &, *).';
    
    return true;
};

export const validateConfirmPassword = (password: string, confirm: string): string | true => {
    if (password !== confirm) {
        return 'Las contraseñas no coinciden.';
    }
    return true;
};

// --- Numeric & ID Validators ---

export const validateIdNumber = (value: string): string | true => {
    const requiredValidation = validateRequired(value);
    if (requiredValidation !== true) return requiredValidation;

    if (!/^\d+$/.test(value)) return 'Solo se permiten números.';
    if (value.length < 6 || value.length > 12) return 'Debe tener entre 6 y 12 dígitos.';
    
    return true;
};

export const validatePhoneNumber = (value: string): string | true => {
    const requiredValidation = validateRequired(value);
    if (requiredValidation !== true) return requiredValidation;

    if (!/^\d+$/.test(value)) return 'Solo se permiten números.';
    if (value.length < 7 || value.length > 10) return 'La longitud debe ser entre 7 y 10 dígitos.';
    if (!/^3\d{9}$/.test(value) && value.length === 10) return 'Si es un celular, debe empezar con 3 y tener 10 dígitos.';
    
    return true;
};

export const validatePositiveInteger = (value: number | string): string | true => {
    const num = Number(value);
    if (isNaN(num)) return 'Debe ser un número.';
    if (!Number.isInteger(num)) return 'Debe ser un número entero.';
    if (num <= 0) return 'Debe ser un número positivo.';
    
    return true;
};
