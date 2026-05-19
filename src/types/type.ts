export interface User {
  id: string;
  email: string;
}

export interface JwtPayload {
  id: string;
  email: string;
}

export interface SearchProductsQuery {
  prodName?: string;
  priceStart?: number;
  priceEnd?: number;
  prodDesc?: string;
  page?: number;
  limit?: number;
}

export interface SearchUsersQuery {
  searchName?: string;
  searchEmail?: string;
  page?: number;
  limit?: number;
}