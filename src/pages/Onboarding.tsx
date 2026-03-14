import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Check, Dumbbell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface OnboardingProps {
  onComplete: () => void;
}

const GOALS = [
  { id: "maintain", label: "Maintain Operational Readiness", desc: "Stay in peak physical condition for your role" },
  { id: "build", label: "Build a Strength Base", desc: "Increase overall strength and work capacity" },
  { id: "compete", label: "Compete / Qualify", desc: "Prepare for a fitness test, competition, or qualification" },
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [focusType, setFocusType] = useState("");
  const [goalType, setGoalType] = useState("");
  const [selectionType, setSelectionType] = useState("");
  const [selectionDate, setSelectionDate] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [runTime, setRunTime] = useState("");
  const [pushups, setPushups] = useState("");
  const [situps, setSitups] = useState("");
  const [pullups, setPullups] = useState("");
  const [name, setName] = useState("");
  const [swimTime, setSwimTime] = useState("");
  const [bench5rm, setBench5rm] = useState("");
  const [squat5rm, setSquat5rm] = useState("");
  const [deadlift5rm, setDeadlift5rm] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (error) throw error;
        if (mounted && data) {
          const d: any = data as any;
          setName(d.first_name ?? "");
          setHeight(d.height?.toString() ?? "");
          setWeight(d.weight?.toString() ?? "");
          setSwimTime(d.swim_time ?? "");
          setBench5rm(d.bench_5rm?.toString() ?? "");
          setSquat5rm(d.squat_5rm?.toString() ?? "");
          setDeadlift5rm(d.deadlift_5rm?.toString() ?? "");
          setFocusType(d.focus_type ?? "");
          setGoalType(d.goal_type ?? "");
          setSelectionType(d.selection_type ?? "");
          setSelectionDate((d.selection_date as string) ?? "");
        }
      } catch (err) {
        console.warn("Failed to preload profile:", err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const isSelectionCandidate = focusType === "Selection Candidate";

  const handleNext = async () => {
    if (step === 1 && !focusType) { toast.error("Please select your current focus"); return; }
    if (step === 2) {
      if (isSelectionCandidate && (!selectionType || !selectionDate)) { toast.error("Please complete all fields"); return; }
      if (!isSelectionCandidate && !goalType) { toast.error("Please select a goal"); return; }
    }
    if (step === 3 && (!height || !weight)) { toast.error("Please enter your height and weight"); return; }
    if (step < 4) { setStep(step + 1); } else { await completeOnboarding(); }
  };

  const handleBack = () => { if (step > 1) setStep(step - 1); };

  const completeOnboarding = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("User not authenticated"); return; }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: name || null,
          height: parseInt(height, 10) || null,
          weight: parseInt(weight, 10) || null,
          swim_time: swimTime || null,
          bench_5rm: parseInt(bench5rm, 10) || null,
          squat_5rm: parseInt(squat5rm, 10) || null,
          deadlift_5rm: parseInt(deadlift5rm, 10) || null,
          focus_type: focusType || null,
          goal_type: !isSelectionCandidate ? goalType || null : null,
          selection_type: isSelectionCandidate ? selectionType || null : null,
          selection_date: isSelectionCandidate && selectionDate ? selectionDate : null,
          has_completed_onboarding: true,
        } as any)
        .eq("id", user.id);

      if (profileError) { console.error(profileError); toast.error("Failed to save profile data"); return; }

      const { error: metricsError } = await supabase.from("pt_metrics").insert({
        user_id: user.id,
        run_time: runTime || null,
        pushups: pushups ? parseInt(pushups, 10) : null,
        situps: situps ? parseInt(situps, 10) : null,
        pullups: pullups ? parseInt(pullups, 10) : null,
      });
      if (metricsError) console.warn("Failed to insert PT metrics:", metricsError);

      localStorage.setItem("profileData", JSON.stringify({
        first_name: name, focusType, goalType,
        selectionType: isSelectionCandidate ? selectionType : "",
        selectionDate: isSelectionCandidate ? selectionDate : "",
        height: parseInt(height, 10) || 0,
        weight: parseInt(weight, 10) || 0,
        ptScores: { runTime, pushups: parseInt(pushups, 10) || 0, situps: parseInt(situps, 10) || 0, pullups: parseInt(pullups, 10) || 0 },
      }));

      onComplete();
      navigate("/dashboard");
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error("Failed to complete onboarding");
    }
  };

  const SelectOption = ({ value, label, desc, selected, onSelect }: { value: string; label: string; desc: string; selected: boolean; onSelect: () => void }) => (
    <button
      className={`w-full p-4 rounded-lg border flex items-center justify-between text-left ${selected ? "border-tactical-blue bg-secondary" : "border-border bg-card"}`}
      onClick={onSelect}
    >
      <div>
        <h3 className="font-medium">{label}</h3>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      {selected && <Check className="text-tactical-blue h-5 w-5 shrink-0 ml-2" />}
    </button>
  );

  return (
    <div className="h-full bg-tactical-darkgray flex flex-col">
      {/* Progress bar */}
      <div className="w-full h-1 bg-muted">
        <div className="h-full bg-tactical-blue transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }} />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Step 1 — focus type */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold">What best describes your current focus?</h1>
            <p className="text-muted-foreground">This helps us tailor your training program to your specific needs.</p>
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium">Your Name</label>
              <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="input-field" placeholder="Enter your name" />
            </div>
            <div className="space-y-3 mt-4">
              <SelectOption value="Tactical Professional" label="Tactical Professional" desc="Active Duty/Veteran — Maintaining Peak Fitness"
                selected={focusType === "Tactical Professional"} onSelect={() => setFocusType("Tactical Professional")} />
              <SelectOption value="Selection Candidate" label="Selection Candidate" desc="Preparing for Special Operations/Tactical Selection"
                selected={focusType === "Selection Candidate"} onSelect={() => setFocusType("Selection Candidate")} />
              <SelectOption value="Civilian/LEO" label="Civilian/LEO" desc="Building/Maintaining Tactical Fitness"
                selected={focusType === "Civilian/LEO"} onSelect={() => setFocusType("Civilian/LEO")} />
            </div>
          </div>
        )}

        {/* Step 2 — goal details */}
        {step === 2 && isSelectionCandidate && (
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold">Selection Details</h1>
            <p className="text-muted-foreground">Tell us more about the selection you're preparing for.</p>
            <div className="space-y-2">
              <label htmlFor="selection-type" className="block text-sm font-medium">Which selection are you preparing for?</label>
              <select id="selection-type" value={selectionType} onChange={(e) => setSelectionType(e.target.value)} className="input-field">
                <option value="">Select a program</option>
                <option value="BUD/S">BUD/S (Navy SEALs)</option>
                <option value="SFAS">SFAS (Army Special Forces)</option>
                <option value="RASP">RASP (Army Rangers)</option>
                <option value="A&S">A&S (Marine Raiders)</option>
                <option value="PJ/CCT">PJ/CCT (Air Force Special Warfare)</option>
                <option value="SWCC">SWCC (Special Warfare Combatant-Craft)</option>
                <option value="FBI HRT">FBI HRT</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="selection-date" className="block text-sm font-medium">Anticipated Selection Start Date</label>
              <input id="selection-date" type="date" value={selectionDate} onChange={(e) => setSelectionDate(e.target.value)} className="input-field" />
            </div>
          </div>
        )}

        {step === 2 && !isSelectionCandidate && (
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold">What's your primary training goal?</h1>
            <p className="text-muted-foreground">We'll use this to recommend the right program path.</p>
            <div className="space-y-3">
              {GOALS.map((g) => (
                <SelectOption key={g.id} value={g.id} label={g.label} desc={g.desc}
                  selected={goalType === g.id} onSelect={() => setGoalType(g.id)} />
              ))}
            </div>
          </div>
        )}

        {/* Step 3 — height & weight */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold">Height & Weight</h1>
            <p className="text-muted-foreground">Used to calibrate exercise loads.</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Height (inches)</label>
                <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="input-field" placeholder="69" />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium">Weight (lbs)</label>
                <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="input-field" placeholder="180" />
              </div>
            </div>
          </div>
        )}

        {/* Step 4 — baseline PT */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold">Baseline Fitness Metrics</h1>
            <p className="text-muted-foreground">Establishes your training baseline. All fields optional.</p>
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="font-medium flex items-center"><Dumbbell className="h-4 w-4 mr-2" />Cardio</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">1.5 Mile Run</label>
                    <input type="text" value={runTime} onChange={(e) => setRunTime(e.target.value)} className="input-field" placeholder="10:30" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">500m Swim</label>
                    <input type="text" value={swimTime} onChange={(e) => setSwimTime(e.target.value)} className="input-field" placeholder="8:45" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="font-medium">Calisthenics</h2>
                <div className="grid grid-cols-3 gap-4">
                  {[["Push-ups (2min)", pushups, setPushups, "50"], ["Sit-ups (2min)", situps, setSitups, "60"], ["Pull-ups", pullups, setPullups, "10"]].map(([label, val, setter, ph]) => (
                    <div key={label as string} className="space-y-2">
                      <label className="block text-sm font-medium">{label as string}</label>
                      <input type="number" value={val as string} onChange={(e) => (setter as any)(e.target.value)} className="input-field" placeholder={ph as string} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="font-medium">Strength (5 Rep Max)</h2>
                <div className="grid grid-cols-3 gap-4">
                  {[["Bench (lbs)", bench5rm, setBench5rm, "185"], ["Squat (lbs)", squat5rm, setSquat5rm, "275"], ["Deadlift (lbs)", deadlift5rm, setDeadlift5rm, "315"]].map(([label, val, setter, ph]) => (
                    <div key={label as string} className="space-y-2">
                      <label className="block text-sm font-medium">{label as string}</label>
                      <input type="number" value={val as string} onChange={(e) => (setter as any)(e.target.value)} className="input-field" placeholder={ph as string} />
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground italic">You can skip any metrics and add them later in your profile.</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-border">
        <div className="flex space-x-3">
          {step > 1 && <button className="btn-outline" onClick={handleBack}>Back</button>}
          <button className="btn-primary" onClick={handleNext}>
            {step < 4 ? "Continue" : "Complete Setup"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
