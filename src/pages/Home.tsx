import Banner from "../components/Banner";
import CategoryGrid from "../components/Categories";
import ProductView from "../components/products/ProductView";
import TopSale from "../components/products/TopSale";

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

        {/* promotions section */}
        <section >
            <TopSale />
        </section>

        {/* products section */}
        <section >
            <ProductView />
        </section>

        
    </main>
  )
}

export default Home
