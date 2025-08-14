-- Create conjugate templates table for storing training configurations
CREATE TABLE public.conjugate_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_type TEXT NOT NULL, -- 'variation_pools', 'de_waves', 'accessory_categories'
  name TEXT NOT NULL,
  config JSONB NOT NULL,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.conjugate_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all conjugate templates" 
ON public.conjugate_templates 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view active conjugate templates" 
ON public.conjugate_templates 
FOR SELECT 
USING (is_active = true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_conjugate_templates_updated_at
BEFORE UPDATE ON public.conjugate_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default conjugate templates
INSERT INTO public.conjugate_templates (template_type, name, config) VALUES 
(
  'variation_pools',
  'Default ME Upper',
  '{
    "variations": [
      {"name": "Floor Press", "category": "press", "equipment": "barbell"},
      {"name": "Close Grip Bench", "category": "press", "equipment": "barbell"},
      {"name": "Incline Press", "category": "press", "equipment": "barbell"},
      {"name": "Weighted Dips", "category": "press", "equipment": "bodyweight"},
      {"name": "Board Press", "category": "press", "equipment": "barbell"}
    ]
  }'
),
(
  'variation_pools',
  'Default ME Lower',
  '{
    "variations": [
      {"name": "Box Squat", "category": "squat", "equipment": "barbell"},
      {"name": "Pin Squat", "category": "squat", "equipment": "barbell"},
      {"name": "Front Squat", "category": "squat", "equipment": "barbell"},
      {"name": "Sumo Deadlift", "category": "deadlift", "equipment": "barbell"},
      {"name": "Rack Pull", "category": "deadlift", "equipment": "barbell"}
    ]
  }'
),
(
  'de_waves',
  'Default DE Upper Wave',
  '{
    "waves": [
      {"week": 1, "percent": 50, "sets": 9, "reps": 3},
      {"week": 2, "percent": 55, "sets": 9, "reps": 3},
      {"week": 3, "percent": 60, "sets": 9, "reps": 3}
    ]
  }'
),
(
  'de_waves',
  'Default DE Lower Wave',
  '{
    "waves": [
      {"week": 1, "percent": 50, "sets": 10, "reps": 2},
      {"week": 2, "percent": 55, "sets": 10, "reps": 2},
      {"week": 3, "percent": 60, "sets": 10, "reps": 2}
    ]
  }'
),
(
  'accessory_categories',
  'Default Upper Accessories',
  '{
    "categories": [
      {
        "name": "Upper Push",
        "exercises": ["Overhead Press", "Dumbbell Press", "Tricep Extensions", "Dips"]
      },
      {
        "name": "Upper Pull", 
        "exercises": ["Rows", "Pull-ups", "Lat Pulldowns", "Face Pulls"]
      },
      {
        "name": "Posterior Chain",
        "exercises": ["Good Mornings", "Reverse Hypers", "Glute Ham Raises"]
      }
    ]
  }'
),
(
  'accessory_categories',
  'Default Lower Accessories',
  '{
    "categories": [
      {
        "name": "Posterior Chain",
        "exercises": ["Romanian Deadlifts", "Good Mornings", "Glute Bridges", "Back Extensions"]
      },
      {
        "name": "Trunk",
        "exercises": ["Planks", "Side Planks", "Dead Bugs", "Pallof Press"]
      },
      {
        "name": "GPP",
        "exercises": ["Sled Drags", "Farmer Walks", "Prowler Push", "Battle Ropes"]
      }
    ]
  }'
);