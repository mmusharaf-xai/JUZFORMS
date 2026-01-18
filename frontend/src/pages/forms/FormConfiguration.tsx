import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { formsApi, databaseApi } from '@/lib/api';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Form, FormField, WidgetType, HeaderFooterConfig, GridItem, Database, DatabaseColumn, ButtonSettings, ApiConfig, DatabaseActionConfig } from '@/types';
import { 
  Save, 
  Eye, 
  ArrowLeft, 
  Trash2, 
  Type,
  AlignLeft,
  Hash,
  Code,
  Link,
  Calendar,
  Clock,
  ChevronDown,
  Phone,
  Mail,
  Star,
  Settings,
  RotateCcw
} from 'lucide-react';
import WidgetItem from '@/components/forms/WidgetItem';
import SortableFieldItem from '@/components/forms/SortableFieldItem';
import HeaderFooterEditor from '@/components/forms/HeaderFooterEditor';
import RichTextEditor from '@/components/forms/RichTextEditor';

const widgetIcons: Record<WidgetType, React.ElementType> = {
  TEXT: Type,
  LARGE_TEXT: AlignLeft,
  NUMBER: Hash,
  JSON: Code,
  URL: Link,
  DATE: Calendar,
  DATETIME: Calendar,
  TIME: Clock,
  DROPDOWN: ChevronDown,
  PHONE: Phone,
  EMAIL: Mail,
  RATINGS: Star,
};

