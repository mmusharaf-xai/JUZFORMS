import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formsApi } from '@/lib/api';
import type { Form, FormField, HeaderFooterConfig, GridItem, ButtonSettings, ApiConfig } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ReactSelect from 'react-select';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import axios from 'axios';

const PublicForm: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);

  useEffect(() => {
    const fetchForm = async () => {
      if (!id) return;
      try {
        const response = await formsApi.getPublicForm(id);
        setForm(response.data.form);
        // Initialize form data
        const initialData: Record<string, unknown> = {};
        (response.data.form.fields || []).forEach((field: FormField) => {
          initialData[field.id] = '';
        });
        setFormData(initialData);
      } catch (err) {
        setError(t('forms.formNotPublished'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchForm();
  }, [id, t]);

  const handleFieldChange = (fieldId: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const validateForm = (): boolean => {
    if (!form) return false;

    for (const field of form.fields) {
      if (field.is_required) {
        const value = formData[field.id];
        if (!value || (typeof value === 'string' && !value.trim())) {
          setError(t('validation.required', { field: field.label }));
          return false;
        }
      }

      // Type-specific validation
      const value = formData[field.id] as string;
      if (value) {
        switch (field.type) {
          case 'EMAIL':
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              setError(t('validation.invalidEmail', { field: field.label }));
              return false;
            }
            break;
          case 'URL':
            try {
              new URL(value);
            } catch {
              setError(t('validation.invalidUrl', { field: field.label }));
              return false;
            }
            break;
          case 'JSON':
            try {
              JSON.parse(value);
            } catch {
              setError(t('validation.invalidJson', { field: field.label }));
              return false;
            }
            break;
          case 'NUMBER':
            if (isNaN(Number(value))) {
              setError(t('validation.invalidNumber', { field: field.label }));
              return false;
            }
            break;
        }
      }
    }

    return true;
  };

  const handleButtonClick = async (item: GridItem) => {
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    const settings = item.settings as ButtonSettings;
    setIsSubmitting(true);

    try {
      if (settings.action_type === 'api_call' && settings.api_config) {
        const apiConfig = settings.api_config;
        let body: Record<string, unknown> = {};
        let headers: Record<string, string> = {};
        let params: Record<string, string> = {};

        // Process headers
        apiConfig.headers?.forEach((h) => {
          if (h.use_field && form) {
            const field = form.fields.find((f) => f.id === h.use_field);
            if (field) {
              headers[h.key] = String(formData[field.id] || '');
            }
          } else {
            headers[h.key] = h.value;
          }
        });

        // Process query params
        apiConfig.query_params?.forEach((p) => {
          if (p.use_field && form) {
            const field = form.fields.find((f) => f.id === p.use_field);
            if (field) {
              params[p.key] = String(formData[field.id] || '');
            }
          } else {
            params[p.key] = p.value;
          }
        });

        // Process body
        if (apiConfig.send_full_form_data) {
          const formDataObj: Record<string, unknown> = {};
          form?.fields.forEach((field) => {
            formDataObj[field.label] = formData[field.id];
          });
          body = formDataObj;
        } else {
          apiConfig.body?.forEach((b) => {
            if (b.use_field && form) {
              const field = form.fields.find((f) => f.id === b.use_field);
              if (field) {
                body[b.key] = formData[field.id];
              }
            } else {
              body[b.key] = b.value;
            }
          });
        }

        await axios({
          method: apiConfig.method,
          url: apiConfig.url,
          headers,
          params,
          data: body,
        });

        setSuccess(t('forms.formSubmitted'));
      } else if (settings.action_type === 'database_create') {
        // Submit to our backend which will handle database creation
        await formsApi.submitForm(id!, formData);
        setSuccess(t('forms.formSubmitted'));
      }

      // Clear form
      const clearedData: Record<string, unknown> = {};
      form?.fields.forEach((field) => {
        clearedData[field.id] = '';
      });
      setFormData(clearedData);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || t('errors.failedToSave'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.id];

    switch (field.type) {
      case 'TEXT':
        return (
          <Input
            value={value as string || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );

      case 'LARGE_TEXT':
        return (
          <Textarea
            value={value as string || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            rows={4}
          />
        );

      case 'JSON':
        return (
          <Textarea
            value={value as string || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder='{"key": "value"}'
            rows={4}
            className="font-mono"
          />
        );

      case 'NUMBER':
        return (
          <Input
            type="number"
            value={value as string || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder="Enter number"
          />
        );

      case 'URL':
        return (
          <Input
            type="url"
            value={value as string || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder="https://example.com"
          />
        );

      case 'EMAIL':
        return (
          <Input
            type="email"
            value={value as string || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder="email@example.com"
          />
        );

      case 'PHONE':
        return (
          <Input
            type="tel"
            value={value as string || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder="+1 234 567 8900"
          />
        );

      case 'DATE':
        return (
          <div className="relative">
            <Input
              type="text"
              value={value as string || ''}
              onClick={() => setShowDatePicker(showDatePicker === field.id ? null : field.id)}
              readOnly
              placeholder="Select date"
            />
            {showDatePicker === field.id && (
              <div className="absolute z-10 mt-1 bg-white border rounded-lg shadow-lg">
                <DayPicker
                  mode="single"
                  selected={value ? new Date(value as string) : undefined}
                  onSelect={(date) => {
                    handleFieldChange(field.id, date ? format(date, 'yyyy-MM-dd') : '');
                    setShowDatePicker(null);
                  }}
                />
              </div>
            )}
          </div>
        );

      case 'DATETIME':
        return (
          <Input
            type="datetime-local"
            value={value as string || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        );

      case 'TIME':
        return (
          <Input
            type="time"
            value={value as string || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        );

      case 'DROPDOWN':
        const options = (field.settings.options || []).map((opt: { value: string; label: string }) => ({
          value: opt.value,
          label: opt.label,
        }));
        return (
          <ReactSelect
            options={options}
            isMulti={field.settings.allowMultiple}
            value={field.settings.allowMultiple 
              ? options.filter((o: { value: string }) => (value as string[] || []).includes(o.value))
              : options.find((o: { value: string }) => o.value === value)
            }
            onChange={(selected) => {
              if (field.settings.allowMultiple) {
                handleFieldChange(field.id, (Array.isArray(selected) ? selected : []).map(s => s.value));
              } else {
                handleFieldChange(field.id, (selected as { value: string } | null)?.value || '');
              }
            }}
            placeholder="Select..."
            isClearable
            isSearchable
          />
        );

      case 'RATINGS':
        const maxRating = field.settings.maxRating || 5;
        const currentRating = (value as number) || 0;
        return (
          <div className="flex gap-1">
            {Array.from({ length: maxRating }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleFieldChange(field.id, i + 1)}
                className={`text-3xl transition-colors ${
                  i < currentRating ? 'text-yellow-400' : 'text-gray-300'
                } hover:text-yellow-400`}
              >
                ★
              </button>
            ))}
          </div>
        );

      default:
        return <Input placeholder="Enter value" />;
    }
  };

  const renderGridSection = (config: HeaderFooterConfig) => {
    if (!config.enabled) return null;

    return (
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1 flex justify-start gap-2">
          {config.left.map((item) => renderGridItem(item))}
        </div>
        <div className="flex-1 flex justify-center gap-2">
          {config.center.map((item) => renderGridItem(item))}
        </div>
        <div className="flex-1 flex justify-end gap-2">
          {config.right.map((item) => renderGridItem(item))}
        </div>
      </div>
    );
  };

  const renderGridItem = (item: GridItem) => {
    if (item.type === 'rich_text') {
      return (
        <div
          key={item.id}
          className="prose prose-sm"
          dangerouslySetInnerHTML={{ __html: item.content || '' }}
        />
      );
    }

    const settings = item.settings as ButtonSettings;
    return (
      <Button
        key={item.id}
        onClick={() => handleButtonClick(item)}
        disabled={isSubmitting}
      >
        {isSubmitting ? t('forms.submitting') : settings.label || t('common.submit')}
      </Button>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500">{error || t('forms.formNotFound')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{form.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Header */}
            {renderGridSection(form.header_config)}

            {/* Error/Success Messages */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert variant="success">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Form Fields */}
            <div className="space-y-6">
              {form.fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label className="flex items-center gap-1">
                    {field.label}
                    {field.is_required && <span className="text-red-500">*</span>}
                  </Label>
                  {field.description && (
                    <p className="text-sm text-gray-500">{field.description}</p>
                  )}
                  {renderField(field)}
                </div>
              ))}
            </div>

            {/* Footer */}
            {renderGridSection(form.footer_config)}

            {/* Default Submit if no footer button */}
            {!form.footer_config.enabled && (
              <Button
                className="w-full"
                onClick={() => {
                  if (!validateForm()) return;
                  formsApi.submitForm(id!, formData).then(() => {
                    setSuccess(t('forms.formSubmitted'));
                    const clearedData: Record<string, unknown> = {};
                    form.fields.forEach((f) => { clearedData[f.id] = ''; });
                    setFormData(clearedData);
                  }).catch(() => {
                    setError(t('errors.failedToSave'));
                  });
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? t('forms.submitting') : t('common.submit')}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicForm;
