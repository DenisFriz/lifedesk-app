export const sanitizeUser = (user: Record<string, any>) => {
  const userObj =
    typeof user.toObject === 'function' ? user.toObject() : { ...user };

  delete userObj.passwordHash;
  delete userObj.resetPasswordToken;
  delete userObj.resetPasswordExpires;
  delete userObj.emailVerificationCode;
  delete userObj.emailVerificationExpires;
  delete userObj.plaid_connections;

  return userObj;
};
