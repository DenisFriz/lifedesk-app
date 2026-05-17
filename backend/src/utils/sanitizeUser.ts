export const sanitizeUser = (user: Record<string, any>) => {
  const userObj =
    typeof user.toObject === 'function' ? user.toObject() : { ...user };

  delete userObj.passwordHash;
  delete userObj.plaid_connections;

  return userObj;
};
