import React from 'react';
import type { FormField } from '@/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface FieldPreviewProps {
  field: FormField;
}

const FieldPreview: React.FC<FieldPreviewProps> = ({ field }) => {
  const renderField = () => {
    switch (field.type) {
      case 'TEXT':
      case 'URL':
      case 'EMAIL':
      case 'PHONE':
        return (
          <Input
            type={field.type === 'EMAIL' ? 'email' : field.type === 'URL' ? 'url' : 'text'}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            disabled
          />
        );

      case 'LARGE_TEXT':
      case 'JSON':
        return (
          <Textarea
            placeholder={`Enter ${field.label.toLowerCase()}`}
            disabled
          />
        );

      case 'NUMBER':
        return (
          <Input type="number" placeholder="Enter number" disabled />
        );

      case 'DATE':
        return (
          <Input type="date" disabled />
        );

      case 'DATETIME':
        return (
          <Input type="datetime-local" disabled />
        );

      case 'TIME':
        return (
          <Input type="time" disabled />
        );

      case 'DROPDOWN':
        return (
          <select className="w-full border rounded-md p-2 bg-gray-50" disabled>
            <option>Select an option...</option>
            {(field.settings.options || []).map((opt: { value: string; label: string }, i: number) => (
              <option key={i} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );

      case 'RATINGS':
        const maxRating = field.settings.maxRating || 5;
        return (
          <div className="flex gap-1">
            {Array.from({ length: maxRating }).map((_, i) => (
              <span key={i} className="text-gray-300 text-2xl">★</span>
            ))}
          </div>
        );

      default:
        return <Input disabled placeholder="Preview" />;
    }
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1">
        {field.label}
        {field.is_required && <span className="text-red-500">*</span>}
      </Label>
      {field.description && (
        <p className="text-sm text-gray-500">{field.description}</p>
      )}
      {renderField()}
    </div>
  );
};

export default FieldPreview;
