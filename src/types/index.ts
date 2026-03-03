export interface Session {
  id: string;
  org_id: string;
  name: string;
  date: string;
  location_lat: number;
  location_lng: number;
  radius_meters: number;
  qr_token: string;
  created_at: string;
  organizations?: { name: string };
}

export interface Attendee {
  id: string;
  org_id: string;
  full_name: string;
  identifier: string;
  credential_id: string;
  public_key: string;
  sign_count: number;
  created_at: string;
}

export interface Attendance {
  id: string;
  session_id: string;
  attendee_id: string;
  device_hash: string;
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
