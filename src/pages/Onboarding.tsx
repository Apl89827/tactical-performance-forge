import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Check } from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [focusType, setFocusType] = useState("");
  const [selectionType, setSelectionType] = useState("");
  const [selectionDate, setSelectionDate] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [runTime, setRunTime] = useState("");
  const [pushups, setPushups] = useState("");
  const [situps, setSitups] = useState("");
  const [pullups, setPullups] = useState("");
  const [name, setName] = useState("");

  const handleNext = () => {
    if (step === 1 && !focusType) {
      toast.error("Please select your current focus");
      return;
    }

    if (step === 2 && focusType === "Selection Candidate" && (!selectionType || !selectionDate)) {
      toast.error("Please complete all fields");
      return;
    }

    if (step === 3 && (!height || !weight)) {
      toast.error("Please enter your height and weight");
      return;
    }

    if (step < 4) {
      setStep(step + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const completeOnboarding = () => {
    // Save profile data
    const profileData = {
      first_name: name,
      focusType,
      selectionType: focusType === "Selection Candidate" ? selectionType : "",
      selectionDate: focusType === "Selection Candidate" ? selectionDate : "",
      height: parseInt(height, 10) || 0,
      weight: parseInt(weight, 10) || 0,
      ptScores: {
        runTime,
        pushups: parseInt(pushups, 10) || 0,
        situps: parseInt(situps, 10) || 0,
        pullups: parseInt(pullups, 10) || 0,
      },
    };
    
    localStorage.setItem("profileData", JSON.stringify(profileData));
    
    // Complete onboarding
    onComplete();
    navigate("/dashboard");
  };

  return (
    <div className="h-full bg-tactical-darkgray flex flex-col">
      {/* Progress bar */}
      <div className="w-full h-1 bg-muted">
        <div
          className="h-full bg-tactical-blue transition-all duration-300"
          style={{ width: `${(step / 4) * 100}%` }}
        ></div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold">What best describes your current focus?</h1>
            <p className="text-muted-foreground">
              This helps us tailor your training program to your specific needs.
            </p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium">
                  Your Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="Enter your name"
                  required
                />
              </div>
            </div>

            <div className="space-y-3 mt-4">
              <button
                className={`w-full p-4 rounded-lg border ${
                  focusType === "Tactical Professional"
                    ? "border-tactical-blue bg-secondary"
                    : "border-border bg-card"
                } flex items-center justify-between`}
                onClick={() => setFocusType("Tactical Professional")}
              >
                <div className="text-left">
                  <h3 className="font-medium">Tactical Professional</h3>
                  <p className="text-sm text-muted-foreground">
                    Active Duty/Veteran - Maintaining Peak Fitness
                  </p>
                </div>
                {focusType === "Tactical Professional" && (
                  <Check className="text-tactical-blue h-5 w-5" />
                )}
              </button>

              <button
                className={`w-full p-4 rounded-lg border ${
                  focusType === "Selection Candidate"
                    ? "border-tactical-blue bg-secondary"
                    : "border-border bg-card"
                } flex items-center justify-between`}
                onClick={() => setFocusType("Selection Candidate")}
              >
                <div className="text-left">
                  <h3 className="font-medium">Selection Candidate</h3>
                  <p className="text-sm text-muted-foreground">
                    Preparing for Special Operations/Tactical Selection
                  </p>
                </div>
                {focusType === "Selection Candidate" && (
                  <Check className="text-tactical-blue h-5 w-5" />
                )}
              </button>

              <button
                className={`w-full p-4 rounded-lg border ${
                  focusType === "Civilian/LEO"
                    ? "border-tactical-blue bg-secondary"
                    : "border-border bg-card"
                } flex items-center justify-between`}
                onClick={() => setFocusType("Civilian/LEO")}
              >
                <div className="text-left">
                  <h3 className="font-medium">Civilian/LEO</h3>
                  <p className="text-sm text-muted-foreground">
                    Building/Maintaining Tactical Fitness
                  </p>
                </div>
                {focusType === "Civilian/LEO" && (
                  <Check className="text-tactical-blue h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        )}

        {step === 2 && focusType === "Selection Candidate" && (
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold">Selection Details</h1>
            <p className="text-muted-foreground">
              Tell us more about the selection you're preparing for.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="selection-type" className="block text-sm font-medium">
                  Which selection are you preparing for?
                </label>
                <select
                  id="selection-type"
                  value={selectionType}
                  onChange={(e) => setSelectionType(e.target.value)}
                  className="input-field"
                  required
                >
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
                <label htmlFor="selection-date" className="block text-sm font-medium">
                  Anticipated Selection Start Date
                </label>
                <input
                  id="selection-date"
                  type="date"
                  value={selectionDate}
                  onChange={(e) => setSelectionDate(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && focusType !== "Selection Candidate" && (
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold">Your Training Goals</h1>
            <p className="text-muted-foreground">
              Let's establish your goals to personalize your training program.
            </p>

            <div className="space-y-3 mt-4">
              <button
                className="w-full p-4 rounded-lg border border-tactical-blue bg-secondary flex items-center justify-between"
              >
                <div className="text-left">
                  <h3 className="font-medium">Maintain Operational Readiness</h3>
                  <p className="text-sm text-muted-foreground">
                    Stay in peak physical condition
                  </p>
                </div>
                <Check className="text-tactical-blue h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold">Height & Weight</h1>
            <p className="text-muted-foreground">
              Your height and weight help us calibrate exercise loads.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="height" className="block text-sm font-medium">
                  Height (in inches)
                </label>
                <input
                  id="height"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="input-field"
                  placeholder="69"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="weight" className="block text-sm font-medium">
                  Weight (in pounds)
                </label>
                <input
                  id="weight"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="input-field"
                  placeholder="180"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold">Baseline PT Scores</h1>
            <p className="text-muted-foreground">
              Your current physical readiness will help us establish a training baseline.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="run-time" className="block text-sm font-medium">
                  1.5 Mile Run Time (minutes)
                </label>
                <input
                  id="run-time"
                  type="text"
                  value={runTime}
                  onChange={(e) => setRunTime(e.target.value)}
                  className="input-field"
                  placeholder="e.g., 10:30"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="pushups" className="block text-sm font-medium">
                  Maximum Push-ups in 2 Minutes
                </label>
                <input
                  id="pushups"
                  type="number"
                  value={pushups}
                  onChange={(e) => setPushups(e.target.value)}
                  className="input-field"
                  placeholder="e.g., 50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="situps" className="block text-sm font-medium">
                  Maximum Sit-ups in 2 Minutes
                </label>
                <input
                  id="situps"
                  type="number"
                  value={situps}
                  onChange={(e) => setSitups(e.target.value)}
                  className="input-field"
                  placeholder="e.g., 60"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="pullups" className="block text-sm font-medium">
                  Maximum Pull-ups
                </label>
                <input
                  id="pullups"
                  type="number"
                  value={pullups}
                  onChange={(e) => setPullups(e.target.value)}
                  className="input-field"
                  placeholder="e.g., 10"
                />
              </div>
              
              <p className="text-sm text-muted-foreground italic mt-2">
                Note: You can skip these now and add them later in your profile.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="p-6 border-t border-border">
        <div className="flex space-x-3">
          {step > 1 && (
            <button className="btn-outline" onClick={handleBack}>
              Back
            </button>
          )}
          <button className="btn-primary" onClick={handleNext}>
            {step < 4 ? "Continue" : "Complete Setup"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
