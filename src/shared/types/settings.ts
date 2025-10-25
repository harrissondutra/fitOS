export type AvatarSource = 'upload' | 'initials' | 'google' | 'apple' | 'microsoft';

export interface SystemSettings {
  general: {
    companyName: string;
    logo?: string;
    timezone: string;
    language: string;
    currency: string;
  };
  business: {
    defaultMembershipType: string;
    workingHours: { start: string; end: string };
    autoApproveMembers: boolean;
  };
  integrations: {
    googleCalendar: boolean;
    whatsapp: boolean;
    smtp: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
  };
}

export interface SocialAccount {
  provider: 'google' | 'apple' | 'microsoft';
  connected: boolean;
  email?: string;
  photoUrl?: string;
  name?: string;
}

export interface UserProfileSettings {
  personalData: {
    firstName: string;
    lastName: string;
    phone?: string;
    email: string;
  };
  avatar: {
    type: AvatarSource;
    imageUrl?: string; // URL do Cloudinary ou link direto do provedor social
    bgColor?: string; // Para iniciais
  };
  socialAccounts: SocialAccount[]; // Contas sociais conectadas
  theme: {
    mode: 'light' | 'dark';
    customColors: {
      primary: string;
      secondary: string;
      accent: string;
    };
  };
  preferences: {
    language: string;
    timezone: string;
    notifications: boolean;
  };
}
