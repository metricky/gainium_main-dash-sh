import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, X, HelpCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import type { MissingInfoRequest as MissingInfoType } from './types/AIBotTypes';

interface MissingInfoRequestProps {
  requests: MissingInfoType[];
  onSubmit: (responses: Record<string, string>) => void;
  onCancel: () => void;
  className?: string;
}

const MissingInfoRequest: React.FC<MissingInfoRequestProps> = ({
  requests,
  onSubmit,
  onCancel,
  className = '',
}) => {
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle input change
  const handleInputChange = (field: string, value: string) => {
    setResponses((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate responses
  const validateResponses = (): boolean => {
    const newErrors: Record<string, string> = {};

    requests.forEach((request) => {
      const value = responses[request.field];

      if (request.required && (!value || value.trim() === '')) {
        newErrors[request.field] = 'This field is required';
        return;
      }

      if (value && request.type === 'number') {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue <= 0) {
          newErrors[request.field] = 'Please enter a valid positive number';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateResponses()) {
      onSubmit(responses);
    }
  };

  // Render input field based on type
  const renderInputField = (request: MissingInfoType) => {
    const value = responses[request.field] || '';
    const error = errors[request.field];

    switch (request.type) {
      case 'select':
        return (
          <div className="space-y-xs">
            <Label htmlFor={request.field} className="text-sm font-medium">
              {request.question}
              {request.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(newValue) =>
                handleInputChange(request.field, newValue)
              }
            >
              <SelectTrigger className={error ? 'border-red-300' : ''}>
                <SelectValue placeholder="Select an option..." />
              </SelectTrigger>
              <SelectContent>
                {request.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && (
              <p className="text-red-600 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {error}
              </p>
            )}
          </div>
        );

      case 'number':
        return (
          <div className="space-y-xs">
            <Label htmlFor={request.field} className="text-sm font-medium">
              {request.question}
              {request.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={request.field}
              type="number"
              step="any"
              min="0"
              value={value}
              onChange={(e) => handleInputChange(request.field, e.target.value)}
              placeholder="Enter a number..."
              className={error ? 'border-red-300' : ''}
            />
            {error && (
              <p className="text-red-600 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {error}
              </p>
            )}
          </div>
        );

      case 'text':
      default:
        return (
          <div className="space-y-xs">
            <Label htmlFor={request.field} className="text-sm font-medium">
              {request.question}
              {request.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={request.field}
              type="text"
              value={value}
              onChange={(e) => handleInputChange(request.field, e.target.value)}
              placeholder="Enter your answer..."
              className={error ? 'border-red-300' : ''}
            />
            {error && (
              <p className="text-red-600 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {error}
              </p>
            )}
          </div>
        );
    }
  };

  // Get completion status
  const getCompletionStatus = () => {
    const requiredFields = requests.filter((r) => r.required);
    const completedRequired = requiredFields.filter(
      (r) => responses[r.field] && responses[r.field].trim() !== ''
    );

    return {
      completed: completedRequired.length,
      total: requiredFields.length,
      isComplete: completedRequired.length === requiredFields.length,
    };
  };

  const status = getCompletionStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={className}
    >
      <Card className="border-2 border-yellow-200">
        <CardContent className="p-md">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-xs">
              <HelpCircle className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-base">
                Additional Information Needed
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress indicator */}
          <div className="mb-4 p-sm bg-yellow-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-yellow-800">
                Progress: {status.completed}/{status.total} required fields
              </span>
              {status.isComplete && (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
            </div>
            <div className="w-full bg-yellow-200 rounded-full h-2">
              <div
                className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(status.completed / status.total) * 100}%` }}
              />
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-md max-h-96 overflow-y-auto custom-scrollbar"
          >
            {requests.map((request, index) => (
              <motion.div
                key={request.field}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {renderInputField(request)}
              </motion.div>
            ))}

            {/* Action buttons */}
            <div className="flex gap-xs pt-4 border-t">
              <Button
                type="submit"
                disabled={!status.isComplete}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit Information
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="px-4"
              >
                Cancel
              </Button>
            </div>
          </form>

          {/* Help text */}
          <div className="mt-4 p-sm bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-xs">
              <strong>Tip:</strong> The AI will use this information to refine
              the bot configuration and provide more accurate settings for your
              trading strategy.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MissingInfoRequest;
