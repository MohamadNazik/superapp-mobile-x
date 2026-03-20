import React from 'react';
import { Resource, RESOURCE_TYPES } from '../types';
import { ArrowLeft, Plus, Trash2, Save, CheckSquare, Square } from 'lucide-react';
import { Button, Input, Label, Select, Card } from '../../../components/UI';
import { cn } from '../../../utils/cn';
import { useResourceForm } from '../hooks/useResourceForm';
import { RESOURCE_ICON_OPTIONS, COLOR_OPTIONS } from '../constants';

interface CreateResourceViewProps {
  onClose: () => void;
  initialData?: Resource;
}

export const CreateResourceView = ({ onClose, initialData }: CreateResourceViewProps) => {
  const {
    isSubmitting,
    basicInfo, setBasicInfo,
    specs, formFields,
    handlers
  } = useResourceForm(onClose, initialData);

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center gap-3 shrink-0 shadow-sm">
        <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-sm font-bold text-slate-900">{initialData ? 'Edit Resource' : 'Add New Resource'}</h2>
          <p className="text-xs text-slate-500">Configure availability and requirements</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-24">

        {/* 1. Basic Info */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase text-slate-400 px-1 tracking-wide border-b border-slate-200 pb-2">Basic Details</h3>

          <div>
            <Label required>Resource Name</Label>
            <Input
              placeholder="e.g. Main Conference Hall"
              value={basicInfo.name}
              onChange={e => setBasicInfo({ ...basicInfo, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label required>Category</Label>
              <Select
                value={basicInfo.type}
                onChange={e => setBasicInfo({ ...basicInfo, type: e.target.value })}
              >
                {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                <option value="OTHER">Other (Custom)</option>
              </Select>
            </div>

            {basicInfo.type === 'OTHER' && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <Label required>Custom Category Name</Label>
                <Input
                  placeholder="e.g. Laboratory, Drone, etc."
                  value={basicInfo.customType}
                  onChange={e => setBasicInfo({ ...basicInfo, customType: e.target.value })}
                />
              </div>
            )}
          </div>

          <div>
            <Label required>Description</Label>
            <Input
              placeholder="Short description for users..."
              value={basicInfo.description}
              onChange={e => setBasicInfo({ ...basicInfo, description: e.target.value })}
            />
          </div>

          <div>
            <Label>Minimum Lead Time (Hours)</Label>
            <Input
              type="number"
              min="0"
              value={basicInfo.minLeadTimeHours}
              onChange={e => setBasicInfo({ ...basicInfo, minLeadTimeHours: parseInt(e.target.value) || 0 })}
            />
            <p className="text-[10px] text-slate-400 mt-1">Users cannot book if start time is sooner than this.</p>
          </div>
        </section>

        {/* 2. Visuals */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase text-slate-400 px-1 tracking-wide border-b border-slate-200 pb-2">Appearance</h3>

          <div>
            <Label>Icon</Label>
            <div className="grid grid-cols-6 gap-2">
              {RESOURCE_ICON_OPTIONS.map(({ key, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setBasicInfo({ ...basicInfo, icon: key })}
                  className={cn(
                    "aspect-square rounded-xl flex items-center justify-center transition-all border",
                    basicInfo.icon === key
                      ? "bg-slate-800 text-white border-slate-800 shadow-md scale-105"
                      : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <Icon size={20} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Color Theme</Label>
            <div className="flex gap-3">
              {(() => {
                const colorBgMap: Record<string, string> = {
                  blue: 'bg-blue-500',
                  emerald: 'bg-emerald-500',
                  violet: 'bg-violet-500',
                  amber: 'bg-amber-500',
                  red: 'bg-red-500',
                };
                return COLOR_OPTIONS.map(color => (
                <button
                  key={color}
                  onClick={() => setBasicInfo({ ...basicInfo, color })}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all",
                    basicInfo.color === color ? "border-slate-800 scale-110" : "border-transparent opacity-50 hover:opacity-100"
                  )}
                  style={{ backgroundColor: `var(--color-${color}-500)` }}
                >
                  <div className={cn("w-full h-full rounded-full", colorBgMap[color] || 'bg-slate-500')} />
                </button>
              ));
              })()}
            </div>
          </div>
        </section>

        {/* 3. Specs Builder */}
        <section className="space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <h3 className="text-xs font-bold uppercase text-slate-400 px-1 tracking-wide">Specifications</h3>
            <Button size="sm" variant="ghost" onClick={handlers.handleAddSpec} className="h-6 text-primary-600">
              <Plus size={14} className="mr-1" /> Add Spec
            </Button>
          </div>

          {specs.length === 0 && <p className="text-xs text-slate-400 italic p-2">No specifications added (e.g. Seats: 4).</p>}

          <div className="space-y-2">
            {specs.map((spec, idx) => (
              <div key={idx} className="flex gap-2 items-center animate-in fade-in slide-in-from-left-2">
                <Input
                  placeholder="Label (e.g. Seats)"
                  value={spec.key}
                  onChange={e => handlers.handleSpecChange(idx, 'key', e.target.value)}
                  className="flex-1 h-9"
                />
                <Input
                  placeholder="Value (e.g. 50)"
                  value={spec.value}
                  onChange={e => handlers.handleSpecChange(idx, 'value', e.target.value)}
                  className="flex-1 h-9"
                />
                <button onClick={() => handlers.handleRemoveSpec(idx)} className="text-red-400 hover:text-red-600 p-2">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Form Builder */}
        <section className="space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <h3 className="text-xs font-bold uppercase text-slate-400 px-1 tracking-wide">Booking Questions</h3>
            <Button size="sm" variant="ghost" onClick={handlers.handleAddField} className="h-6 text-primary-600">
              <Plus size={14} className="mr-1" /> Add Question
            </Button>
          </div>

          {formFields.length === 0 && <p className="text-xs text-slate-400 italic p-2">No custom questions. Default: Name & Time only.</p>}

          <div className="space-y-3">
            {formFields.map((field, idx) => (
              <Card key={field.id} className="p-3 bg-slate-50 border-slate-200 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Question #{idx + 1}</span>
                  <button onClick={() => handlers.handleRemoveField(idx)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="space-y-2">
                  <Input
                    placeholder="Question Label (e.g. Project Code)"
                    value={field.label}
                    onChange={e => handlers.handleFieldChange(idx, { label: e.target.value })}
                    className="bg-white"
                  />

                  <div className="flex gap-2 items-center">
                    <Select
                      value={field.type}
                      onChange={e => handlers.handleFieldChange(idx, { type: e.target.value as 'text' | 'number' | 'boolean' | 'select' })}
                      className="bg-white flex-1"
                    >
                      <option value="text">Text Answer</option>
                      <option value="number">Number</option>
                      <option value="boolean">Yes/No Toggle</option>
                      <option value="select">Dropdown Select</option>
                    </Select>

                    <button
                      onClick={() => handlers.handleFieldChange(idx, { required: !field.required })}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
                    >
                      {field.required ? (
                        <CheckSquare size={16} className="text-primary-600" />
                      ) : (
                        <Square size={16} className="text-slate-400" />
                      )}
                      <span className="text-xs font-medium">Required</span>
                    </button>
                  </div>

                  {field.type === 'select' && (
                    <Input
                      placeholder="Options (comma separated)"
                      value={field.options?.join(', ') || ''}
                      onChange={e => handlers.handleOptionsChange(idx, e.target.value)}
                      className="bg-white"
                    />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>

      </div>

      {/* Footer */}
      <div className="p-4 bg-white border-t border-slate-200 shrink-0 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
        <Button
          className="w-full h-12 text-base shadow-lg shadow-primary-500/20"
          onClick={handlers.handleSubmit}
          isLoading={isSubmitting}
          disabled={!basicInfo.name}
        >
          <Save size={18} className="mr-2" />
          {initialData ? 'Update Resource' : 'Create Resource'}
        </Button>
      </div>

    </div>
  );
};
