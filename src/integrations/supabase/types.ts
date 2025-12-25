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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_activity_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      api_call_logs: {
        Row: {
          created_at: string
          duration_ms: number
          endpoint: string
          error_message: string | null
          id: string
          method: string
          request_payload: Json | null
          response_payload: Json | null
          session_id: string
          status_code: number | null
          success: boolean
          user_id: string | null
        }
        Insert: {
          created_at?: string
          duration_ms: number
          endpoint: string
          error_message?: string | null
          id?: string
          method: string
          request_payload?: Json | null
          response_payload?: Json | null
          session_id: string
          status_code?: number | null
          success?: boolean
          user_id?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number
          endpoint?: string
          error_message?: string | null
          id?: string
          method?: string
          request_payload?: Json | null
          response_payload?: Json | null
          session_id?: string
          status_code?: number | null
          success?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          confidence_score: number | null
          content: string
          created_at: string | null
          id: string
          intent_detected: string | null
          message_type: string
          metadata: Json | null
          sender_type: string
          session_id: string
        }
        Insert: {
          confidence_score?: number | null
          content: string
          created_at?: string | null
          id?: string
          intent_detected?: string | null
          message_type?: string
          metadata?: Json | null
          sender_type: string
          session_id: string
        }
        Update: {
          confidence_score?: number | null
          content?: string
          created_at?: string | null
          id?: string
          intent_detected?: string | null
          message_type?: string
          metadata?: Json | null
          sender_type?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          closed_at: string | null
          created_at: string | null
          escalated_to: string | null
          id: string
          order_id: string | null
          resolution_time_seconds: number | null
          satisfaction_rating: number | null
          session_type: string
          status: string
          user_id: string | null
        }
        Insert: {
          closed_at?: string | null
          created_at?: string | null
          escalated_to?: string | null
          id?: string
          order_id?: string | null
          resolution_time_seconds?: number | null
          satisfaction_rating?: number | null
          session_type?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          closed_at?: string | null
          created_at?: string | null
          escalated_to?: string | null
          id?: string
          order_id?: string | null
          resolution_time_seconds?: number | null
          satisfaction_rating?: number | null
          session_type?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          city: string
          created_at: string
          id: string
          is_default: boolean | null
          label: string
          latitude: number | null
          longitude: number | null
          state: string
          street_address: string
          updated_at: string
          user_id: string
          zip_code: string
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          label: string
          latitude?: number | null
          longitude?: number | null
          state: string
          street_address: string
          updated_at?: string
          user_id: string
          zip_code: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          label?: string
          latitude?: number | null
          longitude?: number | null
          state?: string
          street_address?: string
          updated_at?: string
          user_id?: string
          zip_code?: string
        }
        Relationships: []
      }
      delivery_earnings: {
        Row: {
          base_fee: number
          bonus: number | null
          created_at: string
          delivery_partner_id: string
          distance_fee: number | null
          id: string
          net_payout: number
          order_id: string
          paid_out: boolean | null
          paid_out_at: string | null
          platform_fee_amount: number
          platform_fee_rate: number
          settlement_fee_amount: number
          tip: number | null
          total_earnings: number
        }
        Insert: {
          base_fee: number
          bonus?: number | null
          created_at?: string
          delivery_partner_id: string
          distance_fee?: number | null
          id?: string
          net_payout?: number
          order_id: string
          paid_out?: boolean | null
          paid_out_at?: string | null
          platform_fee_amount?: number
          platform_fee_rate?: number
          settlement_fee_amount?: number
          tip?: number | null
          total_earnings: number
        }
        Update: {
          base_fee?: number
          bonus?: number | null
          created_at?: string
          delivery_partner_id?: string
          distance_fee?: number | null
          id?: string
          net_payout?: number
          order_id?: string
          paid_out?: boolean | null
          paid_out_at?: string | null
          platform_fee_amount?: number
          platform_fee_rate?: number
          settlement_fee_amount?: number
          tip?: number | null
          total_earnings?: number
        }
        Relationships: [
          {
            foreignKeyName: "delivery_earnings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_partner_locations: {
        Row: {
          accuracy: number | null
          created_at: string
          delivery_partner_id: string
          heading: number | null
          id: string
          is_active: boolean | null
          latitude: number
          longitude: number
          order_id: string | null
          speed: number | null
          updated_at: string
        }
        Insert: {
          accuracy?: number | null
          created_at?: string
          delivery_partner_id: string
          heading?: number | null
          id?: string
          is_active?: boolean | null
          latitude: number
          longitude: number
          order_id?: string | null
          speed?: number | null
          updated_at?: string
        }
        Update: {
          accuracy?: number | null
          created_at?: string
          delivery_partner_id?: string
          heading?: number | null
          id?: string
          is_active?: boolean | null
          latitude?: number
          longitude?: number
          order_id?: string | null
          speed?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_partner_locations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_partner_status: {
        Row: {
          available_for_orders: boolean | null
          created_at: string | null
          current_latitude: number | null
          current_longitude: number | null
          current_order_count: number | null
          id: string
          is_online: boolean | null
          last_online_at: string | null
          max_concurrent_orders: number | null
          partner_id: string
          updated_at: string | null
        }
        Insert: {
          available_for_orders?: boolean | null
          created_at?: string | null
          current_latitude?: number | null
          current_longitude?: number | null
          current_order_count?: number | null
          id?: string
          is_online?: boolean | null
          last_online_at?: string | null
          max_concurrent_orders?: number | null
          partner_id: string
          updated_at?: string | null
        }
        Update: {
          available_for_orders?: boolean | null
          created_at?: string | null
          current_latitude?: number | null
          current_longitude?: number | null
          current_order_count?: number | null
          id?: string
          is_online?: boolean | null
          last_online_at?: string | null
          max_concurrent_orders?: number | null
          partner_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      driver_documents: {
        Row: {
          created_at: string
          document_type: string
          document_url: string
          driver_id: string
          expiry_date: string | null
          id: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["verification_status"] | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          document_url: string
          driver_id: string
          expiry_date?: string | null
          id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["verification_status"] | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          document_url?: string
          driver_id?: string
          expiry_date?: string | null
          id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["verification_status"] | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_documents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_locations: {
        Row: {
          accuracy: number | null
          created_at: string
          driver_id: string
          heading: number | null
          id: string
          latitude: number
          location: unknown
          longitude: number
          ride_id: string | null
          speed: number | null
          updated_at: string
        }
        Insert: {
          accuracy?: number | null
          created_at?: string
          driver_id: string
          heading?: number | null
          id?: string
          latitude: number
          location?: unknown
          longitude: number
          ride_id?: string | null
          speed?: number | null
          updated_at?: string
        }
        Update: {
          accuracy?: number | null
          created_at?: string
          driver_id?: string
          heading?: number | null
          id?: string
          latitude?: number
          location?: unknown
          longitude?: number
          ride_id?: string | null
          speed?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_locations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_locations_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_tier_verifications: {
        Row: {
          created_at: string
          driver_id: string
          id: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["verification_status"] | null
          tier: Database["public"]["Enums"]["service_tier"]
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          driver_id: string
          id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["verification_status"] | null
          tier: Database["public"]["Enums"]["service_tier"]
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          driver_id?: string
          id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["verification_status"] | null
          tier?: Database["public"]["Enums"]["service_tier"]
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_tier_verifications_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          acceptance_rate: number | null
          average_rating: number | null
          bank_account_holder: string | null
          bank_account_number: string | null
          bank_name: string | null
          cancelled_rides: number | null
          completed_rides: number | null
          created_at: string
          current_tier: Database["public"]["Enums"]["service_tier"] | null
          id: string
          insurance_expiry: string | null
          insurance_number: string | null
          is_active: boolean | null
          is_available: boolean | null
          is_verified: boolean | null
          license_expiry: string | null
          license_number: string | null
          total_earnings: number | null
          total_rides: number | null
          updated_at: string
          user_id: string
          vehicle_color: string
          vehicle_license_plate: string
          vehicle_make: string
          vehicle_model: string
          vehicle_type: string
          vehicle_year: number
        }
        Insert: {
          acceptance_rate?: number | null
          average_rating?: number | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          cancelled_rides?: number | null
          completed_rides?: number | null
          created_at?: string
          current_tier?: Database["public"]["Enums"]["service_tier"] | null
          id?: string
          insurance_expiry?: string | null
          insurance_number?: string | null
          is_active?: boolean | null
          is_available?: boolean | null
          is_verified?: boolean | null
          license_expiry?: string | null
          license_number?: string | null
          total_earnings?: number | null
          total_rides?: number | null
          updated_at?: string
          user_id: string
          vehicle_color: string
          vehicle_license_plate: string
          vehicle_make: string
          vehicle_model: string
          vehicle_type?: string
          vehicle_year: number
        }
        Update: {
          acceptance_rate?: number | null
          average_rating?: number | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          cancelled_rides?: number | null
          completed_rides?: number | null
          created_at?: string
          current_tier?: Database["public"]["Enums"]["service_tier"] | null
          id?: string
          insurance_expiry?: string | null
          insurance_number?: string | null
          is_active?: boolean | null
          is_available?: boolean | null
          is_verified?: boolean | null
          license_expiry?: string | null
          license_number?: string | null
          total_earnings?: number | null
          total_rides?: number | null
          updated_at?: string
          user_id?: string
          vehicle_color?: string
          vehicle_license_plate?: string
          vehicle_make?: string
          vehicle_model?: string
          vehicle_type?: string
          vehicle_year?: number
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          browser_info: Json | null
          component: string | null
          created_at: string
          error_message: string
          error_type: string
          id: string
          page_url: string
          resolved: boolean
          session_id: string
          severity: Database["public"]["Enums"]["error_severity"]
          stack_trace: string | null
          user_id: string | null
        }
        Insert: {
          browser_info?: Json | null
          component?: string | null
          created_at?: string
          error_message: string
          error_type: string
          id?: string
          page_url: string
          resolved?: boolean
          session_id: string
          severity?: Database["public"]["Enums"]["error_severity"]
          stack_trace?: string | null
          user_id?: string | null
        }
        Update: {
          browser_info?: Json | null
          component?: string | null
          created_at?: string
          error_message?: string
          error_type?: string
          id?: string
          page_url?: string
          resolved?: boolean
          session_id?: string
          severity?: Database["public"]["Enums"]["error_severity"]
          stack_trace?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      experience_bookings: {
        Row: {
          booking_date: string
          booking_number: string | null
          booking_time: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string | null
          currency: string | null
          discount: number | null
          experience_id: string
          fees: number | null
          guest_email: string
          guest_id: string | null
          guest_name: string
          guest_phone: string | null
          id: string
          num_participants: number
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          schedule_id: string | null
          special_requests: string | null
          status: string | null
          subtotal: number
          taxes: number | null
          total: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          booking_date: string
          booking_number?: string | null
          booking_time?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          currency?: string | null
          discount?: number | null
          experience_id: string
          fees?: number | null
          guest_email: string
          guest_id?: string | null
          guest_name: string
          guest_phone?: string | null
          id?: string
          num_participants?: number
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          schedule_id?: string | null
          special_requests?: string | null
          status?: string | null
          subtotal: number
          taxes?: number | null
          total: number
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          booking_date?: string
          booking_number?: string | null
          booking_time?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          currency?: string | null
          discount?: number | null
          experience_id?: string
          fees?: number | null
          guest_email?: string
          guest_id?: string | null
          guest_name?: string
          guest_phone?: string | null
          id?: string
          num_participants?: number
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          schedule_id?: string | null
          special_requests?: string | null
          status?: string | null
          subtotal?: number
          taxes?: number | null
          total?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experience_bookings_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_bookings_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "experience_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_schedules: {
        Row: {
          available_spots: number
          booked_spots: number | null
          created_at: string | null
          date: string
          end_time: string | null
          experience_id: string
          id: string
          is_active: boolean | null
          price_override: number | null
          start_time: string
        }
        Insert: {
          available_spots: number
          booked_spots?: number | null
          created_at?: string | null
          date: string
          end_time?: string | null
          experience_id: string
          id?: string
          is_active?: boolean | null
          price_override?: number | null
          start_time: string
        }
        Update: {
          available_spots?: number
          booked_spots?: number | null
          created_at?: string | null
          date?: string
          end_time?: string | null
          experience_id?: string
          id?: string
          is_active?: boolean | null
          price_override?: number | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_schedules_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences: {
        Row: {
          cancellation_policy: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          duration_minutes: number | null
          excludes: string[] | null
          experience_type: string
          gallery_images: string[] | null
          id: string
          includes: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          main_image: string | null
          max_participants: number | null
          min_participants: number | null
          name: string
          owner_id: string
          price: number
          rating: number | null
          requirements: string[] | null
          slug: string | null
          total_reviews: number | null
          updated_at: string | null
          venue_id: string | null
        }
        Insert: {
          cancellation_policy?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          duration_minutes?: number | null
          excludes?: string[] | null
          experience_type?: string
          gallery_images?: string[] | null
          id?: string
          includes?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          main_image?: string | null
          max_participants?: number | null
          min_participants?: number | null
          name: string
          owner_id: string
          price: number
          rating?: number | null
          requirements?: string[] | null
          slug?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          venue_id?: string | null
        }
        Update: {
          cancellation_policy?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          duration_minutes?: number | null
          excludes?: string[] | null
          experience_type?: string
          gallery_images?: string[] | null
          id?: string
          includes?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          main_image?: string | null
          max_participants?: number | null
          min_participants?: number | null
          name?: string
          owner_id?: string
          price?: number
          rating?: number | null
          requirements?: string[] | null
          slug?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experiences_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_entries: {
        Row: {
          answer: string
          category: string
          created_at: string | null
          helpful_count: number | null
          id: string
          is_active: boolean | null
          keywords: string[] | null
          not_helpful_count: number | null
          question: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          category: string
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          not_helpful_count?: number | null
          question: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          not_helpful_count?: number | null
          question?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      hotel_bookings: {
        Row: {
          booking_number: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          check_in_date: string
          check_out_date: string
          created_at: string | null
          currency: string | null
          discount: number | null
          fees: number | null
          guest_email: string
          guest_id: string | null
          guest_name: string
          guest_phone: string | null
          hotel_id: string
          id: string
          nightly_rate: number
          num_guests: number | null
          num_nights: number
          num_rooms: number | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          room_type_id: string
          special_requests: string | null
          status: string | null
          subtotal: number
          taxes: number | null
          total: number
          updated_at: string | null
        }
        Insert: {
          booking_number?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          check_in_date: string
          check_out_date: string
          created_at?: string | null
          currency?: string | null
          discount?: number | null
          fees?: number | null
          guest_email: string
          guest_id?: string | null
          guest_name: string
          guest_phone?: string | null
          hotel_id: string
          id?: string
          nightly_rate: number
          num_guests?: number | null
          num_nights: number
          num_rooms?: number | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          room_type_id: string
          special_requests?: string | null
          status?: string | null
          subtotal: number
          taxes?: number | null
          total: number
          updated_at?: string | null
        }
        Update: {
          booking_number?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          check_in_date?: string
          check_out_date?: string
          created_at?: string | null
          currency?: string | null
          discount?: number | null
          fees?: number | null
          guest_email?: string
          guest_id?: string | null
          guest_name?: string
          guest_phone?: string | null
          hotel_id?: string
          id?: string
          nightly_rate?: number
          num_guests?: number | null
          num_nights?: number
          num_rooms?: number | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          room_type_id?: string
          special_requests?: string | null
          status?: string | null
          subtotal?: number
          taxes?: number | null
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hotel_bookings_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_bookings_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      hotels: {
        Row: {
          amenities: string[] | null
          base_price: number | null
          cancellation_policy: string | null
          check_in_time: string | null
          check_out_time: string | null
          city: string
          country: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          email: string | null
          gallery_images: string[] | null
          house_rules: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          latitude: number | null
          longitude: number | null
          main_image: string | null
          name: string
          owner_id: string
          phone: string | null
          property_type: string | null
          rating: number | null
          slug: string | null
          star_rating: number | null
          state: string | null
          street_address: string
          total_reviews: number | null
          total_rooms: number | null
          updated_at: string | null
          verification_status: string | null
          website: string | null
          zip_code: string | null
        }
        Insert: {
          amenities?: string[] | null
          base_price?: number | null
          cancellation_policy?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          city: string
          country?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          email?: string | null
          gallery_images?: string[] | null
          house_rules?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          latitude?: number | null
          longitude?: number | null
          main_image?: string | null
          name: string
          owner_id: string
          phone?: string | null
          property_type?: string | null
          rating?: number | null
          slug?: string | null
          star_rating?: number | null
          state?: string | null
          street_address: string
          total_reviews?: number | null
          total_rooms?: number | null
          updated_at?: string | null
          verification_status?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          amenities?: string[] | null
          base_price?: number | null
          cancellation_policy?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          city?: string
          country?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          email?: string | null
          gallery_images?: string[] | null
          house_rules?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          latitude?: number | null
          longitude?: number | null
          main_image?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          property_type?: string | null
          rating?: number | null
          slug?: string | null
          star_rating?: number | null
          state?: string | null
          street_address?: string
          total_reviews?: number | null
          total_rooms?: number | null
          updated_at?: string | null
          verification_status?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      loyalty_tiers: {
        Row: {
          badge_color: string
          benefits: string[] | null
          id: string
          min_points: number
          multiplier: number
          name: string
        }
        Insert: {
          badge_color: string
          benefits?: string[] | null
          id?: string
          min_points?: number
          multiplier?: number
          name: string
        }
        Update: {
          badge_color?: string
          benefits?: string[] | null
          id?: string
          min_points?: number
          multiplier?: number
          name?: string
        }
        Relationships: []
      }
      loyalty_transactions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          points: number
          reference_id: string | null
          type: string
          user_loyalty_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          points: number
          reference_id?: string | null
          type: string
          user_loyalty_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          points?: number
          reference_id?: string | null
          type?: string
          user_loyalty_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_user_loyalty_id_fkey"
            columns: ["user_loyalty_id"]
            isOneToOne: false
            referencedRelation: "user_loyalty"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          campaign_type: string
          clicks: number | null
          conversions: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string
          id: string
          impressions: number | null
          name: string
          promo_code_id: string | null
          start_date: string
          status: string | null
          target_audience: string
          updated_at: string | null
        }
        Insert: {
          campaign_type: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date: string
          id?: string
          impressions?: number | null
          name: string
          promo_code_id?: string | null
          start_date: string
          status?: string | null
          target_audience: string
          updated_at?: string | null
        }
        Update: {
          campaign_type?: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string
          id?: string
          impressions?: number | null
          name?: string
          promo_code_id?: string | null
          start_date?: string
          status?: string | null
          target_audience?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          barcode: string | null
          brand: string | null
          calories: number | null
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          is_gluten_free: boolean | null
          is_vegan: boolean | null
          is_vegetarian: boolean | null
          name: string
          preparation_time: number | null
          price: number
          product_type: string | null
          quantity_in_stock: number | null
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          calories?: number | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_gluten_free?: boolean | null
          is_vegan?: boolean | null
          is_vegetarian?: boolean | null
          name: string
          preparation_time?: number | null
          price: number
          product_type?: string | null
          quantity_in_stock?: number | null
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          calories?: number | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_gluten_free?: boolean | null
          is_vegan?: boolean | null
          is_vegetarian?: boolean | null
          name?: string
          preparation_time?: number | null
          price?: number
          product_type?: string | null
          quantity_in_stock?: number | null
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          menu_item_id: string
          order_id: string
          quantity: number
          special_instructions: string | null
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id: string
          order_id: string
          quantity?: number
          special_instructions?: string | null
          subtotal: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string
          order_id?: string
          quantity?: number
          special_instructions?: string | null
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_offers: {
        Row: {
          created_at: string | null
          estimated_earnings: number | null
          expires_at: string
          id: string
          offered_at: string | null
          order_id: string
          partner_id: string
          rejection_reason: string | null
          responded_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          estimated_earnings?: number | null
          expires_at: string
          id?: string
          offered_at?: string | null
          order_id: string
          partner_id: string
          rejection_reason?: string | null
          responded_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          estimated_earnings?: number | null
          expires_at?: string
          id?: string
          offered_at?: string | null
          order_id?: string
          partner_id?: string
          rejection_reason?: string | null
          responded_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_offers_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          notes: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          accepted_at: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          customer_id: string
          delivered_at: string | null
          delivery_address_id: string | null
          delivery_fee: number
          delivery_partner_id: string | null
          estimated_delivery_time: string | null
          fulfillment_type: string | null
          id: string
          net_restaurant_payout: number
          order_number: string
          payment_method: string | null
          payment_method_id: string | null
          payment_status: string | null
          picked_up_at: string | null
          pickup_code: string | null
          pickup_time: string | null
          platform_commission: number
          ready_at: string | null
          restaurant_id: string
          scheduled_for: string | null
          settlement_fee: number
          special_instructions: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax: number
          tip: number | null
          total: number
          updated_at: string
          wallet_amount_used: number | null
        }
        Insert: {
          accepted_at?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          customer_id: string
          delivered_at?: string | null
          delivery_address_id?: string | null
          delivery_fee?: number
          delivery_partner_id?: string | null
          estimated_delivery_time?: string | null
          fulfillment_type?: string | null
          id?: string
          net_restaurant_payout?: number
          order_number: string
          payment_method?: string | null
          payment_method_id?: string | null
          payment_status?: string | null
          picked_up_at?: string | null
          pickup_code?: string | null
          pickup_time?: string | null
          platform_commission?: number
          ready_at?: string | null
          restaurant_id: string
          scheduled_for?: string | null
          settlement_fee?: number
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax?: number
          tip?: number | null
          total: number
          updated_at?: string
          wallet_amount_used?: number | null
        }
        Update: {
          accepted_at?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          customer_id?: string
          delivered_at?: string | null
          delivery_address_id?: string | null
          delivery_fee?: number
          delivery_partner_id?: string | null
          estimated_delivery_time?: string | null
          fulfillment_type?: string | null
          id?: string
          net_restaurant_payout?: number
          order_number?: string
          payment_method?: string | null
          payment_method_id?: string | null
          payment_status?: string | null
          picked_up_at?: string | null
          pickup_code?: string | null
          pickup_time?: string | null
          platform_commission?: number
          ready_at?: string | null
          restaurant_id?: string
          scheduled_for?: string | null
          settlement_fee?: number
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax?: number
          tip?: number | null
          total?: number
          updated_at?: string
          wallet_amount_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "customer_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      panic_alerts: {
        Row: {
          address: string | null
          created_at: string | null
          description: string | null
          id: string
          latitude: number | null
          longitude: number | null
          province: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
          user_phone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          province?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
          user_phone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          province?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
          user_phone?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          error_message: string | null
          id: string
          order_id: string
          payment_method: string
          status: Database["public"]["Enums"]["payment_status"]
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          error_message?: string | null
          id?: string
          order_id: string
          payment_method: string
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          error_message?: string | null
          id?: string
          order_id?: string
          payment_method?: string
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email_verified: boolean | null
          full_name: string
          id: string
          is_suspended: boolean | null
          phone: string | null
          suspended_at: string | null
          suspension_reason: string | null
          two_factor_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email_verified?: boolean | null
          full_name: string
          id: string
          is_suspended?: boolean | null
          phone?: string | null
          suspended_at?: string | null
          suspension_reason?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email_verified?: boolean | null
          full_name?: string
          id?: string
          is_suspended?: boolean | null
          phone?: string | null
          suspended_at?: string | null
          suspension_reason?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      promo_code_usage: {
        Row: {
          discount_applied: number
          id: string
          order_id: string | null
          promo_code_id: string | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          discount_applied: number
          id?: string
          order_id?: string | null
          promo_code_id?: string | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          discount_applied?: number
          id?: string
          order_id?: string | null
          promo_code_id?: string | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_usage_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          applicable_to: string | null
          code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          discount_type: string
          discount_value: number
          end_date: string
          id: string
          is_active: boolean | null
          max_discount_amount: number | null
          min_order_amount: number | null
          per_user_limit: number | null
          restaurant_ids: string[] | null
          start_date: string
          updated_at: string | null
          usage_count: number | null
          usage_limit: number | null
        }
        Insert: {
          applicable_to?: string | null
          code: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          end_date: string
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_order_amount?: number | null
          per_user_limit?: number | null
          restaurant_ids?: string[] | null
          start_date: string
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
        }
        Update: {
          applicable_to?: string | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          end_date?: string
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_order_amount?: number | null
          per_user_limit?: number | null
          restaurant_ids?: string[] | null
          start_date?: string
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
        }
        Relationships: []
      }
      promotional_banners: {
        Row: {
          clicks: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          display_order: number | null
          end_date: string
          id: string
          image_url: string | null
          impressions: number | null
          is_active: boolean | null
          link_type: string | null
          link_url: string | null
          position: string | null
          start_date: string
          title: string
          updated_at: string | null
        }
        Insert: {
          clicks?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          end_date: string
          id?: string
          image_url?: string | null
          impressions?: number | null
          is_active?: boolean | null
          link_type?: string | null
          link_url?: string | null
          position?: string | null
          start_date: string
          title: string
          updated_at?: string | null
        }
        Update: {
          clicks?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          end_date?: string
          id?: string
          image_url?: string | null
          impressions?: number | null
          is_active?: boolean | null
          link_type?: string | null
          link_url?: string | null
          position?: string | null
          start_date?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      provider_applications: {
        Row: {
          address: string | null
          business_name: string
          business_type: string | null
          city: string | null
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at: string | null
          documents: Json | null
          id: string
          postal_code: string | null
          provider_type: string
          province: string | null
          registration_number: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          vat_number: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          business_type?: string | null
          city?: string | null
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at?: string | null
          documents?: Json | null
          id?: string
          postal_code?: string | null
          provider_type: string
          province?: string | null
          registration_number?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          vat_number?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          business_type?: string | null
          city?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          created_at?: string | null
          documents?: Json | null
          id?: string
          postal_code?: string | null
          provider_type?: string
          province?: string | null
          registration_number?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          vat_number?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string | null
          created_at: string
          endpoint: string
          id: string
          p256dh: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auth?: string | null
          created_at?: string
          endpoint: string
          id?: string
          p256dh?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string | null
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          count: number
          created_at: string | null
          key: string
          reset_at: number
        }
        Insert: {
          count?: number
          created_at?: string | null
          key: string
          reset_at: number
        }
        Update: {
          count?: number
          created_at?: string | null
          key?: string
          reset_at?: number
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          approval_notes: string | null
          approval_status: string | null
          approved_at: string | null
          business_type: string | null
          city: string
          commission_rate: number
          created_at: string
          cuisine_type: string | null
          custom_commission: boolean
          delivery_fee: number | null
          description: string | null
          email: string | null
          estimated_delivery_time: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_open: boolean | null
          latitude: number | null
          longitude: number | null
          minimum_order: number | null
          name: string
          owner_id: string
          phone: string
          pickup_instructions: string | null
          rating: number | null
          state: string
          street_address: string
          supports_delivery: boolean | null
          supports_pickup: boolean | null
          total_reviews: number | null
          updated_at: string
          zip_code: string
        }
        Insert: {
          approval_notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          business_type?: string | null
          city: string
          commission_rate?: number
          created_at?: string
          cuisine_type?: string | null
          custom_commission?: boolean
          delivery_fee?: number | null
          description?: string | null
          email?: string | null
          estimated_delivery_time?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_open?: boolean | null
          latitude?: number | null
          longitude?: number | null
          minimum_order?: number | null
          name: string
          owner_id: string
          phone: string
          pickup_instructions?: string | null
          rating?: number | null
          state: string
          street_address: string
          supports_delivery?: boolean | null
          supports_pickup?: boolean | null
          total_reviews?: number | null
          updated_at?: string
          zip_code: string
        }
        Update: {
          approval_notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          business_type?: string | null
          city?: string
          commission_rate?: number
          created_at?: string
          cuisine_type?: string | null
          custom_commission?: boolean
          delivery_fee?: number | null
          description?: string | null
          email?: string | null
          estimated_delivery_time?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_open?: boolean | null
          latitude?: number | null
          longitude?: number | null
          minimum_order?: number | null
          name?: string
          owner_id?: string
          phone?: string
          pickup_instructions?: string | null
          rating?: number | null
          state?: string
          street_address?: string
          supports_delivery?: boolean | null
          supports_pickup?: boolean | null
          total_reviews?: number | null
          updated_at?: string
          zip_code?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string
          delivery_rating: number
          food_rating: number
          helpful_count: number | null
          id: string
          images: string[] | null
          is_anonymous: boolean | null
          order_id: string
          rating: number
          response_date: string | null
          response_text: string | null
          restaurant_id: string
          review_text: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_rating: number
          food_rating: number
          helpful_count?: number | null
          id?: string
          images?: string[] | null
          is_anonymous?: boolean | null
          order_id: string
          rating: number
          response_date?: string | null
          response_text?: string | null
          restaurant_id: string
          review_text?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_rating?: number
          food_rating?: number
          helpful_count?: number | null
          id?: string
          images?: string[] | null
          is_anonymous?: boolean | null
          order_id?: string
          rating?: number
          response_date?: string | null
          response_text?: string | null
          restaurant_id?: string
          review_text?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_emergencies: {
        Row: {
          created_at: string
          emergency_type: string
          id: string
          location_latitude: number | null
          location_longitude: number | null
          notes: string | null
          reported_by: string
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          ride_id: string
        }
        Insert: {
          created_at?: string
          emergency_type: string
          id?: string
          location_latitude?: number | null
          location_longitude?: number | null
          notes?: string | null
          reported_by: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          ride_id: string
        }
        Update: {
          created_at?: string
          emergency_type?: string
          id?: string
          location_latitude?: number | null
          location_longitude?: number | null
          notes?: string | null
          reported_by?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          ride_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_emergencies_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_ratings: {
        Row: {
          cleanliness_rating: number | null
          comment: string | null
          communication_rating: number | null
          created_at: string
          id: string
          overall_rating: number
          professionalism_rating: number | null
          rated_by: string
          rated_user_id: string
          ride_id: string
          safety_rating: number | null
        }
        Insert: {
          cleanliness_rating?: number | null
          comment?: string | null
          communication_rating?: number | null
          created_at?: string
          id?: string
          overall_rating: number
          professionalism_rating?: number | null
          rated_by: string
          rated_user_id: string
          ride_id: string
          safety_rating?: number | null
        }
        Update: {
          cleanliness_rating?: number | null
          comment?: string | null
          communication_rating?: number | null
          created_at?: string
          id?: string
          overall_rating?: number
          professionalism_rating?: number | null
          rated_by?: string
          rated_user_id?: string
          ride_id?: string
          safety_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ride_ratings_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_service_tiers: {
        Row: {
          base_fare: number
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          minimum_rating: number
          minimum_vehicle_year: number
          name: string
          per_km_rate: number
          per_minute_rate: number
          platform_commission_rate: number
          requirements: Json | null
          tier: Database["public"]["Enums"]["service_tier"]
          updated_at: string
        }
        Insert: {
          base_fare: number
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          minimum_rating: number
          minimum_vehicle_year: number
          name: string
          per_km_rate: number
          per_minute_rate: number
          platform_commission_rate: number
          requirements?: Json | null
          tier: Database["public"]["Enums"]["service_tier"]
          updated_at?: string
        }
        Update: {
          base_fare?: number
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          minimum_rating?: number
          minimum_vehicle_year?: number
          name?: string
          per_km_rate?: number
          per_minute_rate?: number
          platform_commission_rate?: number
          requirements?: Json | null
          tier?: Database["public"]["Enums"]["service_tier"]
          updated_at?: string
        }
        Relationships: []
      }
      ride_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          notes: string | null
          ride_id: string
          status: Database["public"]["Enums"]["ride_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          ride_id: string
          status: Database["public"]["Enums"]["ride_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          ride_id?: string
          status?: Database["public"]["Enums"]["ride_status"]
        }
        Relationships: [
          {
            foreignKeyName: "ride_status_history_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      riders: {
        Row: {
          average_rating: number | null
          created_at: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          id: string
          preferred_journey_mode:
            | Database["public"]["Enums"]["journey_mode"]
            | null
          total_rides: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          average_rating?: number | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          preferred_journey_mode?:
            | Database["public"]["Enums"]["journey_mode"]
            | null
          total_rides?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          average_rating?: number | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          preferred_journey_mode?:
            | Database["public"]["Enums"]["journey_mode"]
            | null
          total_rides?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rides: {
        Row: {
          accepted_at: string | null
          actual_distance_km: number | null
          actual_duration_minutes: number | null
          base_fare: number
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          completed_at: string | null
          created_at: string
          distance_fare: number | null
          driver_arrived_at: string | null
          driver_id: string | null
          dropoff_address: string
          dropoff_latitude: number
          dropoff_location: unknown
          dropoff_longitude: number
          emergency_contact_notified: boolean | null
          estimated_distance_km: number | null
          estimated_duration_minutes: number | null
          id: string
          journey_mode: Database["public"]["Enums"]["journey_mode"]
          net_driver_payout: number | null
          pickup_address: string
          pickup_latitude: number
          pickup_location: unknown
          pickup_longitude: number
          platform_commission: number | null
          requested_at: string
          ride_number: string
          rider_id: string
          service_tier: Database["public"]["Enums"]["service_tier"]
          settlement_fee: number | null
          special_instructions: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["ride_status"]
          subtotal: number
          surge_multiplier: number | null
          time_fare: number | null
          tip: number | null
          total: number
          trip_share_token: string | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          actual_distance_km?: number | null
          actual_duration_minutes?: number | null
          base_fare: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          created_at?: string
          distance_fare?: number | null
          driver_arrived_at?: string | null
          driver_id?: string | null
          dropoff_address: string
          dropoff_latitude: number
          dropoff_location?: unknown
          dropoff_longitude: number
          emergency_contact_notified?: boolean | null
          estimated_distance_km?: number | null
          estimated_duration_minutes?: number | null
          id?: string
          journey_mode?: Database["public"]["Enums"]["journey_mode"]
          net_driver_payout?: number | null
          pickup_address: string
          pickup_latitude: number
          pickup_location?: unknown
          pickup_longitude: number
          platform_commission?: number | null
          requested_at?: string
          ride_number: string
          rider_id: string
          service_tier?: Database["public"]["Enums"]["service_tier"]
          settlement_fee?: number | null
          special_instructions?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["ride_status"]
          subtotal: number
          surge_multiplier?: number | null
          time_fare?: number | null
          tip?: number | null
          total: number
          trip_share_token?: string | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          actual_distance_km?: number | null
          actual_duration_minutes?: number | null
          base_fare?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          created_at?: string
          distance_fare?: number | null
          driver_arrived_at?: string | null
          driver_id?: string | null
          dropoff_address?: string
          dropoff_latitude?: number
          dropoff_location?: unknown
          dropoff_longitude?: number
          emergency_contact_notified?: boolean | null
          estimated_distance_km?: number | null
          estimated_duration_minutes?: number | null
          id?: string
          journey_mode?: Database["public"]["Enums"]["journey_mode"]
          net_driver_payout?: number | null
          pickup_address?: string
          pickup_latitude?: number
          pickup_location?: unknown
          pickup_longitude?: number
          platform_commission?: number | null
          requested_at?: string
          ride_number?: string
          rider_id?: string
          service_tier?: Database["public"]["Enums"]["service_tier"]
          settlement_fee?: number | null
          special_instructions?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["ride_status"]
          subtotal?: number
          surge_multiplier?: number | null
          time_fare?: number | null
          tip?: number | null
          total?: number
          trip_share_token?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rides_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      room_types: {
        Row: {
          amenities: string[] | null
          base_price: number
          beds_description: string | null
          created_at: string | null
          description: string | null
          hotel_id: string
          id: string
          images: string[] | null
          is_active: boolean | null
          max_guests: number | null
          name: string
          room_size_sqm: number | null
          total_rooms: number | null
          updated_at: string | null
          weekend_price: number | null
        }
        Insert: {
          amenities?: string[] | null
          base_price: number
          beds_description?: string | null
          created_at?: string | null
          description?: string | null
          hotel_id: string
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          max_guests?: number | null
          name: string
          room_size_sqm?: number | null
          total_rooms?: number | null
          updated_at?: string | null
          weekend_price?: number | null
        }
        Update: {
          amenities?: string[] | null
          base_price?: number
          beds_description?: string | null
          created_at?: string | null
          description?: string | null
          hotel_id?: string
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          max_guests?: number | null
          name?: string
          room_size_sqm?: number | null
          total_rooms?: number | null
          updated_at?: string | null
          weekend_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "room_types_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_payment_methods: {
        Row: {
          card_type: string
          cardholder_name: string
          created_at: string | null
          expiry_month: number
          expiry_year: number
          id: string
          is_default: boolean | null
          last_four: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          card_type: string
          cardholder_name: string
          created_at?: string | null
          expiry_month: number
          expiry_year: number
          id?: string
          is_default?: boolean | null
          last_four: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          card_type?: string
          cardholder_name?: string
          created_at?: string | null
          expiry_month?: number
          expiry_year?: number
          id?: string
          is_default?: boolean | null
          last_four?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      shop_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      system_health: {
        Row: {
          auth_healthy: boolean | null
          database_healthy: boolean | null
          error_message: string | null
          id: string
          response_time_ms: number | null
          status: string
          storage_healthy: boolean | null
          timestamp: string | null
        }
        Insert: {
          auth_healthy?: boolean | null
          database_healthy?: boolean | null
          error_message?: string | null
          id?: string
          response_time_ms?: number | null
          status: string
          storage_healthy?: boolean | null
          timestamp?: string | null
        }
        Update: {
          auth_healthy?: boolean | null
          database_healthy?: boolean | null
          error_message?: string | null
          id?: string
          response_time_ms?: number | null
          status?: string
          storage_healthy?: boolean | null
          timestamp?: string | null
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          action: string
          component: string | null
          created_at: string
          error_message: string | null
          id: string
          log_level: Database["public"]["Enums"]["log_level"]
          log_type: Database["public"]["Enums"]["log_type"]
          metadata: Json | null
          page_url: string
          referrer: string | null
          session_id: string
          success: boolean
          target: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          component?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          log_level?: Database["public"]["Enums"]["log_level"]
          log_type: Database["public"]["Enums"]["log_type"]
          metadata?: Json | null
          page_url: string
          referrer?: string | null
          session_id: string
          success?: boolean
          target?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          component?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          log_level?: Database["public"]["Enums"]["log_level"]
          log_type?: Database["public"]["Enums"]["log_type"]
          metadata?: Json | null
          page_url?: string
          referrer?: string | null
          session_id?: string
          success?: boolean
          target?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      two_factor_auth: {
        Row: {
          backup_codes: string[] | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          secret: string | null
          updated_at: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          secret?: string | null
          updated_at?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          secret?: string | null
          updated_at?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string
          id: string
          restaurant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          restaurant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          restaurant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interaction_logs: {
        Row: {
          created_at: string
          element_class: string | null
          element_id: string | null
          element_text: string | null
          event_type: Database["public"]["Enums"]["interaction_event_type"]
          id: string
          page_path: string
          session_id: string
          user_id: string | null
          viewport_height: number
          viewport_width: number
          x_coordinate: number | null
          y_coordinate: number | null
        }
        Insert: {
          created_at?: string
          element_class?: string | null
          element_id?: string | null
          element_text?: string | null
          event_type: Database["public"]["Enums"]["interaction_event_type"]
          id?: string
          page_path: string
          session_id: string
          user_id?: string | null
          viewport_height: number
          viewport_width: number
          x_coordinate?: number | null
          y_coordinate?: number | null
        }
        Update: {
          created_at?: string
          element_class?: string | null
          element_id?: string | null
          element_text?: string | null
          event_type?: Database["public"]["Enums"]["interaction_event_type"]
          id?: string
          page_path?: string
          session_id?: string
          user_id?: string | null
          viewport_height?: number
          viewport_width?: number
          x_coordinate?: number | null
          y_coordinate?: number | null
        }
        Relationships: []
      }
      user_loyalty: {
        Row: {
          created_at: string | null
          current_points: number | null
          id: string
          lifetime_orders: number | null
          tier_id: string | null
          total_points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_points?: number | null
          id?: string
          lifetime_orders?: number | null
          tier_id?: string | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_points?: number | null
          id?: string
          lifetime_orders?: number | null
          tier_id?: string | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_loyalty_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "loyalty_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_wallets: {
        Row: {
          balance: number | null
          created_at: string | null
          currency: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      venue_reviews: {
        Row: {
          booking_id: string | null
          created_at: string | null
          experience_id: string | null
          helpful_count: number | null
          id: string
          images: string[] | null
          is_verified: boolean | null
          rating: number
          response_date: string | null
          response_text: string | null
          review_text: string | null
          title: string | null
          updated_at: string | null
          user_id: string
          venue_id: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          experience_id?: string | null
          helpful_count?: number | null
          id?: string
          images?: string[] | null
          is_verified?: boolean | null
          rating: number
          response_date?: string | null
          response_text?: string | null
          review_text?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          venue_id?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          experience_id?: string | null
          helpful_count?: number | null
          id?: string
          images?: string[] | null
          is_verified?: boolean | null
          rating?: number
          response_date?: string | null
          response_text?: string | null
          review_text?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venue_reviews_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_reviews_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          amenities: string[] | null
          city: string
          country: string | null
          created_at: string | null
          description: string | null
          email: string | null
          gallery_images: string[] | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          latitude: number | null
          longitude: number | null
          main_image: string | null
          name: string
          opening_hours: Json | null
          owner_id: string
          phone: string | null
          price_level: string | null
          rating: number | null
          slug: string | null
          state: string | null
          street_address: string
          total_reviews: number | null
          updated_at: string | null
          venue_type: string
          verification_status: string | null
          website: string | null
          zip_code: string | null
        }
        Insert: {
          amenities?: string[] | null
          city: string
          country?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          gallery_images?: string[] | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          latitude?: number | null
          longitude?: number | null
          main_image?: string | null
          name: string
          opening_hours?: Json | null
          owner_id: string
          phone?: string | null
          price_level?: string | null
          rating?: number | null
          slug?: string | null
          state?: string | null
          street_address: string
          total_reviews?: number | null
          updated_at?: string | null
          venue_type?: string
          verification_status?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          amenities?: string[] | null
          city?: string
          country?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          gallery_images?: string[] | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          latitude?: number | null
          longitude?: number | null
          main_image?: string | null
          name?: string
          opening_hours?: Json | null
          owner_id?: string
          phone?: string | null
          price_level?: string | null
          rating?: number | null
          slug?: string | null
          state?: string | null
          street_address?: string
          total_reviews?: number | null
          updated_at?: string | null
          venue_type?: string
          verification_status?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string | null
          description: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
          type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "user_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      check_room_availability: {
        Args: {
          p_check_in: string
          p_check_out: string
          p_num_rooms?: number
          p_room_type_id: string
        }
        Returns: boolean
      }
      cleanup_old_logs: { Args: never; Returns: undefined }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      generate_order_number: { Args: never; Returns: string }
      generate_ride_number: { Args: never; Returns: string }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      gettransactionid: { Args: never; Returns: unknown }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_column: {
        Args: { p_column_name: string; p_row_id: string; p_table_name: string }
        Returns: undefined
      }
      increment_helpful_count: {
        Args: { review_id: string }
        Returns: undefined
      }
      increment_order_count: {
        Args: { p_partner_id: string }
        Returns: undefined
      }
      longtransactionsenabled: { Args: never; Returns: boolean }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      error_severity: "low" | "medium" | "high" | "critical"
      interaction_event_type:
        | "click"
        | "hover"
        | "scroll"
        | "input"
        | "focus"
        | "blur"
      journey_mode:
        | "budget"
        | "night_out"
        | "family"
        | "shopping"
        | "business"
        | "quick"
        | "eco"
        | "accessible"
      log_level: "info" | "warn" | "error" | "debug"
      log_type:
        | "click"
        | "navigation"
        | "api_call"
        | "error"
        | "performance"
        | "form_submit"
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "ready_for_pickup"
        | "picked_up"
        | "delivered"
        | "cancelled"
        | "scheduled"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      ride_status:
        | "requested"
        | "accepted"
        | "driver_arriving"
        | "started"
        | "completed"
        | "cancelled"
      service_tier: "budget" | "enhanced" | "premium" | "luxury"
      user_role:
        | "customer"
        | "restaurant"
        | "delivery_partner"
        | "admin"
        | "superadmin"
        | "shop"
        | "rider"
        | "driver"
      verification_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
      error_severity: ["low", "medium", "high", "critical"],
      interaction_event_type: [
        "click",
        "hover",
        "scroll",
        "input",
        "focus",
        "blur",
      ],
      journey_mode: [
        "budget",
        "night_out",
        "family",
        "shopping",
        "business",
        "quick",
        "eco",
        "accessible",
      ],
      log_level: ["info", "warn", "error", "debug"],
      log_type: [
        "click",
        "navigation",
        "api_call",
        "error",
        "performance",
        "form_submit",
      ],
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "ready_for_pickup",
        "picked_up",
        "delivered",
        "cancelled",
        "scheduled",
      ],
      payment_status: ["pending", "completed", "failed", "refunded"],
      ride_status: [
        "requested",
        "accepted",
        "driver_arriving",
        "started",
        "completed",
        "cancelled",
      ],
      service_tier: ["budget", "enhanced", "premium", "luxury"],
      user_role: [
        "customer",
        "restaurant",
        "delivery_partner",
        "admin",
        "superadmin",
        "shop",
        "rider",
        "driver",
      ],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
