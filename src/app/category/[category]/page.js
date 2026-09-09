import CategoryView from "@/components/CategoryView";

const formatCategoryName = (category) =>
  decodeURIComponent(category)
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export default async function CategoryPage({ params }) {
  const { category } = await params;

  return <CategoryView categoryName={formatCategoryName(category)} />;
}