const FormConfiguration: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [headerConfig, setHeaderConfig] = useState<HeaderFooterConfig>({
    enabled: false,
    left: [],
    center: [],
    right: [],
  });
  const [footerConfig, setFooterConfig] = useState<HeaderFooterConfig>({
    enabled: false,
    left: [],
    center: [],
    right: [],
  });
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [selectedGridItem, setSelectedGridItem] = useState<{ item: GridItem; section: 'header' | 'footer'; position: 'left' | 'center' | 'right' } | null>(null);
  const [activeTab, setActiveTab] = useState('canvas');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [databases, setDatabases] = useState<Database[]>([]);
  const [databaseColumns, setDatabaseColumns] = useState<DatabaseColumn[]>([]);

  const widgetTypes: { type: WidgetType; label: string; icon: React.ElementType }[] = [
    { type: 'TEXT', label: t('formBuilder.widgetTypes.TEXT'), icon: widgetIcons.TEXT },
    { type: 'LARGE_TEXT', label: t('formBuilder.widgetTypes.LARGE_TEXT'), icon: widgetIcons.LARGE_TEXT },
    { type: 'NUMBER', label: t('formBuilder.widgetTypes.NUMBER'), icon: widgetIcons.NUMBER },
    { type: 'JSON', label: t('formBuilder.widgetTypes.JSON'), icon: widgetIcons.JSON },
    { type: 'URL', label: t('formBuilder.widgetTypes.URL'), icon: widgetIcons.URL },
    { type: 'DATE', label: t('formBuilder.widgetTypes.DATE'), icon: widgetIcons.DATE },
    { type: 'DATETIME', label: t('formBuilder.widgetTypes.DATETIME'), icon: widgetIcons.DATETIME },
    { type: 'TIME', label: t('formBuilder.widgetTypes.TIME'), icon: widgetIcons.TIME },
    { type: 'DROPDOWN', label: t('formBuilder.widgetTypes.DROPDOWN'), icon: widgetIcons.DROPDOWN },
    { type: 'PHONE', label: t('formBuilder.widgetTypes.PHONE'), icon: widgetIcons.PHONE },
    { type: 'EMAIL', label: t('formBuilder.widgetTypes.EMAIL'), icon: widgetIcons.EMAIL },
    { type: 'RATINGS', label: t('formBuilder.widgetTypes.RATINGS'), icon: widgetIcons.RATINGS },
  ];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [formResponse, dbResponse] = await Promise.all([
          formsApi.getForm(id),
          databaseApi.getDatabases(),
        ]);
        const formData = formResponse.data.form;
        setForm(formData);
        setFields(formData.fields || []);
        setHeaderConfig(formData.header_config || { enabled: false, left: [], center: [], right: [] });
        setFooterConfig(formData.footer_config || { enabled: false, left: [], center: [], right: [] });
        setDatabases(dbResponse.data.databases);
      } catch (err) {
        console.error('Failed to fetch form:', err);
        setError(t('errors.failedToLoad'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, t]);

  const fetchDatabaseColumns = async (dbId: string) => {
    try {
      const response = await databaseApi.getDatabase(dbId);
      setDatabaseColumns(response.data.columns);
    } catch (err) {
      console.error('Failed to fetch columns:', err);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    if (active.id.toString().startsWith('widget-')) {
      const widgetType = active.id.toString().replace('widget-', '') as WidgetType;
      const widget = widgetTypes.find(w => w.type === widgetType);
      const newField: FormField = {
        id: `field-${Date.now()}`,
        type: widgetType,
        label: widget?.label || widgetType,
        description: '',
        is_required: false,
        order: fields.length,
        settings: widgetType === 'DROPDOWN' ? { options: [], allowMultiple: false } : 
                  widgetType === 'RATINGS' ? { maxRating: 5 } : {},
      };
      setFields([...fields, newField]);
      setSelectedField(newField);
      return;
    }

    if (active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        setFields(arrayMove(fields, oldIndex, newIndex).map((f, i) => ({ ...f, order: i })));
      }
    }
  };

  const handleFieldUpdate = useCallback((fieldId: string, updates: Partial<FormField>) => {
    setFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, ...updates } : f))
    );
    if (selectedField?.id === fieldId) {
      setSelectedField((prev) => prev ? { ...prev, ...updates } : null);
    }
  }, [selectedField]);

  const handleDeleteField = (fieldId: string) => {
    setFields((prev) => prev.filter((f) => f.id !== fieldId));
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
  };

  const handleSave = async (publish: boolean = false) => {
    if (!id) return;
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      await formsApi.updateForm(id, {
        fields,
        header_config: headerConfig,
        footer_config: footerConfig,
        is_published: publish ? true : form?.is_published,
      });
      setSuccess(publish ? t('forms.formPublished') : t('forms.formSaved'));
      if (publish) {
        setForm(prev => prev ? { ...prev, is_published: true } : null);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || t('errors.failedToSave'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleGridItemAdd = (section: 'header' | 'footer', position: 'left' | 'center' | 'right', type: 'button' | 'rich_text') => {
    const newItem: GridItem = {
      id: `grid-${Date.now()}`,
      type,
      content: type === 'rich_text' ? '<p>Enter text...</p>' : undefined,
      settings: type === 'button' ? {
        label: t('formBuilder.button'),
        action_type: 'api_call',
        api_config: {
          url: '',
          method: 'POST',
          headers: [],
          query_params: [],
          body: [],
          send_full_form_data: false,
        },
      } : { content: '<p>Enter text...</p>' },
    };

    const config = section === 'header' ? headerConfig : footerConfig;
    const setConfig = section === 'header' ? setHeaderConfig : setFooterConfig;

    setConfig({
      ...config,
      [position]: [...config[position], newItem],
    });

    setSelectedGridItem({ item: newItem, section, position });
    setSelectedField(null);
  };

  const handleGridItemUpdate = (item: GridItem, section: 'header' | 'footer', position: 'left' | 'center' | 'right') => {
    const config = section === 'header' ? headerConfig : footerConfig;
    const setConfig = section === 'header' ? setHeaderConfig : setFooterConfig;

    setConfig({
      ...config,
      [position]: config[position].map((i) => (i.id === item.id ? item : i)),
    });

    setSelectedGridItem({ item, section, position });
  };

  const handleGridItemDelete = (itemId: string, section: 'header' | 'footer', position: 'left' | 'center' | 'right') => {
    const config = section === 'header' ? headerConfig : footerConfig;
    const setConfig = section === 'header' ? setHeaderConfig : setFooterConfig;

    setConfig({
      ...config,
      [position]: config[position].filter((i) => i.id !== itemId),
    });

    if (selectedGridItem?.item.id === itemId) {
      setSelectedGridItem(null);
    }
  };

  const resetHeaderFooter = (section: 'header' | 'footer') => {
    const setConfig = section === 'header' ? setHeaderConfig : setFooterConfig;
    setConfig({
      enabled: section === 'header' ? headerConfig.enabled : footerConfig.enabled,
      left: [],
      center: [],
      right: [],
    });
    setSelectedGridItem(null);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!form) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">{t('forms.formNotFound')}</p>
          <Button onClick={() => navigate('/forms')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/forms')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('common.back')}
              </Button>
              <h1 className="text-xl font-bold">{form.name}</h1>
              {form.is_published && (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                  {t('forms.published')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {form.is_published && (
                <Button
                  variant="outline"
                  onClick={() => window.open(`/form/${form.id}`, '_blank')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {t('forms.preview')}
                </Button>
              )}
              <Button variant="outline" onClick={() => handleSave(false)} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {t('common.save')}
              </Button>
              <Button onClick={() => handleSave(true)} disabled={isSaving}>
                {isSaving ? t('forms.saving') : t('forms.savePublish')}
              </Button>
            </div>
          </div>

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

          {/* Main Content */}
          <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
            {/* Left Panel - Widgets */}
            <div className="col-span-2 bg-white rounded-lg border p-4 overflow-y-auto">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                {t('formBuilder.widgets')}
              </h2>
              <div className="space-y-2">
                {widgetTypes.map((widget) => (
                  <WidgetItem key={widget.type} widget={widget} />
                ))}
              </div>
            </div>

            {/* Center Panel - Canvas */}
            <div className="col-span-7 bg-white rounded-lg border overflow-y-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="border-b px-4">
                  <TabsList>
                    <TabsTrigger value="canvas">{t('formBuilder.canvas')}</TabsTrigger>
                    <TabsTrigger value="header">{t('formBuilder.header')}</TabsTrigger>
                    <TabsTrigger value="footer">{t('formBuilder.footer')}</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="canvas" className="p-4">
                  {headerConfig.enabled && (
                    <HeaderFooterEditor
                      config={headerConfig}
                      section="header"
                      onAddItem={handleGridItemAdd}
                      onUpdateItem={handleGridItemUpdate}
                      onDeleteItem={handleGridItemDelete}
                      onReset={resetHeaderFooter}
                      selectedItemId={selectedGridItem?.section === 'header' ? selectedGridItem.item.id : null}
                      onSelectItem={(item, position) => {
                        setSelectedGridItem({ item, section: 'header', position });
                        setSelectedField(null);
                      }}
                    />
                  )}

                  <div className="min-h-[300px] border-2 border-dashed border-gray-200 rounded-lg p-4 my-4">
                    {fields.length === 0 ? (
                      <div className="text-center text-gray-400 py-12">
                        <p>{t('formBuilder.dragDropHint')}</p>
                      </div>
                    ) : (
                      <SortableContext
                        items={fields.map((f) => f.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3">
                          {fields.map((field) => (
                            <SortableFieldItem
                              key={field.id}
                              field={field}
                              isSelected={selectedField?.id === field.id}
                              onSelect={() => {
                                setSelectedField(field);
                                setSelectedGridItem(null);
                              }}
                              onDelete={() => handleDeleteField(field.id)}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    )}
                  </div>

                  {footerConfig.enabled && (
                    <HeaderFooterEditor
                      config={footerConfig}
                      section="footer"
                      onAddItem={handleGridItemAdd}
                      onUpdateItem={handleGridItemUpdate}
                      onDeleteItem={handleGridItemDelete}
                      onReset={resetHeaderFooter}
                      selectedItemId={selectedGridItem?.section === 'footer' ? selectedGridItem.item.id : null}
                      onSelectItem={(item, position) => {
                        setSelectedGridItem({ item, section: 'footer', position });
                        setSelectedField(null);
                      }}
                    />
                  )}
                </TabsContent>

                <TabsContent value="header" className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Label>{t('formBuilder.enableHeader')}</Label>
                      <Switch
                        checked={headerConfig.enabled}
                        onCheckedChange={(enabled) => setHeaderConfig({ ...headerConfig, enabled })}
                      />
                    </div>
                    {headerConfig.enabled && (
                      <Button variant="outline" size="sm" onClick={() => resetHeaderFooter('header')}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        {t('formBuilder.reset')}
                      </Button>
                    )}
                  </div>
                  {headerConfig.enabled && (
                    <HeaderFooterEditor
                      config={headerConfig}
                      section="header"
                      onAddItem={handleGridItemAdd}
                      onUpdateItem={handleGridItemUpdate}
                      onDeleteItem={handleGridItemDelete}
                      onReset={resetHeaderFooter}
                      selectedItemId={selectedGridItem?.section === 'header' ? selectedGridItem.item.id : null}
                      onSelectItem={(item, position) => {
                        setSelectedGridItem({ item, section: 'header', position });
                        setSelectedField(null);
                      }}
                    />
                  )}
                </TabsContent>

                <TabsContent value="footer" className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Label>{t('formBuilder.enableFooter')}</Label>
                      <Switch
                        checked={footerConfig.enabled}
                        onCheckedChange={(enabled) => setFooterConfig({ ...footerConfig, enabled })}
                      />
                    </div>
                    {footerConfig.enabled && (
                      <Button variant="outline" size="sm" onClick={() => resetHeaderFooter('footer')}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        {t('formBuilder.reset')}
                      </Button>
                    )}
                  </div>
                  {footerConfig.enabled && (
                    <HeaderFooterEditor
                      config={footerConfig}
                      section="footer"
                      onAddItem={handleGridItemAdd}
                      onUpdateItem={handleGridItemUpdate}
                      onDeleteItem={handleGridItemDelete}
                      onReset={resetHeaderFooter}
                      selectedItemId={selectedGridItem?.section === 'footer' ? selectedGridItem.item.id : null}
                      onSelectItem={(item, position) => {
                        setSelectedGridItem({ item, section: 'footer', position });
                        setSelectedField(null);
                      }}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Panel - Settings */}
            <div className="col-span-3 bg-white rounded-lg border p-4 overflow-y-auto">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                {t('formBuilder.settings')}
              </h2>

              {selectedField && (
                <FieldSettings
                  field={selectedField}
                  onUpdate={(updates) => handleFieldUpdate(selectedField.id, updates)}
                />
              )}

              {selectedGridItem && (
                <GridItemSettings
                  item={selectedGridItem.item}
                  section={selectedGridItem.section}
                  position={selectedGridItem.position}
                  fields={fields}
                  databases={databases}
                  databaseColumns={databaseColumns}
                  onFetchColumns={fetchDatabaseColumns}
                  onUpdate={(item) => handleGridItemUpdate(item, selectedGridItem.section, selectedGridItem.position)}
                  onDelete={() => handleGridItemDelete(selectedGridItem.item.id, selectedGridItem.section, selectedGridItem.position)}
                />
              )}

              {!selectedField && !selectedGridItem && (
                <p className="text-gray-400 text-sm">
                  {t('formBuilder.selectToConfig')}
                </p>
              )}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeId && activeId.toString().startsWith('widget-') && (
            <div className="bg-white border rounded-lg p-3 shadow-lg">
              {widgetTypes.find((w) => `widget-${w.type}` === activeId)?.label}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </Layout>
  );
};

// Field Settings Component
interface FieldSettingsProps {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
}

const FieldSettings: React.FC<FieldSettingsProps> = ({ field, onUpdate }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('formBuilder.label')}</Label>
        <Input
          value={field.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>{t('formBuilder.description')}</Label>
        <Textarea
          value={field.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder={t('common.optional')}
        />
      </div>

      <div className="flex items-center gap-3">
        <Label>{t('formBuilder.required')}</Label>
        <Switch
          checked={field.is_required}
          onCheckedChange={(is_required) => onUpdate({ is_required })}
        />
      </div>

      {field.type === 'DROPDOWN' && (
        <div className="space-y-2">
          <Label>{t('formBuilder.options')}</Label>
          <Textarea
            value={(field.settings.options || []).map((o: { value: string }) => o.value).join('\n')}
            onChange={(e) => {
              const options = e.target.value.split('\n').filter(Boolean).map((v) => ({
                label: v.trim(),
                value: v.trim(),
              }));
              onUpdate({ settings: { ...field.settings, options } });
            }}
            placeholder={t('formBuilder.optionsHint')}
            rows={5}
          />
          <div className="flex items-center gap-3">
            <Label>{t('formBuilder.allowMultiple')}</Label>
            <Switch
              checked={field.settings.allowMultiple || false}
              onCheckedChange={(allowMultiple) => 
                onUpdate({ settings: { ...field.settings, allowMultiple } })
              }
            />
          </div>
        </div>
      )}

      {field.type === 'RATINGS' && (
        <div className="space-y-2">
          <Label>{t('formBuilder.maxRating')}</Label>
          <Input
            type="number"
            min={1}
            max={10}
            value={field.settings.maxRating || 5}
            onChange={(e) => 
              onUpdate({ settings: { ...field.settings, maxRating: parseInt(e.target.value) || 5 } })
            }
          />
        </div>
      )}
    </div>
  );
};

// Grid Item Settings Component
interface GridItemSettingsProps {
  item: GridItem;
  section: 'header' | 'footer';
  position: 'left' | 'center' | 'right';
  fields: FormField[];
  databases: Database[];
  databaseColumns: DatabaseColumn[];
  onFetchColumns: (dbId: string) => void;
  onUpdate: (item: GridItem) => void;
  onDelete: () => void;
}

const GridItemSettings: React.FC<GridItemSettingsProps> = ({
  item,
  fields,
  databases,
  databaseColumns,
  onFetchColumns,
  onUpdate,
  onDelete,
}) => {
  const { t } = useTranslation();

  const handleButtonSettingsChange = (updates: Partial<ButtonSettings>) => {
    const currentSettings = (item.settings || {}) as ButtonSettings;
    onUpdate({
      ...item,
      settings: { ...currentSettings, ...updates },
    });
  };

  const handleApiConfigChange = (updates: Partial<ApiConfig>) => {
    const currentSettings = (item.settings || {}) as ButtonSettings;
    onUpdate({
      ...item,
      settings: {
        ...currentSettings,
        api_config: { ...(currentSettings.api_config || {}), ...updates } as ApiConfig,
      },
    });
  };

  const handleDatabaseConfigChange = (updates: Partial<DatabaseActionConfig>) => {
    const currentSettings = (item.settings || {}) as ButtonSettings;
    onUpdate({
      ...item,
      settings: {
        ...currentSettings,
        database_config: { ...(currentSettings.database_config || {}), ...updates } as DatabaseActionConfig,
      },
    });
  };

  if (item.type === 'rich_text') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">{t('formBuilder.richText')}</h3>
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <RichTextEditor
          content={item.content || ''}
          onChange={(content) => onUpdate({ ...item, content })}
        />
      </div>
    );
  }

  const buttonSettings = (item.settings || {}) as ButtonSettings;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{t('formBuilder.buttonSettings')}</h3>
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label>{t('formBuilder.label')}</Label>
        <Input
          value={buttonSettings.label || ''}
          onChange={(e) => handleButtonSettingsChange({ label: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>{t('formBuilder.actionType')}</Label>
        <Select
          value={buttonSettings.action_type || 'api_call'}
          onChange={(e) => handleButtonSettingsChange({ action_type: e.target.value as 'api_call' | 'database_create' })}
          options={[
            { value: 'api_call', label: t('formBuilder.apiCall') },
            { value: 'database_create', label: t('formBuilder.databaseCreate') },
          ]}
        />
      </div>

      {buttonSettings.action_type === 'api_call' && (
        <div className="space-y-4 border-t pt-4">
          <h4 className="font-medium text-sm">{t('formBuilder.apiConfig')}</h4>
          <div className="space-y-2">
            <Label>{t('formBuilder.url')}</Label>
            <Input
              value={buttonSettings.api_config?.url || ''}
              onChange={(e) => handleApiConfigChange({ url: e.target.value })}
              placeholder="https://api.example.com/endpoint"
            />
          </div>
          <div className="space-y-2">
            <Label>{t('formBuilder.method')}</Label>
            <Select
              value={buttonSettings.api_config?.method || 'POST'}
              onChange={(e) => handleApiConfigChange({ method: e.target.value as ApiConfig['method'] })}
              options={[
                { value: 'GET', label: 'GET' },
                { value: 'POST', label: 'POST' },
                { value: 'PUT', label: 'PUT' },
                { value: 'DELETE', label: 'DELETE' },
                { value: 'PATCH', label: 'PATCH' },
              ]}
            />
          </div>
          <div className="flex items-center gap-3">
            <Label>{t('formBuilder.sendFullFormData')}</Label>
            <Switch
              checked={buttonSettings.api_config?.send_full_form_data || false}
              onCheckedChange={(send_full_form_data) => handleApiConfigChange({ send_full_form_data })}
            />
          </div>
        </div>
      )}

      {buttonSettings.action_type === 'database_create' && (
        <div className="space-y-4 border-t pt-4">
          <h4 className="font-medium text-sm">{t('formBuilder.databaseConfig')}</h4>
          <div className="space-y-2">
            <Label>{t('database.title')}</Label>
            <Select
              value={buttonSettings.database_config?.database_id || ''}
              onChange={(e) => {
                handleDatabaseConfigChange({ database_id: e.target.value, field_mappings: [] });
                if (e.target.value) {
                  onFetchColumns(e.target.value);
                }
              }}
              options={[
                { value: '', label: t('formBuilder.selectDatabase') },
                ...databases.map((db) => ({ value: db.id, label: db.name })),
              ]}
            />
          </div>

          {buttonSettings.database_config?.database_id && databaseColumns.length > 0 && (
            <div className="space-y-2">
              <Label>{t('formBuilder.fieldMappings')}</Label>
              {databaseColumns.map((col) => (
                <div key={col.id} className="flex items-center gap-2">
                  <span className="text-sm w-1/3">{col.name}</span>
                  <Select
                    className="flex-1"
                    value={
                      buttonSettings.database_config?.field_mappings?.find(
                        (m) => m.column_name === col.name
                      )?.form_field_id || ''
                    }
                    onChange={(e) => {
                      const currentMappings = buttonSettings.database_config?.field_mappings || [];
                      const newMappings = currentMappings.filter((m) => m.column_name !== col.name);
                      if (e.target.value) {
                        newMappings.push({
                          form_field_id: e.target.value,
                          column_name: col.name,
                        });
                      }
                      handleDatabaseConfigChange({ field_mappings: newMappings });
                    }}
                    options={[
                      { value: '', label: t('formBuilder.selectField') },
                      ...fields.map((f) => ({ value: f.id, label: f.label })),
                    ]}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FormConfiguration;
