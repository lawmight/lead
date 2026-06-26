/**
 * Shared types for the LinkedIn MCP — profiles, leads, connection responses,
 * messages. Trimmed-down version of what the upstream Voyager client exposes.
 */

export interface Lead {
  id?: string;
  linkedinUrl: string;
  linkedinId?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  headline?: string;
  location?: string;
  profilePictureUrl?: string;
  company?: string;
  title?: string;
  email?: string;
  phone?: string;
  enrichedAt?: Date;
  enrichmentData?: EnrichmentData;
}

export interface EnrichmentData {
  summary?: string;
  followerCount?: number;
  connectionsCount?: number;
  isPremium?: boolean;
  isOpenToWork?: boolean;
  isHiring?: boolean;
  canSendInmail?: boolean;
  networkDistance?: string;
  workExperience?: WorkExperience[];
  education?: Education[];
  skills?: Skill[];
  emails?: string[];
  phones?: string[];
}

export interface WorkExperience {
  position: string;
  company: string;
  companyId?: string;
  location?: string;
  description?: string;
  current: boolean;
  start?: string;
  end?: string;
}

export interface Education {
  degree?: string;
  school: string;
  fieldOfStudy?: string;
  start?: string;
  end?: string;
}

export interface Skill {
  name: string;
  endorsementCount?: number;
}

export interface VoyagerProfile {
  provider: "LINKEDIN";
  id: string;
  provider_id: string;
  public_identifier: string;
  first_name: string;
  last_name: string;
  headline: string;
  summary: string;
  contact_info: { emails: string[]; phones: string[]; addresses: string[] };
  location: string;
  profile_picture_url: string;
  can_send_inmail: boolean;
  is_premium: boolean;
  is_hiring: boolean;
  is_open_to_work: boolean;
  work_experience: Array<{
    position: string;
    company_id: string;
    company: string;
    location: string;
    description: string;
    current: boolean;
    start: string;
    end: string;
  }>;
  education: Array<{
    degree: string;
    school: string;
    field_of_study: string;
    start: string;
    end: string;
  }>;
  skills: Array<{ name: string; endorsement_count: number }>;
  follower_count: number;
  connections_count: number;
  network_distance: string;
}

export interface InvitationResponse {
  object: "UserInvitationSent";
  invitation_id: string;
}

export interface ChatResponse {
  object: string;
  chat_id: string;
}

export interface MessageResponse {
  object: string;
  message_id: string;
}
