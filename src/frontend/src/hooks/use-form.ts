import React, { useState, useEffect, useCallback } from 'react';
import { UserRole } from '../../../shared/types';

interface UseFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  setValue: (field: keyof T, value: any) => void;
  setError: (field: keyof T, error: string) => void;
  setTouched: (field: keyof T, touched: boolean) => void;
  setValuesCustom: (values: Partial<T>) => void;
  setErrors: (errors: Partial<Record<keyof T, string>>) => void;
  setTouchedFields: (touched: Partial<Record<keyof T, boolean>>) => void;
  handleChange: (field: keyof T) => (value: any) => void;
  handleBlur: (field: keyof T) => () => void;
  handleSubmit: (onSubmit: (values: T) => Promise<void> | void) => (e: React.FormEvent) => Promise<void>;
  reset: () => void;
  validate: () => boolean;
}

export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validationSchema?: (values: T) => Partial<Record<keyof T, string>>
): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouchedState] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = Object.keys(errors).length === 0;

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
  }, []);

  const setValuesCustom = useCallback((values: Partial<T>) => {
    setValues(prev => ({ ...prev, ...values }));
  }, []);

  const setError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const setTouched = useCallback((field: keyof T, touched: boolean) => {
    setTouchedState(prev => ({ ...prev, [field]: touched }));
  }, []);

  const setTouchedFields = useCallback((touched: Partial<Record<keyof T, boolean>>) => {
    setTouchedState(prev => ({ ...prev, ...touched }));
  }, []);

  const handleChange = useCallback((field: keyof T) => (value: any) => {
    setValue(field, value);
    if (errors[field]) {
      setError(field, '');
    }
  }, [errors, setValue, setError]);

  const handleBlur = useCallback((field: keyof T) => () => {
    setTouched(field, true);
    if (validationSchema) {
      const fieldErrors = validationSchema(values);
      if (fieldErrors[field]) {
        setError(field, fieldErrors[field]!);
      }
    }
  }, [values, validationSchema, setTouched, setError]);

  const handleSubmit = useCallback((onSubmit: (values: T) => Promise<void> | void) => async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (validationSchema) {
        const validationErrors = validationSchema(values);
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          return;
        }
      }

      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validationSchema]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouchedState({});
    setIsSubmitting(false);
  }, [initialValues]);

  const validate = useCallback((): boolean => {
    if (validationSchema) {
      const validationErrors = validationSchema(values);
      setErrors(validationErrors);
      return Object.keys(validationErrors).length === 0;
    }
    return true;
  }, [values, validationSchema]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    setValue,
    setError,
    setTouched,
    setValuesCustom,
    setErrors,
    setTouchedFields,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    validate,
  };
}
