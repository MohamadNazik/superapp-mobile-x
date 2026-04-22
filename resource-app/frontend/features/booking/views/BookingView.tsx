import React from "react";
import { Resource } from "../../resource/types";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Minus,
  Plus,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Info,
  XCircle,
} from "lucide-react";
import { Button, Card, Input, Select, Label } from "../../../components/UI";
import { format, addMinutes } from "date-fns";
import { cn } from "../../../utils/cn";
import { useBooking } from "../hooks/useBooking";
import { APP_CONFIG } from "../../../infrastructure/config";

interface BookingViewProps {
  resource: Resource;
  onBack: () => void;
  onSuccess: () => void;
}

export const BookingView = ({
  resource,
  onBack,
  onSuccess,
}: BookingViewProps) => {
  const {
    step,
    setStep,
    isSubmitting,
    date,
    setDate,
    duration,
    setDuration,
    startTime,
    setStartTime,
    formData,
    setFormData,
    timeStatus,
    existingBookings,
    timelineSegments,
    handleSubmit,
    validationError,
  } = useBooking(resource, onSuccess);

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center gap-3 shrink-0 shadow-sm">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-sm font-bold text-slate-900">New Booking</h2>
          <p className="text-xs text-slate-500">{resource.name}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {step === "time" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Resource Specs Summary */}
            {Object.keys(resource.specs || {}).length > 0 && (
              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wide flex items-center gap-1">
                  <Info size={12} /> Specifications
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(resource.specs || {}).map(([key, val]) => (
                    <span
                      key={key}
                      className="text-[10px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200"
                    >
                      <span className="font-bold text-slate-800">{key}:</span>{" "}
                      {val}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 1. Date Picker */}
            <section>
              <Label>1. Select Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setStartTime("");
                }}
                min={new Date().toISOString().split("T")[0]}
                className="h-12 text-base"
              />
            </section>

            {/* 2. Duration */}
            <section>
              <Label>2. Duration</Label>
              <Card className="flex items-center justify-between p-3 border-slate-200">
                <button
                  onClick={() => setDuration(Math.max(15, duration - 15))}
                  className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 active:bg-slate-200 transition-colors"
                >
                  <Minus size={20} />
                </button>
                <div className="text-center">
                  <span className="text-xl font-bold text-slate-900 block tabular-nums">
                    {Math.floor(duration / 60)}h {duration % 60}m
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">
                    Length
                  </span>
                </div>
                <button
                  onClick={() => setDuration(duration + 15)}
                  className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 active:bg-primary-100 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </Card>
            </section>

            {/* 3. Start Time Native Picker */}
            <section>
              <Label>3. Start Time</Label>

              {/* Visual Availability Bar */}
              <div className="mb-4 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex justify-between text-[10px] text-slate-400 mb-2 font-medium uppercase">
                  {Array.from(
                    {
                      length:
                        (APP_CONFIG.VISUAL_END_HOUR -
                          APP_CONFIG.VISUAL_START_HOUR) /
                          4 +
                        1,
                    },
                    (_, i) => APP_CONFIG.VISUAL_START_HOUR + i * 4,
                  ).map((hour) => (
                    <span key={hour}>{hour}:00</span>
                  ))}
                </div>
                <div className="h-8 bg-slate-100 rounded-lg w-full relative overflow-hidden ring-1 ring-inset ring-slate-200">
                  {[0, 25, 50, 75, 100].map((p) => (
                    <div
                      key={p}
                      className="absolute top-0 bottom-0 w-px bg-slate-300/50"
                      style={{ left: `${p}%` }}
                    />
                  ))}

                  {timelineSegments.map((seg, i) => {
                    let colorClass =
                      "bg-emerald-500 z-10 border-r border-white/20";
                    if (seg.type === "booked")
                      colorClass = "bg-slate-300 border-r border-white/50";
                    if (seg.type === "conflict")
                      colorClass =
                        "bg-red-500 z-20 bg-[length:4px_4px] bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)]";

                    return (
                      <div
                        key={i}
                        className={cn(
                          "absolute h-full transition-all duration-300",
                          colorClass,
                        )}
                        style={{ left: `${seg.left}%`, width: `${seg.width}%` }}
                      />
                    );
                  })}
                </div>

                {existingBookings.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {existingBookings.map((b, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-100 text-slate-500 px-2 py-1 rounded-md border border-slate-200"
                      >
                        <Clock size={10} />
                        {format(new Date(b.start), "HH:mm")} -{" "}
                        {format(new Date(b.end), "HH:mm")}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 text-[10px] text-emerald-600 flex items-center gap-1">
                    <CheckCircle size={10} />
                    Entire day available
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col gap-2 flex-1">
                  {!startTime && (
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2">
                      <Clock size={12} className="shrink-0" /> Tap here to
                      select time
                    </div>
                  )}
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={cn(
                      "h-14 text-xl font-bold tracking-wide text-center w-full bg-white",
                      !startTime
                        ? "border-slate-200"
                        : timeStatus.valid
                          ? "border-emerald-500 bg-emerald-50/30 text-emerald-900"
                          : "border-red-300 bg-red-50/30 text-red-900",
                    )}
                  />
                </div>
              </div>

              {/* Status Feedback */}
              <div
                className={cn(
                  "mt-3 p-3 rounded-xl text-xs flex items-center gap-2 font-medium transition-all border",
                  !startTime
                    ? "opacity-0"
                    : timeStatus.valid
                      ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                      : "bg-red-50 text-red-800 border-red-100",
                )}
              >
                {timeStatus.valid ? (
                  <CheckCircle size={16} />
                ) : (
                  <XCircle size={16} />
                )}
                {timeStatus.message}
              </div>
            </section>
          </div>
        )}

        {step === "form" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <Card className="bg-slate-50 border-slate-200">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <CalendarIcon size={14} />
                <span>{format(new Date(date), "EEE, MMM do")}</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Clock size={16} className="text-primary-600" />
                <span>
                  {startTime} -{" "}
                  {format(
                    addMinutes(new Date(`${date}T${startTime}:00`), duration),
                    "HH:mm",
                  )}
                </span>
              </div>
            </Card>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              {resource.formFields.map((field) => (
                <div key={field.id}>
                  <Label required={field.required}>{field.label}</Label>

                  {field.type === "boolean" && (
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, [field.id]: true })
                        }
                        className={cn(
                          "flex-1 py-3 rounded-xl border font-medium transition-all",
                          formData[field.id] === true
                            ? "bg-primary-600 text-white border-primary-600 shadow-md"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                        )}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, [field.id]: false })
                        }
                        className={cn(
                          "flex-1 py-3 rounded-xl border font-medium transition-all",
                          formData[field.id] === false
                            ? "bg-slate-700 text-white border-slate-700 shadow-md"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                        )}
                      >
                        No
                      </button>
                    </div>
                  )}

                  {field.type === "select" && (
                    <Select
                      required={field.required}
                      onChange={(e) =>
                        setFormData({ ...formData, [field.id]: e.target.value })
                      }
                      className="h-11"
                      value={(formData[field.id] as string) || ""}
                    >
                      <option value="">Select...</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </Select>
                  )}

                  {(field.type === "text" || field.type === "number") && (
                    <Input
                      type={field.type === "number" ? "number" : "text"}
                      required={field.required}
                      onChange={(e) =>
                        setFormData({ ...formData, [field.id]: e.target.value })
                      }
                      className="h-11"
                      value={(formData[field.id] as string) || ""}
                    />
                  )}
                </div>
              ))}
            </form>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-white border-t border-slate-200 shrink-0 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {validationError && (
          <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-xs text-red-600 animate-in slide-in-from-bottom-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}
        {step === "time" ? (
          <Button
            className="w-full h-12 text-base shadow-lg shadow-primary-500/20"
            disabled={!timeStatus.valid}
            onClick={() => setStep("form")}
          >
            Continue
            <ChevronRight size={18} className="ml-2" />
          </Button>
        ) : (
          <Button
            className="w-full h-12 text-base shadow-lg shadow-primary-500/20"
            isLoading={isSubmitting}
            onClick={handleSubmit}
          >
            Request Booking
          </Button>
        )}
      </div>
    </div>
  );
};
