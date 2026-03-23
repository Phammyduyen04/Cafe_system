import { useState, useEffect } from "react";
import HeroSection from "./home/HeroSection";
import ProductsCarousel from "./home/ProductsCarousel";
import CoffeeBeansBanner from "./home/CoffeeBeansBanner";
import TestimonialsSection from "./home/TestimonialsSection";
import NewsletterSection from "./home/NewsletterSection";
import { productService } from "../../services/product.service";
import type { Product, Category } from "../../services/product.service";

export default function HomeContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [prods, cats] = await Promise.all([
          productService.getProducts(),
          productService.getCategories(),
        ]);
        setProducts(prods);
        setCategories(cats);
      } catch {
        // keep empty
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Group products by category
  const productsByCategory: Record<string, Product[]> = {};
  for (const product of products) {
    const catId = product.productCategoryId ?? (typeof product.category === "string" ? product.category : product.category?._id ?? "");
    if (!productsByCategory[catId]) productsByCategory[catId] = [];
    productsByCategory[catId].push(product);
  }

  // Only show 3 categories in this order
  const displayOrder = ["Cà phê", "Trà sữa", "Bánh và ăn nhẹ", "Bánh & ăn nhẹ"];
  const displayCategories = displayOrder
    .map((name) => categories.find((c) => c.name === name))
    .filter((c): c is Category => !!c);

  return (
    <>
      <HeroSection />
      {loading ? (
        <section className="py-16 bg-cafe-bg">
          <div className="flex justify-center">
            <div className="w-8 h-8 border-2 border-cafe-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </section>
      ) : (
        displayCategories.map((cat) => {
          const catProducts = productsByCategory[cat.categoryId] ?? productsByCategory[cat._id] ?? [];
          if (catProducts.length === 0) return null;
          return (
            <ProductsCarousel
              key={cat._id}
              title={cat.name}
              products={catProducts}
              categories={categories}
            />
          );
        })
      )}
      <CoffeeBeansBanner />
      <TestimonialsSection />
      <NewsletterSection />
    </>
  );
}
