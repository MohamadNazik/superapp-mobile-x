
import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select } from '../components/UI';
import { LeaveType } from '../types';
import { AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface AddLeaveProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  balances: any; 
}

export const AddLeave: React.FC<AddLeaveProps> = ({ onSubmit, onCancel, balances }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    type: 'sick' as LeaveType,
    startDate: '',
    endDate: '',
    reason: ''
  });

  const [duration, setDuration] = useState(0);

  useEffect(() => {
  if (formData.startDate && formData.endDate) {
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (start <= end) {
      let count = 0;
      const current = new Date(start);

      while (current <= end) {
        const day = current.getDay(); // 0 = Sunday, 6 = Saturday
        if (day !== 0 && day !== 6) {
          count++;
        }
        current.setDate(current.getDate() + 1);
      }

      setDuration(count);
    } else {
      setDuration(0);
    }
  }
}, [formData.startDate, formData.endDate]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.startDate || !formData.endDate || !formData.reason) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(formData);
      onCancel();
    } catch (e: any) {
      setError(e.message || "Failed to submit request");
    } finally {
      setIsLoading(false);
    }
  };

    const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const selectedRange = {
    from: formData.startDate ? new Date(formData.startDate) : undefined,
    to: formData.endDate ? new Date(formData.endDate) : undefined,
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleRangeSelect = (range: any) => {
    if (!range) {
      setFormData(prev => ({
        ...prev,
        startDate: "",
        endDate: ""
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      startDate: range.from ? formatDate(range.from) : "",
      endDate: range.to ? formatDate(range.to) : ""
    }));
  };


  const remaining = balances ? balances[formData.type] : 0;
  const isOverLimit = duration > remaining;

  return (
    <div className="pb-24 animate-in slide-in-from-bottom-4 duration-300">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-800">Request Time Off</h2>
        <p className="text-sm text-slate-500">Fill out the details below.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-start">
              <AlertCircle size={16} className="mr-2 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Leave Type</label>
            <Select 
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value as LeaveType})}
            >
              <option value="sick">Sick Leave</option>
              <option value="annual">Annual Leave</option>
              <option value="casual">Casual Leave</option>
            </Select>
            <div className="mt-2 text-xs text-right">
              <span className="text-slate-500">Balance: </span>
              <span className={`font-bold ${remaining === 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                {remaining} days available
              </span>
            </div>
          </div>

          {/* <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">From</label>
              <div className="relative">
                <Input 
                  type="date" 
                  required
                  value={formData.startDate}
                  min={new Date().toISOString().split('T')[0]} 
                  onChange={e => setFormData({...formData, startDate: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">To</label>
              <div className="relative">
                <Input 
                  type="date" 
                  required
                  value={formData.endDate}
                  min={formData.startDate}
                  onChange={e => setFormData({...formData, endDate: e.target.value})}
                />
              </div>
            </div>
          </div> */}

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">
              Select Leave Dates
            </label>

            <div className="rounded-xl border border-slate-200 p-3 bg-white">
              <DayPicker
                mode="range"
                selected={
                  formData.startDate || formData.endDate
                    ? selectedRange
                    : undefined
                }
                onSelect={handleRangeSelect}
                disabled={[isWeekend]}
                modifiers={{ weekend: isWeekend }}
                modifiersClassNames={{
                  weekend: "weekend-day",
                }}
                modifiersStyles={{
                  weekend: {
                    backgroundColor: "#f1f5f9",
                    color: "#cbd5e1",
                    pointerEvents: "none"
                  }
                }}
              />
            </div>
          </div>

          {duration > 0 && (
            <div className={`p-3 rounded-xl text-sm border flex justify-between items-center ${isOverLimit ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
              <span className="flex items-center">
                <CalendarIcon size={16} className="mr-2"/>
                Total Duration:
              </span>
              <span className="font-bold">{duration} Days</span>
            </div>
          )}

          <div>
             <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Reason</label>
             <textarea 
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 min-h-[100px] resize-none"
                placeholder="Describe why you need time off..."
                required
                value={formData.reason}
                onChange={e => setFormData({...formData, reason: e.target.value})}
             />
          </div>

          <div className="pt-2 flex gap-3">
             <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
             <Button 
               type="submit" 
               className="flex-1" 
               isLoading={isLoading}
               disabled={isOverLimit || duration <= 0}
             >
               Submit Request
             </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};