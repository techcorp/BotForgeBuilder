export const ValidationRules = {
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : "Invalid email format";
  },
  password: (value) => {
    if (value.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(value)) return "Password must contain uppercase letter";
    if (!/[0-9]/.test(value)) return "Password must contain number";
    return null;
  },
  botName: (value) => {
    if (!value || value.trim().length === 0) return "Bot name is required";
    if (value.length > 100) return "Bot name must be less than 100 characters";
    return null;
  },
  businessName: (value) => {
    if (!value || value.trim().length === 0) return "Business name is required";
    if (value.length > 150) return "Business name must be less than 150 characters";
    return null;
  },
  businessDetails: (value) => {
    if (!value || value.trim().length === 0) return "Business details are required";
    if (value.length > 50000) return "Business details must be less than 50,000 characters";
    return null;
  },
  customInstructions: (value) => {
    if (value && value.length > 10000) return "Custom instructions must be less than 10,000 characters";
    return null;
  },
  welcomeMessage: (value) => {
    if (value && value.length > 500) return "Welcome message must be less than 500 characters";
    return null;
  },
  teamName: (value) => {
    if (!value || value.trim().length === 0) return "Team name is required";
    if (value.length > 100) return "Team name must be less than 100 characters";
    return null;
  },
  url: (value) => {
    try {
      new URL(value);
      return null;
    } catch (err) {
      return "Invalid URL format";
    }
  },
};

export function validateBotData(data) {
  const errors = {};

  if ("name" in data) {
    const nameError = ValidationRules.botName(data.name);
    if (nameError) errors.name = nameError;
  }

  if ("businessName" in data) {
    const bnError = ValidationRules.businessName(data.businessName);
    if (bnError) errors.businessName = bnError;
  }

  if ("businessDetails" in data) {
    const bdError = ValidationRules.businessDetails(data.businessDetails);
    if (bdError) errors.businessDetails = bdError;
  }

  if ("customInstructions" in data) {
    const ciError = ValidationRules.customInstructions(data.customInstructions);
    if (ciError) errors.customInstructions = ciError;
  }

  if ("welcomeMessage" in data) {
    const wmError = ValidationRules.welcomeMessage(data.welcomeMessage);
    if (wmError) errors.welcomeMessage = wmError;
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

export function validateUserRegistration(data) {
  const errors = {};

  const emailError = ValidationRules.email(data.email);
  if (emailError) errors.email = emailError;

  const pwError = ValidationRules.password(data.password);
  if (pwError) errors.password = pwError;

  if (!data.firstName || data.firstName.trim().length === 0) {
    errors.firstName = "First name is required";
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

export function validateTeamData(data) {
  const errors = {};

  if ("name" in data) {
    const nameError = ValidationRules.teamName(data.name);
    if (nameError) errors.name = nameError;
  }

  if ("website" in data && data.website) {
    const urlError = ValidationRules.url(data.website);
    if (urlError) errors.website = urlError;
  }

  return Object.keys(errors).length > 0 ? errors : null;
}
