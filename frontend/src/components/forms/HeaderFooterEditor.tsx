import React from 'react';
import { useTranslation } from 'react-i18next';
import type { HeaderFooterConfig, GridItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Plus, Type, MousePointer } from 'lucide-react';

interface HeaderFooterEditorProps {
  config: HeaderFooterConfig;
  section: 'header' | 'footer';
  onAddItem: (section: 'header' | 'footer', position: 'left' | 'center' | 'right', type: 'button' | 'rich_text') => void;
  onUpdateItem: (item: GridItem, section: 'header' | 'footer', position: 'left' | 'center' | 'right') => void;
  onDeleteItem: (itemId: string, section: 'header' | 'footer', position: 'left' | 'center' | 'right') => void;
  onReset: (section: 'header' | 'footer') => void;
  selectedItemId: string | null;
  onSelectItem: (item: GridItem, position: 'left' | 'center' | 'right') => void;
}

const HeaderFooterEditor: React.FC<HeaderFooterEditorProps> = ({
  config,
  section,
  onAddItem,
  selectedItemId,
  onSelectItem,
}) => {
  const { t } = useTranslation();
  const positions: Array<'left' | 'center' | 'right'> = ['left', 'center', 'right'];

  const renderGridSection = (position: 'left' | 'center' | 'right') => {
    const items = config[position];
    const alignment = position === 'left' ? 'justify-start' : position === 'right' ? 'justify-end' : 'justify-center';

    return (
      <div className={`flex-1 min-h-[60px] border border-dashed border-gray-200 rounded-lg p-2 flex items-center gap-2 ${alignment} group relative`}>
        {items.length === 0 ? (
          <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddItem(section, position, 'button')}
            >
              <MousePointer className="h-4 w-4 mr-1" />
              {t('formBuilder.button')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddItem(section, position, 'rich_text')}
            >
              <Type className="h-4 w-4 mr-1" />
              {t('formBuilder.richText')}
            </Button>
          </div>
        ) : (
          <>
            {items.map((item) => (
              <div
                key={item.id}
                className={`cursor-pointer transition-all ${
                  selectedItemId === item.id
                    ? 'ring-2 ring-primary rounded'
                    : 'hover:ring-2 hover:ring-gray-300 rounded'
                }`}
                onClick={() => onSelectItem(item, position)}
              >
                {item.type === 'button' ? (
                  <Button size="sm" variant="outline">
                    {(item.settings as { label?: string })?.label || t('formBuilder.button')}
                  </Button>
                ) : (
                  <div
                    className="px-2 py-1 text-sm"
                    dangerouslySetInnerHTML={{ __html: item.content || '' }}
                  />
                )}
              </div>
            ))}
            <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddItem(section, position, 'button')}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="border rounded-lg p-3 bg-gray-50">
      <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
        {section === 'header' ? t('formBuilder.header') : t('formBuilder.footer')}
      </div>
      <div className="flex gap-2">
        {positions.map((position) => (
          <React.Fragment key={position}>
            {renderGridSection(position)}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default HeaderFooterEditor;
