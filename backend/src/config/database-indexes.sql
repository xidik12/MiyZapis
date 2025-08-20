-- Enhanced database indexes for multi-platform BookingBot
-- Run these after applying the schema changes

-- Performance indexes for existing tables
CREATE INDEX IF NOT EXISTS idx_users_platform_activity 
  ON users(user_type, is_active, last_login_at);

CREATE INDEX IF NOT EXISTS idx_bookings_platform_status 
  ON bookings(status, scheduled_at, created_at);

CREATE INDEX IF NOT EXISTS idx_services_search 
  ON services(category_id, is_active, base_price);

CREATE INDEX IF NOT EXISTS idx_specialists_location 
  ON specialists(city, country, is_verified, rating);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_services_fulltext 
  ON services USING gin(to_tsvector('english', name || ' ' || description));

CREATE INDEX IF NOT EXISTS idx_specialists_fulltext 
  ON specialists USING gin(to_tsvector('english', business_name || ' ' || bio));

-- Geospatial indexes for location-based search
CREATE INDEX IF NOT EXISTS idx_specialists_location_geo 
  ON specialists USING gist(point(longitude, latitude));

-- Time-based partitioning for analytics tables
CREATE INDEX IF NOT EXISTS idx_platform_analytics_date_platform 
  ON platform_analytics(date DESC, platform);

CREATE INDEX IF NOT EXISTS idx_api_usage_logs_date_endpoint 
  ON api_usage_logs(created_at DESC, endpoint);

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_bookings_specialist_date_status 
  ON bookings(specialist_id, scheduled_at DESC, status);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
  ON messages(conversation_id, created_at DESC);

-- Partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_users_active_email 
  ON users(email) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_services_active_category 
  ON services(category_id, base_price) WHERE is_active = true;

-- Covering indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bookings_customer_status_cover 
  ON bookings(customer_id, status) 
  INCLUDE (scheduled_at, total_amount, service_id);

-- Indexes for real-time features
CREATE INDEX IF NOT EXISTS idx_websocket_connections_active 
  ON websocket_connections(user_id, is_active, last_ping);

CREATE INDEX IF NOT EXISTS idx_notifications_unread 
  ON notifications(user_id, is_read, created_at DESC) 
  WHERE is_read = false;

-- Rate limiting indexes
CREATE INDEX IF NOT EXISTS idx_rate_limit_key_window 
  ON rate_limit_records(key, type, window_start);

-- Search optimization
CREATE INDEX IF NOT EXISTS idx_search_history_user_date 
  ON search_history(user_id, created_at DESC);

-- Telegram-specific indexes
CREATE INDEX IF NOT EXISTS idx_telegram_sessions_active 
  ON telegram_sessions(telegram_id, is_active, last_activity);

-- File management indexes
CREATE INDEX IF NOT EXISTS idx_files_entity_purpose 
  ON files(entity_type, entity_id, purpose) 
  WHERE deleted_at IS NULL;