import { db } from "@/db";
import Image from "next/image";

export default async function Home() {
  const products = await db.query.products.findMany({
    with: {
      brand: true,
      variants: {
        with: {
          prices: true,
        },
      },
    },
  });

  return (
    <div className="container">
      <div className="grid grid-cols-4">
        {products.map((product) => (
          <div key={product.id} className="flex flex-col items-center">
            <Image
              src={product.variants[0].assets[0].url}
              alt={product.name}
              width={200}
              height={200}
            />
            <h1>{product.name}</h1>
            <h2>{product.brand?.name}</h2>
            <h3>{product.variants[0].prices[0].price}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}
