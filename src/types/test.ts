
export interface TestMainCategory {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface TestItem {
  id: string;
  main_category_id: string;
  name: string;
  description: string | null;
  price: number;
  created_at: string;
  updated_at: string;
}
