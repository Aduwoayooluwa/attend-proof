export interface Session {
  id: string;
  org_id: string;
  name: string;
  date: string;
  location_lat: number;
  location_lng: number;
  radius_meters: number;
  passkey_required: boolean;
  queue_numbers_enabled: boolean;
  qr_token: string;
  strict_mode: boolean;
  created_at: string;
  organizations?: { name: string };
}

export interface Attendee {
  id: string;
  org_id: string;
  full_name: string;
  identifier: string;
  credential_id?: string | null;
  public_key?: string | null;
  sign_count?: number;
  created_at: string;
}

export interface Attendance {
  id: string;
  session_id: string;
  attendee_id: string;
  check_in_number?: number | null;
  device_hash?: string | null;
  location_verified: boolean;
  verified_at: string;
}

export interface AttendanceWithAttendee extends Attendance {
  attendees: Pick<Attendee, 'full_name' | 'identifier'>;
}

export type AttendStep = 'location' | 'biometric' | 'details' | 'success' | 'error';

export interface GeoCoords {
  lat: number;
  lng: number;
}
