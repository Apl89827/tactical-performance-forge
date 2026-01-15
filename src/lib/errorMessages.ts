/**
 * User-friendly error message utility
 */

interface ErrorDetails {
  title: string;
  message: string;
  action?: string;
}

export const getErrorMessage = (error: unknown): ErrorDetails => {
  // Handle Supabase/PostgreSQL errors
  if (error && typeof error === "object" && "code" in error) {
    const supabaseError = error as { code: string; message: string };

    switch (supabaseError.code) {
      case "PGRST116":
        return {
          title: "Not Found",
          message: "The requested data could not be found.",
          action: "Try refreshing the page or checking your input.",
        };
      case "23505":
        return {
          title: "Already Exists",
          message: "This record already exists in the system.",
          action: "Try using different values.",
        };
      case "23503":
        return {
          title: "Invalid Reference",
          message: "The referenced item doesn't exist.",
          action: "Please check your selection and try again.",
        };
      case "42501":
        return {
          title: "Permission Denied",
          message: "You don't have permission to perform this action.",
          action: "Please contact support if you believe this is an error.",
        };
      case "email_not_confirmed":
        return {
          title: "Email Not Verified",
          message: "Please verify your email address before logging in.",
          action: "Check your inbox for the verification email.",
        };
      case "invalid_credentials":
        return {
          title: "Invalid Credentials",
          message: "The email or password you entered is incorrect.",
          action: "Please check your credentials and try again.",
        };
      case "user_already_exists":
        return {
          title: "Account Exists",
          message: "An account with this email already exists.",
          action: "Try logging in or use a different email.",
        };
      default:
        // Return a generic message for unknown codes
        break;
    }
  }

  // Handle network errors
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return {
      title: "Connection Error",
      message: "Unable to connect to the server.",
      action: "Please check your internet connection and try again.",
    };
  }

  // Handle generic Error objects
  if (error instanceof Error) {
    // Check for specific message patterns
    if (error.message.includes("Invalid login credentials")) {
      return {
        title: "Invalid Credentials",
        message: "The email or password you entered is incorrect.",
        action: "Please check your credentials and try again.",
      };
    }
    if (error.message.includes("Email not confirmed")) {
      return {
        title: "Email Not Verified",
        message: "Please verify your email address before logging in.",
        action: "Check your inbox for the verification email.",
      };
    }
    if (error.message.includes("User already registered")) {
      return {
        title: "Account Exists",
        message: "An account with this email already exists.",
        action: "Try logging in or use a different email.",
      };
    }

    return {
      title: "Error",
      message: error.message,
    };
  }

  // Handle string errors
  if (typeof error === "string") {
    return {
      title: "Error",
      message: error,
    };
  }

  // Default fallback
  return {
    title: "Something went wrong",
    message: "An unexpected error occurred.",
    action: "Please try again or contact support if the issue persists.",
  };
};

export const isNetworkError = (error: unknown): boolean => {
  return (
    error instanceof TypeError && error.message === "Failed to fetch"
  );
};

export const isAuthError = (error: unknown): boolean => {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code: string }).code;
    return [
      "email_not_confirmed",
      "invalid_credentials",
      "user_already_exists",
    ].includes(code);
  }
  return false;
};
