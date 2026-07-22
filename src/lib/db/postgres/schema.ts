/**
 * PostgreSQL schema — Phase 24 production survey platform.
 * Timestamps stored as TIMESTAMPTZ (UTC).
 */

export const POSTGRES_SCHEMA_VERSION = 1;

export const POSTGRES_MIGRATION_001 = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','DISABLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','DISABLED','LOCKED')),
  locale TEXT NOT NULL DEFAULT 'en',
  failed_login_count INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT,
  UNIQUE (tenant_id, email)
);

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  PRIMARY KEY (user_id, role_id, tenant_id)
);

CREATE TABLE IF NOT EXISTS drivers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  user_id TEXT REFERENCES users(id),
  full_name TEXT NOT NULL,
  mobile TEXT,
  license_number TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  imei TEXT NOT NULL,
  plate_number TEXT NOT NULL,
  vehicle_name TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'SURVEY',
  company_name TEXT,
  driver_name TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT,
  UNIQUE (tenant_id, imei)
);

CREATE TABLE IF NOT EXISTS routes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  permit_id TEXT,
  geometry_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS route_segments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  route_id TEXT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  segment_index INTEGER NOT NULL,
  start_coord JSONB NOT NULL,
  end_coord JSONB NOT NULL,
  length_metres DOUBLE PRECISION NOT NULL,
  bearing DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (route_id, segment_index)
);

CREATE TABLE IF NOT EXISTS permits (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  permit_number TEXT NOT NULL,
  project_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT,
  UNIQUE (tenant_id, permit_number)
);

CREATE TABLE IF NOT EXISTS survey_assignments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  vehicle_id TEXT NOT NULL,
  driver_id TEXT,
  route_id TEXT NOT NULL,
  route_name TEXT NOT NULL,
  permit_id TEXT,
  survey_type TEXT NOT NULL,
  priority TEXT NOT NULL,
  planned_start TIMESTAMPTZ,
  planned_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('DRAFT','ASSIGNED','ACTIVE','PAUSED','COMPLETED','CANCELLED')),
  version INTEGER NOT NULL DEFAULT 1,
  created_by TEXT NOT NULL,
  approved_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT,
  geometry_json JSONB NOT NULL,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS survey_sessions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  assignment_id TEXT NOT NULL REFERENCES survey_assignments(id),
  vehicle_id TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  last_decision_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS survey_decisions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  assignment_id TEXT NOT NULL,
  vehicle_id TEXT NOT NULL,
  session_id TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  payload_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS survey_progress (
  assignment_id TEXT PRIMARY KEY REFERENCES survey_assignments(id),
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  vehicle_id TEXT NOT NULL,
  completion_pct DOUBLE PRECISION NOT NULL,
  completed_segment_ids_json JSONB NOT NULL DEFAULT '[]',
  route_state TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS survey_alerts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  assignment_id TEXT NOT NULL,
  vehicle_id TEXT NOT NULL,
  severity TEXT NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL,
  acknowledged_by TEXT,
  acknowledged_at TIMESTAMPTZ,
  payload_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS survey_commands (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  assignment_id TEXT NOT NULL,
  vehicle_id TEXT NOT NULL,
  command_type TEXT NOT NULL,
  message TEXT,
  issued_by TEXT NOT NULL,
  acknowledged_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'SENT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blockage_reports (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  assignment_id TEXT NOT NULL,
  vehicle_id TEXT NOT NULL,
  route_id TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT,
  photo_ids_json JSONB NOT NULL DEFAULT '[]',
  client_operation_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  UNIQUE (tenant_id, client_operation_id)
);

CREATE TABLE IF NOT EXISTS photo_attachments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  assignment_id TEXT NOT NULL,
  vehicle_id TEXT NOT NULL,
  blockage_id TEXT,
  object_key TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  safe_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  checksum TEXT,
  width INTEGER,
  height INTEGER,
  status TEXT NOT NULL DEFAULT 'READY' CHECK (status IN ('PENDING','READY','FAILED','DELETED')),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by TEXT,
  created_by TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  vehicle_id TEXT,
  assignment_id TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  severity TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  payload_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  assignment_id TEXT,
  vehicle_id TEXT,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  event_type TEXT,
  payload_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS offline_sync_operations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  assignment_id TEXT,
  vehicle_id TEXT,
  operation_type TEXT NOT NULL,
  client_revision TEXT,
  payload_json JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PROCESSING','DONE','FAILED')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS application_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  refresh_token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_outbox (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  revision BIGINT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PROCESSING','PUBLISHED','FAILED')),
  attempts INTEGER NOT NULL DEFAULT 0,
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS background_jobs (
  id TEXT PRIMARY KEY,
  job_type TEXT NOT NULL,
  payload_json JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'PENDING',
  attempts INTEGER NOT NULL DEFAULT 0,
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant ON vehicles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_imei ON vehicles(imei);
CREATE INDEX IF NOT EXISTS idx_drivers_tenant ON drivers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_routes_tenant ON routes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_asg_tenant ON survey_assignments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_asg_vehicle ON survey_assignments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_asg_status ON survey_assignments(status);
CREATE INDEX IF NOT EXISTS idx_asg_active ON survey_assignments(tenant_id, status) WHERE status IN ('ASSIGNED','ACTIVE','PAUSED');
CREATE INDEX IF NOT EXISTS idx_sess_tenant ON survey_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sess_assignment ON survey_sessions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_dec_tenant ON survey_decisions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dec_assignment ON survey_decisions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_dec_vehicle ON survey_decisions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_dec_ts ON survey_decisions(timestamp);
CREATE INDEX IF NOT EXISTS idx_alert_tenant ON survey_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_alert_status ON survey_alerts(status);
CREATE INDEX IF NOT EXISTS idx_alert_unack ON survey_alerts(tenant_id, status) WHERE status = 'OPEN';
CREATE INDEX IF NOT EXISTS idx_cmd_tenant ON survey_commands(tenant_id);
CREATE INDEX IF NOT EXISTS idx_blk_tenant ON blockage_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_photo_tenant ON photo_attachments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_photo_assignment ON photo_attachments(assignment_id);
CREATE INDEX IF NOT EXISTS idx_ntf_tenant ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_asg ON audit_events(assignment_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_events(created_at);
CREATE INDEX IF NOT EXISTS idx_offline_pending ON offline_sync_operations(status) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_outbox_pending ON event_outbox(status, available_at) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_jobs_pending ON background_jobs(status, available_at) WHERE status = 'PENDING';
`;

export const ROLE_SEED = [
  { id: "role-super-admin", code: "SUPER_ADMIN", name: "Super Admin" },
  { id: "role-tenant-admin", code: "TENANT_ADMIN", name: "Tenant Admin" },
  { id: "role-supervisor", code: "SUPERVISOR", name: "Supervisor" },
  { id: "role-driver", code: "DRIVER", name: "Driver" },
  { id: "role-viewer", code: "VIEWER", name: "Viewer" },
] as const;
