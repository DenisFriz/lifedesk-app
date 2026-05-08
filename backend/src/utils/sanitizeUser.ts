export const sanitizeUser = (user: any) => {
  const userObj =
    typeof user.toObject === 'function' ? user.toObject() : { ...user };

  delete userObj.passwordHash;
  delete userObj.plaid_connections;

  return userObj;
};
