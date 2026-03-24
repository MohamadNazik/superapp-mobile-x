import { useState, useEffect } from 'react';
import { useResource } from '../context';
import { Resource, ResourceType, FormField, RESOURCE_TYPES } from '../types';
import { APP_CONFIG } from '../../../config';

export const useResourceForm = (onClose: () => void, initialData?: Resource) => {
  const { addResource, updateResource } = useResource();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // --- Form State ---
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    type: ResourceType.MEETING_ROOM as string,
    customType: '',
    description: '',
    minLeadTimeHours: APP_CONFIG.DEFAULT_LEAD_TIME_HOURS,
    icon: 'DEFAULT',
    color: 'blue'
  });

  const [specs, setSpecs] = useState<{ key: string, value: string }[]>([]);
  const [formFields, setFormFields] = useState<FormField[]>([]);

  // Initialize for Edit Mode
  useEffect(() => {
    if (initialData) {
      const isStandardType = RESOURCE_TYPES.includes(initialData.type as ResourceType);

      // eslint-disable-next-line
      setBasicInfo({
        name: initialData.name,
        type: isStandardType ? initialData.type : 'OTHER',
        customType: isStandardType ? '' : initialData.type,
        description: initialData.description,
        minLeadTimeHours: initialData.minLeadTimeHours,
        icon: initialData.icon,
        color: initialData.color || 'blue'
      });

      // Convert specs object to array
      setSpecs(Object.entries(initialData.specs || {}).map(([key, value]) => ({ key, value })));
      setFormFields(initialData.formFields);
    }
  }, [initialData]);

  // --- Handlers ---
  const handleAddSpec = () => setSpecs([...specs, { key: '', value: '' }]);
  const handleRemoveSpec = (idx: number) => setSpecs(specs.filter((_, i) => i !== idx));
  const handleSpecChange = (idx: number, field: 'key' | 'value', val: string) => {
    const newSpecs = [...specs];
    newSpecs[idx][field] = val;
    setSpecs(newSpecs);
  };

  const handleAddField = () => {
    setFormFields(prevFields => [...prevFields, {
      id: crypto.randomUUID(),
      label: '',
      type: 'text',
      required: false
    }]);
  };
  const handleRemoveField = (idx: number) => setFormFields(formFields.filter((_, i) => i !== idx));
  const handleFieldChange = (idx: number, updates: Partial<FormField>) => {
    const newFields = [...formFields];
    newFields[idx] = { ...newFields[idx], ...updates };
    // Reset options if type changes from select
    if (updates.type && updates.type !== 'select') {
      delete newFields[idx].options;
    }
    setFormFields(newFields);
  };
  const handleOptionsChange = (idx: number, val: string) => {
    const newFields = [...formFields];
    newFields[idx].options = val.split(',').map(s => s.trim());
    setFormFields(newFields);
  };

  const handleSubmit = async () => {
    if (!basicInfo.name || !basicInfo.description) return;

    setIsSubmitting(true);
    setSubmitError(null);

    // Convert specs array to record
    const specsRecord: Record<string, string> = {};
    specs.forEach(s => {
      if (s.key && s.value) specsRecord[s.key] = s.value;
    });

    const finalType = basicInfo.type === 'OTHER' ? basicInfo.customType : basicInfo.type;

    const resourceData = {
      ...basicInfo,
      type: finalType,
      specs: specsRecord,
      formFields: formFields.filter(f => f.label) // Filter empty
    };

    const result = initialData
      ? await updateResource({ ...resourceData, id: initialData.id, isActive: initialData.isActive })
      : await addResource({ ...resourceData, isActive: true });

    setIsSubmitting(false);
    if (result.success) {
      onClose();
    } else {
      setSubmitError(result.error || 'An unexpected error occurred.');
    }
  };

  return {
    isSubmitting,
    submitError,
    basicInfo,
    setBasicInfo,
    specs,
    formFields,
    handlers: {
      handleAddSpec,
      handleRemoveSpec,
      handleSpecChange,
      handleAddField,
      handleRemoveField,
      handleFieldChange,
      handleOptionsChange,
      handleSubmit
    }
  };
};
