import { createClient } from "@/lib/supabase/server";
import { Category } from "@/lib/types";
import { CategoryList } from "./category-list";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .neq("type", "fixed_system")
    .order("name") as { data: Category[] | null };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Categorías</h1>
      <CategoryList categories={categories ?? []} />
    </div>
  );
}
