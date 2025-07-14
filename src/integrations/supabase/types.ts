export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      departments: {
        Row: {
          code: string
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      faculty: {
        Row: {
          created_at: string | null
          department_id: string | null
          email: string | null
          id: string
          max_hours_per_week: number | null
          name: string
          specialization: string[] | null
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          email?: string | null
          id?: string
          max_hours_per_week?: number | null
          name: string
          specialization?: string[] | null
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          email?: string | null
          id?: string
          max_hours_per_week?: number | null
          name?: string
          specialization?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "faculty_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      sections: {
        Row: {
          created_at: string | null
          department_id: string | null
          id: string
          max_students: number | null
          section_name: string
          year_id: string | null
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          id?: string
          max_students?: number | null
          section_name: string
          year_id?: string | null
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          id?: string
          max_students?: number | null
          section_name?: string
          year_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sections_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_year_id_fkey"
            columns: ["year_id"]
            isOneToOne: false
            referencedRelation: "years"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_assignments: {
        Row: {
          created_at: string | null
          faculty_id: string | null
          id: string
          section_id: string | null
          subject_id: string | null
        }
        Insert: {
          created_at?: string | null
          faculty_id?: string | null
          id?: string
          section_id?: string | null
          subject_id?: string | null
        }
        Update: {
          created_at?: string | null
          faculty_id?: string | null
          id?: string
          section_id?: string | null
          subject_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subject_assignments_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_assignments_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string
          created_at: string | null
          credits: number | null
          department_id: string | null
          hours_per_week: number
          id: string
          name: string
          subject_type: string
          year_id: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          credits?: number | null
          department_id?: string | null
          hours_per_week?: number
          id?: string
          name: string
          subject_type: string
          year_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          credits?: number | null
          department_id?: string | null
          hours_per_week?: number
          id?: string
          name?: string
          subject_type?: string
          year_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subjects_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_year_id_fkey"
            columns: ["year_id"]
            isOneToOne: false
            referencedRelation: "years"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_slots: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          room_number: string | null
          section_id: string | null
          start_time: string
          subject_assignment_id: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          room_number?: string | null
          section_id?: string | null
          start_time: string
          subject_assignment_id?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          room_number?: string | null
          section_id?: string | null
          start_time?: string
          subject_assignment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timetable_slots_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_slots_subject_assignment_id_fkey"
            columns: ["subject_assignment_id"]
            isOneToOne: false
            referencedRelation: "subject_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      timetables: {
        Row: {
          id: string
          created_at: string | null
          updated_at: string | null
          name: string
          department_id: string | null
          year_id: string | null
          section_id: string | null
          timetable_data: Json
          generation_settings: Json | null
          conflicts: string[] | null
          stats: Json | null
          is_active: boolean
          created_by: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          updated_at?: string | null
          name: string
          department_id?: string | null
          year_id?: string | null
          section_id?: string | null
          timetable_data: Json
          generation_settings?: Json | null
          conflicts?: string[] | null
          stats?: Json | null
          is_active?: boolean
          created_by?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          updated_at?: string | null
          name?: string
          department_id?: string | null
          year_id?: string | null
          section_id?: string | null
          timetable_data?: Json
          generation_settings?: Json | null
          conflicts?: string[] | null
          stats?: Json | null
          is_active?: boolean
          created_by?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timetables_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetables_year_id_fkey"
            columns: ["year_id"]
            isOneToOne: false
            referencedRelation: "years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetables_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      years: {
        Row: {
          created_at: string | null
          id: string
          year_name: string
          year_number: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          year_name: string
          year_number: number
        }
        Update: {
          created_at?: string | null
          id?: string
          year_name?: string
          year_number?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
