export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          changed_at: string
          changed_by: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      coach_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          athlete_id: string
          coach_id: string
          id: string
          notes: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          athlete_id: string
          coach_id: string
          id?: string
          notes?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          athlete_id?: string
          coach_id?: string
          id?: string
          notes?: string | null
        }
        Relationships: []
      }
      conjugate_templates: {
        Row: {
          config: Json
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          template_type: string
          updated_at: string
        }
        Insert: {
          config: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          template_type: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      content: {
        Row: {
          content: string | null
          content_type: string
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          content_type: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          content_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      movement_library: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          difficulty_level: string | null
          equipment_needed: string[] | null
          form_cues: Json | null
          id: string
          is_bodyweight: boolean | null
          name: string
          subcategory: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          equipment_needed?: string[] | null
          form_cues?: Json | null
          id?: string
          is_bodyweight?: boolean | null
          name: string
          subcategory?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          equipment_needed?: string[] | null
          form_cues?: Json | null
          id?: string
          is_bodyweight?: boolean | null
          name?: string
          subcategory?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      notification_queue: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          notification_type: string
          scheduled_for: string
          sent_at: string | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          notification_type: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          notification_type?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bench_5rm: number | null
          created_at: string
          deadlift_5rm: number | null
          first_name: string | null
          focus_type: string | null
          has_completed_onboarding: boolean
          height: number | null
          id: string
          last_name: string | null
          selection_date: string | null
          selection_type: string | null
          squat_5rm: number | null
          swim_time: string | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          avatar_url?: string | null
          bench_5rm?: number | null
          created_at?: string
          deadlift_5rm?: number | null
          first_name?: string | null
          focus_type?: string | null
          has_completed_onboarding?: boolean
          height?: number | null
          id: string
          last_name?: string | null
          selection_date?: string | null
          selection_type?: string | null
          squat_5rm?: number | null
          swim_time?: string | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          avatar_url?: string | null
          bench_5rm?: number | null
          created_at?: string
          deadlift_5rm?: number | null
          first_name?: string | null
          focus_type?: string | null
          has_completed_onboarding?: boolean
          height?: number | null
          id?: string
          last_name?: string | null
          selection_date?: string | null
          selection_type?: string | null
          squat_5rm?: number | null
          swim_time?: string | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: []
      }
      program_versions: {
        Row: {
          change_notes: string | null
          created_at: string
          created_by: string | null
          description: string | null
          exercises: Json
          id: string
          program_id: string
          title: string
          version_number: number
        }
        Insert: {
          change_notes?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          exercises: Json
          id?: string
          program_id: string
          title: string
          version_number: number
        }
        Update: {
          change_notes?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          exercises?: Json
          id?: string
          program_id?: string
          title?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_versions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "workout_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      pt_metrics: {
        Row: {
          id: string
          pullups: number | null
          pushups: number | null
          recorded_at: string
          run_time: string | null
          situps: number | null
          user_id: string
        }
        Insert: {
          id?: string
          pullups?: number | null
          pushups?: number | null
          recorded_at?: string
          run_time?: string | null
          situps?: number | null
          user_id: string
        }
        Update: {
          id?: string
          pullups?: number | null
          pushups?: number | null
          recorded_at?: string
          run_time?: string | null
          situps?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_program_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          end_date: string | null
          id: string
          program_id: string | null
          start_date: string | null
          user_id: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          end_date?: string | null
          id?: string
          program_id?: string | null
          start_date?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          end_date?: string | null
          id?: string
          program_id?: string | null
          start_date?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_program_assignments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "workout_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_scheduled_workouts: {
        Row: {
          created_at: string
          date: string
          day_type: string
          exercises: Json
          id: string
          program_id: string | null
          source: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          day_type: string
          exercises?: Json
          id?: string
          program_id?: string | null
          source?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          day_type?: string
          exercises?: Json
          id?: string
          program_id?: string | null
          source?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_set_logs: {
        Row: {
          actual_reps: number | null
          actual_weight: number | null
          completed: boolean
          created_at: string
          exercise_index: number
          id: string
          notes: string | null
          set_number: number
          target_reps: number | null
          target_weight: number | null
          updated_at: string
          workout_log_id: string
        }
        Insert: {
          actual_reps?: number | null
          actual_weight?: number | null
          completed?: boolean
          created_at?: string
          exercise_index: number
          id?: string
          notes?: string | null
          set_number: number
          target_reps?: number | null
          target_weight?: number | null
          updated_at?: string
          workout_log_id: string
        }
        Update: {
          actual_reps?: number | null
          actual_weight?: number | null
          completed?: boolean
          created_at?: string
          exercise_index?: number
          id?: string
          notes?: string | null
          set_number?: number
          target_reps?: number | null
          target_weight?: number | null
          updated_at?: string
          workout_log_id?: string
        }
        Relationships: []
      }
      user_workout_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          rpe: number | null
          scheduled_workout_id: string
          started_at: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          rpe?: number | null
          scheduled_workout_id: string
          started_at?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          rpe?: number | null
          scheduled_workout_id?: string
          started_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      workout_exercises: {
        Row: {
          bodyweight_percentage: number | null
          created_at: string
          id: string
          is_bodyweight_percentage: boolean
          movement_name: string
          notes: string | null
          order_position: number
          program_id: string
          reps: number
          sets: number
        }
        Insert: {
          bodyweight_percentage?: number | null
          created_at?: string
          id?: string
          is_bodyweight_percentage?: boolean
          movement_name: string
          notes?: string | null
          order_position?: number
          program_id: string
          reps?: number
          sets?: number
        }
        Update: {
          bodyweight_percentage?: number | null
          created_at?: string
          id?: string
          is_bodyweight_percentage?: boolean
          movement_name?: string
          notes?: string | null
          order_position?: number
          program_id?: string
          reps?: number
          sets?: number
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "workout_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_programs: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      user_performance_summary: {
        Row: {
          avg_rpe: number | null
          bench_5rm: number | null
          bodyweight: number | null
          deadlift_5rm: number | null
          first_name: string | null
          last_name: string | null
          last_workout_date: string | null
          latest_pullups: number | null
          latest_pushups: number | null
          latest_run_time: string | null
          latest_situps: number | null
          selection_date: string | null
          squat_5rm: number | null
          total_training_days: number | null
          total_volume_lbs: number | null
          total_workouts_completed: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_performance: {
        Args: { target_user_id?: string }
        Returns: {
          avg_rpe: number
          bench_5rm: number
          bodyweight: number
          deadlift_5rm: number
          first_name: string
          last_name: string
          last_workout_date: string
          latest_pullups: number
          latest_pushups: number
          latest_run_time: string
          latest_situps: number
          selection_date: string
          squat_5rm: number
          total_training_days: number
          total_volume_lbs: number
          total_workouts_completed: number
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      refresh_performance_summary: { Args: never; Returns: undefined }
      write_audit_entry: {
        Args: {
          _action: string
          _new: Json
          _old: Json
          _record: string
          _table: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user" | "coach"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "coach"],
    },
  },
} as const
