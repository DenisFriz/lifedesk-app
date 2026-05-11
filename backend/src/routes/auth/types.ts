export type RegisterDTO = {
  email: string;
  password: string;
  acceptedTerms: boolean;
};

export type LoginDTO = {
  email: string;
  password: string;
};
