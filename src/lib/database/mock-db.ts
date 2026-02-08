// Shared mock database for all API routes
export interface MockUser {
  id: string;
  email: string;
  password: string;
  name: string;
  is_email_verified: boolean;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  reset_token?: string;
  reset_token_expires?: Date;
  last_login?: Date;
}

export interface MockOTP {
  id: string;
  email: string;
  code: string;
  type: number; // OTPType
  expires_at: Date;
  attempts: number;
  is_used: boolean;
  created_at: Date;
}

// Shared mock databases
export const mockUsers: MockUser[] = [];
export const mockOTPs: MockOTP[] = [];

// Helper functions
export const findUserByEmail = (email: string): MockUser | undefined => {
  return mockUsers.find(user => user.email === email);
};

export const findValidOTP = (email: string, code: string, type: number): MockOTP | undefined => {
  return mockOTPs.find(otp =>
    otp.email === email &&
    otp.code === code &&
    otp.type === type &&
    !otp.is_used &&
    new Date() < otp.expires_at
  );
};

export const addUser = (user: MockUser): void => {
  mockUsers.push(user);
};

export const addOTP = (otp: MockOTP): void => {
  mockOTPs.push(otp);
};

export const updateUser = (email: string, updates: Partial<MockUser>): boolean => {
  const userIndex = mockUsers.findIndex(user => user.email === email);
  
  if (userIndex !== -1) {
    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      ...updates,
      updated_at: new Date()
    };
    return true;
  }
  
  return false;
};

export const updateOTP = (email: string, code: string, type: number): boolean => {
  const otpIndex = mockOTPs.findIndex(otp =>
    otp.email === email &&
    otp.code === code &&
    otp.type === type
  );

  if (otpIndex !== -1) {
    mockOTPs[otpIndex].is_used = true;
    mockOTPs[otpIndex].attempts += 1;
    return true;
  }
  
  return false;
};
