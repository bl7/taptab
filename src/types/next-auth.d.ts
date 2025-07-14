declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      restaurantId: string | null;
    };
  }
  interface User {
    id: string;
    email: string;
    restaurantId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    email: string;
    restaurantId: string | null;
  }
} 