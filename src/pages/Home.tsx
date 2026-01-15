import Banner from "../components/Banner";
import CategoryGrid from "../components/Categories";
import ProductView from "../components/products/ProductView";
import PromotionsComponent from "../components/products/PromotionProducts";

const Home = () => {
  return (
    <main>
      {/* banner section */}
        <section>
            <Banner />
        </section>

        {/* categories section */}
        <section>
            <CategoryGrid />
        </section>

        {/* products section */}
        <section >
            <ProductView />
        </section>

        {/* promotions section */}
        <section >
            <PromotionsComponent />
        </section>
    </main>
  )
}

export default Home
