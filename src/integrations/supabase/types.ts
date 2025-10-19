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
          picked_up_at: string | null
          pickup_code: string | null
          pickup_time: string | null
          platform_commission: number
          ready_at: string | null
          restaurant_id: string
          settlement_fee: number
          special_instructions: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax: number
          tip: number | null
          total: number
          updated_at: string
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
          picked_up_at?: string | null
          pickup_code?: string | null
          pickup_time?: string | null
          platform_commission?: number
          ready_at?: string | null
          restaurant_id: string
          settlement_fee?: number
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax?: number
          tip?: number | null
          total: number
          updated_at?: string
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
          picked_up_at?: string | null
          pickup_code?: string | null
          pickup_time?: string | null
          platform_commission?: number
          ready_at?: string | null
          restaurant_id?: string
          settlement_fee?: number
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax?: number
          tip?: number | null
          total?: number
          updated_at?: string
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
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
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
      restaurants: {
        Row: {
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
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
      payment_status: "pending" | "completed" | "failed" | "refunded"
      user_role:
        | "customer"
        | "restaurant"
        | "delivery_partner"
        | "admin"
        | "superadmin"
        | "shop"
        | "rider"
        | "driver"
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
      error_severity: ["low", "medium", "high", "critical"],
      interaction_event_type: [
        "click",
        "hover",
        "scroll",
        "input",
        "focus",
        "blur",
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
      ],
      payment_status: ["pending", "completed", "failed", "refunded"],
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
    },
  },
} as const
