
import React, { useState } from "react";
import MobileLayout from "../components/layouts/MobileLayout";
import { 
  BarChart as BarChartIcon, 
  TrendingUp, 
  Target, 
  Activity
} from "lucide-react";

const Progress = () => {
  const [activeTab, setActiveTab] = useState("overview");
  
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "pt-scores", label: "PT Scores" },
    { id: "strength", label: "Strength" },
    { id: "endurance", label: "Endurance" },
  ];
  
  // Mock data for PT scores
  const ptScores = {
    run: [
      { date: "Mar 1", time: 11.25 }, // 11:15
      { date: "Mar 15", time: 11.0 }, // 11:00
      { date: "Apr 1", time: 10.75 }, // 10:45
      { date: "Apr 15", time: 10.5 }, // 10:30
      { date: "May 1", time: 10.33 }, // 10:20
    ],
    pushups: [
      { date: "Mar 1", count: 48 },
      { date: "Mar 15", count: 51 },
      { date: "Apr 1", count: 53 },
      { date: "Apr 15", count: 56 },
      { date: "May 1", count: 58 },
    ],
    situps: [
      { date: "Mar 1", count: 56 },
      { date: "Mar 15", count: 58 },
      { date: "Apr 1", count: 62 },
      { date: "Apr 15", count: 64 },
      { date: "May 1", count: 68 },
    ],
    pullups: [
      { date: "Mar 1", count: 8 },
      { date: "Mar 15", count: 9 },
      { date: "Apr 1", count: 10 },
      { date: "Apr 15", count: 11 },
      { date: "May 1", count: 12 },
    ],
  };
  
  // Mock data for strength progress
  const strengthProgress = {
    backSquat: [
      { date: "Mar 1", weight: 225 },
      { date: "Mar 15", weight: 235 },
      { date: "Apr 1", weight: 245 },
      { date: "Apr 15", weight: 255 },
      { date: "May 1", weight: 265 },
    ],
    deadlift: [
      { date: "Mar 1", weight: 275 },
      { date: "Mar 15", weight: 285 },
      { date: "Apr 1", weight: 295 },
      { date: "Apr 15", weight: 305 },
      { date: "May 1", weight: 315 },
    ],
    benchPress: [
      { date: "Mar 1", weight: 185 },
      { date: "Mar 15", weight: 190 },
      { date: "Apr 1", weight: 195 },
      { date: "Apr 15", weight: 205 },
      { date: "May 1", weight: 210 },
    ],
    overheadPress: [
      { date: "Mar 1", weight: 135 },
      { date: "Mar 15", weight: 140 },
      { date: "Apr 1", weight: 145 },
      { date: "Apr 15", weight: 150 },
      { date: "May 1", weight: 155 },
    ],
  };
  
  // Mock data for endurance
  const enduranceProgress = {
    ruckTime: [
      { date: "Mar 1", time: 110 }, // 1:50
      { date: "Mar 15", time: 108 }, // 1:48
      { date: "Apr 1", time: 105 }, // 1:45
      { date: "Apr 15", time: 103 }, // 1:43
      { date: "May 1", time: 100 }, // 1:40
    ],
    distance: [
      { date: "Mar 1", miles: 5 },
      { date: "Mar 15", miles: 6 },
      { date: "Apr 1", miles: 7 },
      { date: "Apr 15", miles: 8 },
      { date: "May 1", miles: 9 },
    ],
  };
  
  // Format time (minutes) as MM:SS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time);
    const seconds = Math.round((time - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Get the change percentage between first and last values
  const getChangePercentage = (data: any[], key: string) => {
    if (data.length < 2) return 0;
    
    const firstValue = data[0][key];
    const lastValue = data[data.length - 1][key];
    
    if (key === "time") {
      // For time values (lower is better)
      return ((firstValue - lastValue) / firstValue * 100).toFixed(1);
    }
    
    // For all other values (higher is better)
    return ((lastValue - firstValue) / firstValue * 100).toFixed(1);
  };
  
  // Simple chart component using divs
  const SimpleChart = ({ data, valueKey, lowerIsBetter = false, hasMarkers = true }: any) => {
    const values = data.map((d: any) => d[valueKey]);
    const max = Math.max(...values) * 1.1; // 10% headroom
    const min = lowerIsBetter ? Math.min(...values) * 0.9 : 0; // 10% padding below if lower is better
    
    return (
      <div className="h-32 flex items-end space-x-1">
        {data.map((d: any, i: number) => {
          const height = ((d[valueKey] - min) / (max - min)) * 100;
          const adjustedHeight = lowerIsBetter ? (100 - height) : height;
          
          return (
            <div key={i} className="flex-1 flex flex-col items-center">
              {hasMarkers && (
                <div className="text-xs text-muted-foreground mb-1">
                  {valueKey === "time" ? formatTime(d[valueKey]) : d[valueKey]}
                </div>
              )}
              <div 
                className={`w-full rounded-t ${
                  lowerIsBetter 
                    ? "bg-tactical-orange" 
                    : "bg-tactical-blue"
                }`}
                style={{ height: `${adjustedHeight}%` }}
              />
              <div className="text-xs text-muted-foreground mt-1 whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">
                {d.date}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <MobileLayout title="Progress Tracking">
      <div className="mobile-safe-area py-4">
        {/* Tabs */}
        <div className="mb-6 relative">
          <div className="flex border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`flex-1 py-2 text-sm font-medium relative ${
                  activeTab === tab.id 
                    ? "text-tactical-blue" 
                    : "text-muted-foreground"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div 
            className="tab-indicator" 
            style={{ 
              left: `${(tabs.findIndex(t => t.id === activeTab) / tabs.length) * 100}%`,
              width: `${100 / tabs.length}%`
            }}
          ></div>
        </div>
        
        {/* Tab content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Program Overview</h2>
                <div className="bg-tactical-blue/20 text-tactical-blue text-xs py-1 px-2 rounded">
                  Phase 2/4
                </div>
              </div>
              
              <div className="bg-card rounded-lg border border-border p-4 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">Current Program</h3>
                  <div className="text-sm text-muted-foreground">8 weeks</div>
                </div>
                
                <h4 className="text-lg font-bold mb-2">Strength Foundation</h4>
                <div className="w-full bg-secondary/50 rounded-full h-2 mb-1">
                  <div className="bg-tactical-blue h-2 rounded-full" style={{ width: "45%" }}></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Week 4 of 8</span>
                  <span>45% complete</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 border border-border rounded-lg bg-card">
                  <div className="flex items-center mb-2">
                    <Activity size={16} className="text-tactical-blue mr-2" />
                    <span className="text-sm font-medium">Workouts</span>
                  </div>
                  <div className="text-2xl font-bold">26</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div className="p-3 border border-border rounded-lg bg-card">
                  <div className="flex items-center mb-2">
                    <Target size={16} className="text-tactical-orange mr-2" />
                    <span className="text-sm font-medium">Consistency</span>
                  </div>
                  <div className="text-2xl font-bold">92%</div>
                  <div className="text-xs text-muted-foreground">Adherence</div>
                </div>
              </div>
            </section>
            
            <section className="pt-2">
              <h2 className="text-lg font-semibold mb-4">Recent Progress</h2>
              
              <div className="space-y-4">
                <div className="bg-card rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">1.5 Mile Run</h3>
                    <div className="flex items-center text-sm text-green-500">
                      <TrendingUp size={16} className="mr-1" />
                      {getChangePercentage(ptScores.run, "time")}%
                    </div>
                  </div>
                  <SimpleChart data={ptScores.run} valueKey="time" lowerIsBetter={true} />
                </div>
                
                <div className="bg-card rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">Back Squat</h3>
                    <div className="flex items-center text-sm text-green-500">
                      <TrendingUp size={16} className="mr-1" />
                      {getChangePercentage(strengthProgress.backSquat, "weight")}%
                    </div>
                  </div>
                  <SimpleChart data={strengthProgress.backSquat} valueKey="weight" />
                </div>
              </div>
            </section>
          </div>
        )}
        
        {activeTab === "pt-scores" && (
          <div className="space-y-6">
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">1.5 Mile Run</h3>
                <div className="flex items-center text-sm text-green-500">
                  <TrendingUp size={16} className="mr-1" />
                  {getChangePercentage(ptScores.run, "time")}%
                </div>
              </div>
              <SimpleChart data={ptScores.run} valueKey="time" lowerIsBetter={true} />
              <div className="flex justify-between items-center mt-2 text-sm">
                <span>Initial: {formatTime(ptScores.run[0].time)}</span>
                <span className="font-medium">Current: {formatTime(ptScores.run[ptScores.run.length - 1].time)}</span>
              </div>
            </div>
            
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Push-ups</h3>
                <div className="flex items-center text-sm text-green-500">
                  <TrendingUp size={16} className="mr-1" />
                  {getChangePercentage(ptScores.pushups, "count")}%
                </div>
              </div>
              <SimpleChart data={ptScores.pushups} valueKey="count" />
              <div className="flex justify-between items-center mt-2 text-sm">
                <span>Initial: {ptScores.pushups[0].count}</span>
                <span className="font-medium">Current: {ptScores.pushups[ptScores.pushups.length - 1].count}</span>
              </div>
            </div>
            
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Sit-ups</h3>
                <div className="flex items-center text-sm text-green-500">
                  <TrendingUp size={16} className="mr-1" />
                  {getChangePercentage(ptScores.situps, "count")}%
                </div>
              </div>
              <SimpleChart data={ptScores.situps} valueKey="count" />
              <div className="flex justify-between items-center mt-2 text-sm">
                <span>Initial: {ptScores.situps[0].count}</span>
                <span className="font-medium">Current: {ptScores.situps[ptScores.situps.length - 1].count}</span>
              </div>
            </div>
            
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Pull-ups</h3>
                <div className="flex items-center text-sm text-green-500">
                  <TrendingUp size={16} className="mr-1" />
                  {getChangePercentage(ptScores.pullups, "count")}%
                </div>
              </div>
              <SimpleChart data={ptScores.pullups} valueKey="count" />
              <div className="flex justify-between items-center mt-2 text-sm">
                <span>Initial: {ptScores.pullups[0].count}</span>
                <span className="font-medium">Current: {ptScores.pullups[ptScores.pullups.length - 1].count}</span>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "strength" && (
          <div className="space-y-6">
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Back Squat</h3>
                <div className="flex items-center text-sm text-green-500">
                  <TrendingUp size={16} className="mr-1" />
                  {getChangePercentage(strengthProgress.backSquat, "weight")}%
                </div>
              </div>
              <SimpleChart data={strengthProgress.backSquat} valueKey="weight" />
              <div className="flex justify-between items-center mt-2 text-sm">
                <span>Initial: {strengthProgress.backSquat[0].weight} lbs</span>
                <span className="font-medium">Current: {strengthProgress.backSquat[strengthProgress.backSquat.length - 1].weight} lbs</span>
              </div>
            </div>
            
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Deadlift</h3>
                <div className="flex items-center text-sm text-green-500">
                  <TrendingUp size={16} className="mr-1" />
                  {getChangePercentage(strengthProgress.deadlift, "weight")}%
                </div>
              </div>
              <SimpleChart data={strengthProgress.deadlift} valueKey="weight" />
              <div className="flex justify-between items-center mt-2 text-sm">
                <span>Initial: {strengthProgress.deadlift[0].weight} lbs</span>
                <span className="font-medium">Current: {strengthProgress.deadlift[strengthProgress.deadlift.length - 1].weight} lbs</span>
              </div>
            </div>
            
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Bench Press</h3>
                <div className="flex items-center text-sm text-green-500">
                  <TrendingUp size={16} className="mr-1" />
                  {getChangePercentage(strengthProgress.benchPress, "weight")}%
                </div>
              </div>
              <SimpleChart data={strengthProgress.benchPress} valueKey="weight" />
              <div className="flex justify-between items-center mt-2 text-sm">
                <span>Initial: {strengthProgress.benchPress[0].weight} lbs</span>
                <span className="font-medium">Current: {strengthProgress.benchPress[strengthProgress.benchPress.length - 1].weight} lbs</span>
              </div>
            </div>
            
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Overhead Press</h3>
                <div className="flex items-center text-sm text-green-500">
                  <TrendingUp size={16} className="mr-1" />
                  {getChangePercentage(strengthProgress.overheadPress, "weight")}%
                </div>
              </div>
              <SimpleChart data={strengthProgress.overheadPress} valueKey="weight" />
              <div className="flex justify-between items-center mt-2 text-sm">
                <span>Initial: {strengthProgress.overheadPress[0].weight} lbs</span>
                <span className="font-medium">Current: {strengthProgress.overheadPress[strengthProgress.overheadPress.length - 1].weight} lbs</span>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "endurance" && (
          <div className="space-y-6">
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Ruck Time (12 miles)</h3>
                <div className="flex items-center text-sm text-green-500">
                  <TrendingUp size={16} className="mr-1" />
                  {getChangePercentage(enduranceProgress.ruckTime, "time")}%
                </div>
              </div>
              <SimpleChart data={enduranceProgress.ruckTime} valueKey="time" lowerIsBetter={true} />
              <div className="flex justify-between items-center mt-2 text-sm">
                <span>Initial: {Math.floor(enduranceProgress.ruckTime[0].time / 60)}:{(enduranceProgress.ruckTime[0].time % 60).toString().padStart(2, '0')}</span>
                <span className="font-medium">
                  Current: {Math.floor(enduranceProgress.ruckTime[enduranceProgress.ruckTime.length - 1].time / 60)}:{(enduranceProgress.ruckTime[enduranceProgress.ruckTime.length - 1].time % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
            
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Max Ruck Distance</h3>
                <div className="flex items-center text-sm text-green-500">
                  <TrendingUp size={16} className="mr-1" />
                  {getChangePercentage(enduranceProgress.distance, "miles")}%
                </div>
              </div>
              <SimpleChart data={enduranceProgress.distance} valueKey="miles" />
              <div className="flex justify-between items-center mt-2 text-sm">
                <span>Initial: {enduranceProgress.distance[0].miles} miles</span>
                <span className="font-medium">Current: {enduranceProgress.distance[enduranceProgress.distance.length - 1].miles} miles</span>
              </div>
            </div>
            
            <div className="p-4 bg-secondary/50 rounded-lg">
              <h3 className="font-medium mb-2">Add Endurance Metric</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Track additional endurance metrics to monitor your progress.
              </p>
              <button className="btn-outline">
                Add New Metric
              </button>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default Progress;
