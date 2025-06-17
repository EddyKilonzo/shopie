export type Role = 'CUSTOMER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}
