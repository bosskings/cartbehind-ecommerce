import Navbar from "@/components/Navbar";
import MainPage from "@/components/MainPage";

const formatCategoryName = (category) =>
  decodeURIComponent(category)
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export default async function CategoryPage({ params }) {
  const { category } = await params;

  return (
    <>
      <Navbar />
      {/* <MainPage category={formatCategoryName(category)} /> */}
    </>
  );
}
