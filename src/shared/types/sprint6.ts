// ========================================
// SPRINT 6: USER PREFERENCES & PERSONALIZED FEATURES
// ========================================

// User Preferences Types
export interface UserPreferences {
  id: string;
  userId: string;
  tenantId: string;
  
  // Fitness Preferences
  fitnessGoals: string[];
  preferredWorkoutTypes: string[];
  workoutDuration: string;
  intensityLevel: string;
  
  // Schedule Preferences
  preferredWorkoutDays: string[];
  preferredWorkoutTime: string;
  
  // Nutrition Preferences
  dietaryRestrictions: string[];
  nutritionGoals: string[];
  
  // Music Preferences
  preferredMusicGenres: string[];
  spotifyConnected: boolean;
  
  // Notification Preferences
  emailNotifications: boolean;
  pushNotifications: boolean;
  reminderFrequency: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserPreferencesDto {
  fitnessGoals?: string[];
  preferredWorkoutTypes?: string[];
  workoutDuration?: string;
  intensityLevel?: string;
  preferredWorkoutDays?: string[];
  preferredWorkoutTime?: string;
  dietaryRestrictions?: string[];
  nutritionGoals?: string[];
  preferredMusicGenres?: string[];
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  reminderFrequency?: string;
}

export interface UpdateUserPreferencesDto extends Partial<CreateUserPreferencesDto> {}

// Gamification Types
export interface Challenge {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  type: 'fitness' | 'nutrition' | 'wellness' | 'custom';
  category: string;
  startDate: Date;
  endDate: Date;
  requirements: ChallengeRequirements;
  reward: ChallengeReward;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChallengeRequirements {
  workouts?: number;
  calories?: number;
  duration?: number;
  // ... outros requisitos específicos
}

export interface ChallengeReward {
  badge?: string;
  points?: number;
  discount?: number;
  // ... outras recompensas
}

export interface ChallengeParticipant {
  id: string;
  challengeId: string;
  userId: string;
  tenantId: string;
  progress: ChallengeProgress;
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
}

export interface ChallengeProgress {
  current: number;
  target: number;
  lastUpdate: string;
  // ... outros campos de progresso
}

export interface Badge {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  icon: string;
  category: 'achievement' | 'milestone' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  criteria: BadgeCriteria;
  createdAt: Date;
}

export interface BadgeCriteria {
  type: 'workouts_completed' | 'streak_days' | 'weight_loss' | 'muscle_gain' | string;
  value: number;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  tenantId: string;
  earnedAt: Date;
}

export interface CreateChallengeDto {
  name: string;
  description: string;
  type: 'fitness' | 'nutrition' | 'wellness' | 'custom';
  category: string;
  startDate: Date;
  endDate: Date;
  requirements: ChallengeRequirements;
  reward: ChallengeReward;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// Personalized Workouts Types
export interface PersonalizedWorkout {
  id: string;
  name: string;
  description: string;
  exercises: Exercise[];
  estimatedDuration: number;
  difficulty: string;
  matchScore: number; // 0-100 baseado em preferências
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  sets?: number;
  reps?: number;
  duration?: number;
  restDuration?: number;
  equipment?: string[];
  muscleGroups?: string[];
  difficulty: string;
}

export interface WorkoutRecommendation {
  workoutId: string;
  score: number;
  reasons: string[]; // Por que este workout foi recomendado
}

// Online Appointments Types
export interface OnlineAppointment {
  id: string;
  tenantId: string;
  clientId: string;
  professionalId: string;
  professionalType: 'nutritionist' | 'personal_trainer' | 'physiotherapist' | 'psychologist' | 'coach' | 'dietitian' | 'pt' | string;
  appointmentType: 'initial_consultation' | 'followup' | 'assessment' | 'training_session' | 'nutrition_consultation';
  scheduledAt: Date;
  duration: number; // minutos
  platform: 'zoom' | 'meet' | 'teams';
  meetingLink?: string;
  meetingId?: string;
  meetingPassword?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  clientNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOnlineAppointmentDto {
  professionalId: string;
  professionalType: string;
  appointmentType: string;
  scheduledAt: Date;
  duration?: number;
  platform: 'zoom' | 'meet' | 'teams';
  clientNotes?: string;
}

export interface OnlineAppointmentAvailability {
  date: string;
  availableSlots: TimeSlot[];
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

// Spotify/Music Types
export interface SpotifyConnection {
  id: string;
  userId: string;
  tenantId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  spotifyUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPlaylist {
  id: string;
  name: string;
  description: string;
  trackCount: number;
  spotifyUri: string;
  imageUrl?: string;
  owner: string;
  createdAt?: Date;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  duration: number;
  spotifyUri: string;
  previewUrl?: string;
}

export interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

// General Response Types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

