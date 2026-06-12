/**
 * VariableForm Component (Simplified)
 *
 * A simplified form component for creating and editing global variables
 * without external form library dependencies.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useVariableFormValidation } from '@/hooks/useGlobalVariables';
import {
  type GlobalVariable,
  type GlobalVariableFormData,
  type VariableFormMode,
  VARIABLE_TYPE_COLORS,
  VARIABLE_NAME_MAX_LENGTH,
  VARIABLE_VALUE_MAX_LENGTH,
} from '@/types/globalVariables';
import { GlobalVariablesTypeEnum } from '@/types';
import { logger } from '@/lib/loggerInstance';
import { toast } from '@/lib/toast';

interface VariableFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GlobalVariableFormData) => Promise<void>;
  mode: VariableFormMode;
  initialData?: GlobalVariable | null;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

interface FormErrors {
  name?: string | undefined;
  type?: string | undefined;
  value?: string | undefined;
  general?: string | undefined;
}

const VariableForm: React.FC<VariableFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialData,
  isLoading = false,
  title,
  description,
}) => {
  // Form state
  const [formData, setFormData] = useState<GlobalVariableFormData>({
    name: '',
    type: GlobalVariablesTypeEnum.text,
    value: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isValidatingName, setIsValidatingName] = useState(false);
  const [nameValidationResult, setNameValidationResult] = useState<{
    isValid: boolean;
    message?: string;
  } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);

  // Validation hooks
  const { validateValue } = useVariableFormValidation();

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      const newFormData = {
        name: initialData?.name || '',
        type: initialData?.type || GlobalVariablesTypeEnum.text,
        value: initialData?.value || '',
      };

      setFormData(newFormData);
      setErrors({});
      setNameValidationResult(null);
      setHasUnsavedChanges(false);
    }
  }, [isOpen, initialData, mode]);

  // Track changes
  useEffect(() => {
    if (initialData) {
      const hasChanges =
        formData.name !== initialData.name ||
        formData.type !== initialData.type ||
        formData.value !== initialData.value;
      setHasUnsavedChanges(hasChanges);
    } else {
      const hasChanges =
        formData.name.trim() !== '' || formData.value.trim() !== '';
      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, initialData]);

  // Validate name with debouncing - DISABLED due to backend not supporting validateGlobalVariableName
  useEffect(() => {
    // For now, skip real-time name validation since backend doesn't support it
    // The backend will validate on submit and return proper error if name exists
    setNameValidationResult(null);
    setIsValidatingName(false);
    setErrors((prev) => ({ ...prev, name: undefined }));
  }, [formData.name, mode]);

  // Validate value
  useEffect(() => {
    if (formData.value.trim()) {
      const valueError = validateValue(formData.value, formData.type);
      setErrors((prev) => ({ ...prev, value: valueError || undefined }));
    } else {
      setErrors((prev) => ({ ...prev, value: undefined }));
    }
  }, [formData.value, formData.type, validateValue]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Variable name is required';
    } else if (formData.name.trim().length > VARIABLE_NAME_MAX_LENGTH) {
      newErrors.name = `Variable name cannot exceed ${VARIABLE_NAME_MAX_LENGTH} characters`;
    } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(formData.name.trim())) {
      newErrors.name =
        'Variable name must start with a letter or underscore and contain only letters, numbers, and underscores';
    }

    // Validate value
    if (!formData.value.trim()) {
      newErrors.value = 'Value is required';
    } else if (formData.value.trim().length > VARIABLE_VALUE_MAX_LENGTH) {
      newErrors.value = `Value cannot exceed ${VARIABLE_VALUE_MAX_LENGTH} characters`;
    } else {
      const valueError = validateValue(formData.value, formData.type);
      if (valueError) {
        newErrors.value = valueError;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateValue]);

  // Handle input changes
  const handleInputChange = useCallback(
    (
      field: keyof GlobalVariableFormData,
      value: string | GlobalVariablesTypeEnum
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (
        !validateForm() ||
        isValidatingName ||
        nameValidationResult?.isValid === false
      ) {
        return;
      }

      try {
        logger.info('[VariableForm] Submitting form', {
          mode,
          data: { ...formData, value: '[REDACTED]' },
        });

        // Show bot restart warning toast for edit mode
        if (
          mode === 'edit' &&
          initialData?.botAmount &&
          initialData.botAmount > 0
        ) {
          toast.warning(
            `This variable is used by ${initialData.botAmount} bot${initialData.botAmount > 1 ? 's' : ''}. All associated bots will be restarted after saving.`
          );
        }

        await onSubmit(formData);
        setHasUnsavedChanges(false);
      } catch (error) {
        logger.error('[VariableForm] Form submission failed', { error });
        toast.error('Failed to save variable. Please try again.');
      }
    },
    [
      formData,
      validateForm,
      isValidatingName,
      nameValidationResult,
      onSubmit,
      mode,
      initialData,
    ]
  );

  // Handle dialog close. When there are unsaved changes we surface a React
  // confirmation dialog instead of the native window.confirm and keep the
  // form open until the user decides.
  const handleClose = useCallback(() => {
    if (hasUnsavedChanges && mode !== 'view') {
      setShowUnsavedConfirm(true);
      return;
    }
    onClose();
  }, [hasUnsavedChanges, mode, onClose]);

  // Form title and description
  const formTitle =
    title ||
    {
      create: 'Create Global Variable',
      edit: 'Edit Global Variable',
      view: 'View Global Variable',
    }[mode];

  const formDescription =
    description ||
    {
      create:
        'Create a new global variable that can be used across your trading bots.',
      edit: 'Modify the global variable. All associated bots will be restarted after saving.',
      view: 'View the details of this global variable.',
    }[mode];

  // Form validation - simplified since we don't have real-time name validation
  const isFormValid =
    formData.name.trim() !== '' &&
    formData.value.trim() !== '' &&
    !errors.name &&
    !errors.type &&
    !errors.value &&
    !errors.general &&
    !isValidatingName;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto w-[95vw] max-w-[95vw] sm:w-full sm:max-w-[500px]">
        <DialogHeader className="p-lg pb-0">
          <DialogTitle className="flex items-center gap-xs">
            {formTitle}
            {mode === 'edit' && initialData && (
              <Badge
                variant="outline"
                className={`${VARIABLE_TYPE_COLORS[initialData.type].background} ${VARIABLE_TYPE_COLORS[initialData.type].text} ${VARIABLE_TYPE_COLORS[initialData.type].border}`}
              >
                {initialData.type}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>{formDescription}</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-lg px-6"
          id="variable-form"
        >
          {/* Variable Name Field */}
          <div className="space-y-xs">
            <Label htmlFor="variable-name" className="text-sm font-medium">
              Variable Name *
            </Label>
            <div className="relative">
              <Input
                id="variable-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., max_position_size"
                disabled={mode === 'view' || isLoading}
                className={`font-mono pr-10 ${
                  errors.name ? 'border-red-500' : ''
                } ${nameValidationResult?.isValid ? 'border-green-500' : ''}`}
                maxLength={VARIABLE_NAME_MAX_LENGTH}
              />

              {/* Name validation indicator */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isValidatingName && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {!isValidatingName && nameValidationResult && (
                  <>
                    {nameValidationResult.isValid ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Name validation message */}
            {nameValidationResult && !errors.name && (
              <p
                className={`text-xs ${
                  nameValidationResult.isValid
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {nameValidationResult.message}
              </p>
            )}

            {errors.name && (
              <p className="text-xs text-red-600">{errors.name}</p>
            )}

            <p className="text-xs text-muted-foreground">
              Must start with a letter or underscore. Only letters, numbers, and
              underscores allowed.
            </p>
          </div>

          {/* Variable Type Field */}
          <div className="space-y-xs">
            <Label htmlFor="variable-type" className="text-sm font-medium">
              Type *
            </Label>
            <Select
              value={formData.type}
              onValueChange={(v) => {
                // Radix Select can emit an empty/transient value on remount
                // (and under some browser/extension conditions). Guard against
                // it so a stray emission can't blank a valid type — and with
                // it the value — when the edit dialog opens. Also ignore no-op
                // re-selections of the current type.
                const value = v as GlobalVariablesTypeEnum;
                if (!value || value === formData.type) {
                  return;
                }
                // Note: do NOT clear the value on type change. A numeric value
                // is valid across int/float, and the value-validation effect
                // already re-checks it on type change. (Matches main-dash,
                // which never wiped the value.)
                handleInputChange('type', value);
              }}
              disabled={mode === 'view' || isLoading}
            >
              <SelectTrigger id="variable-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={GlobalVariablesTypeEnum.text}>
                  Text
                </SelectItem>
                <SelectItem value={GlobalVariablesTypeEnum.int}>
                  Integer
                </SelectItem>
                <SelectItem value={GlobalVariablesTypeEnum.float}>
                  Float
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-xs text-red-600">{errors.type}</p>
            )}
          </div>

          {/* Variable Value Field */}
          <div className="space-y-xs">
            <Label htmlFor="variable-value" className="text-sm font-medium">
              Value *
            </Label>
            {formData.type === GlobalVariablesTypeEnum.text ? (
              <Textarea
                id="variable-value"
                value={formData.value}
                onChange={(e) => handleInputChange('value', e.target.value)}
                placeholder="Enter text value"
                disabled={mode === 'view' || isLoading}
                className={`font-mono ${errors.value ? 'border-red-500' : ''}`}
                rows={3}
              />
            ) : (
              <Input
                id="variable-value"
                value={formData.value}
                onChange={(e) => handleInputChange('value', e.target.value)}
                placeholder={
                  formData.type === GlobalVariablesTypeEnum.int
                    ? 'Enter integer value (e.g., 123, -456)'
                    : 'Enter decimal value (e.g., 123.45, -67.89)'
                }
                disabled={mode === 'view' || isLoading}
                className={`font-mono ${errors.value ? 'border-red-500' : ''}`}
                type={
                  formData.type === GlobalVariablesTypeEnum.int
                    ? 'number'
                    : 'text'
                }
                step={
                  formData.type === GlobalVariablesTypeEnum.int ? '1' : 'any'
                }
              />
            )}
            {errors.value && (
              <p className="text-xs text-red-600">{errors.value}</p>
            )}

            {/* Type-specific help text */}
            <div className="text-xs text-muted-foreground">
              {formData.type === GlobalVariablesTypeEnum.text && (
                <p>
                  Text values support multiline content and special characters.
                </p>
              )}
              {formData.type === GlobalVariablesTypeEnum.int && (
                <p>
                  Integer values must be whole numbers (positive or negative).
                </p>
              )}
              {formData.type === GlobalVariablesTypeEnum.float && (
                <p>
                  Float values can include decimal points for precise
                  calculations.
                </p>
              )}
            </div>
          </div>
        </form>

        {/* Form Actions */}
        <DialogFooter className="flex flex-col sm:flex-row gap-xs px-6 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {mode === 'view' ? 'Close' : 'Cancel'}
          </Button>

          {mode !== 'view' && (
            <Button
              type="submit"
              form="variable-form"
              disabled={!isFormValid || isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Create Variable' : 'Add to Pending Changes'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={showUnsavedConfirm}
        onOpenChange={setShowUnsavedConfirm}
        title="Discard unsaved changes?"
        description="You have unsaved changes. Are you sure you want to close without saving?"
        confirmText="Discard"
        cancelText="Keep editing"
        variant="destructive"
        onConfirm={() => {
          setShowUnsavedConfirm(false);
          onClose();
        }}
      />
    </>
  );
};

export default VariableForm;
