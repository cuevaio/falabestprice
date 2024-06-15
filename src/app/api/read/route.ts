import { type NextRequest } from "next/server";

import { db } from "@/db";
import {
  InsertBrand,
  InsertPrice,
  InsertProduct,
  InsertVariant,
  brands,
  prices,
  products,
  variants,
} from "@/db/schema";
import { eq } from "drizzle-orm";

import { customAlphabet } from "nanoid/non-secure";
const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  12
);

function createBrand(brand: InsertBrand) {
  return db.insert(brands).values(brand).returning();
}

function createProduct(product: InsertProduct) {
  return db.insert(products).values(product).returning();
}

function createVariants(variantz: InsertVariant[]) {
  return db.insert(variants).values(variantz).returning();
}

function createPrices(pricez: InsertPrice[]) {
  return db.insert(prices).values(pricez).returning();
}

export const POST = async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get("productId");

    const res = await fetch(
      `https://www.falabella.com.pe/falabella-pe/product/${productId}`
    );
    const html = await res.text();

    console.log(html);

    let rawJSON = html.split(
      `<script id="__NEXT_DATA__" type="application/json">`
    )[1];
    rawJSON = rawJSON.split(`</script>`)[0];

    const jsonx = JSON.parse(rawJSON);

    const json = jsonx.props.pageProps.productData as {
      id: string;
      brandId: string;
      brandName: string;
      name: string;
      variants: {
        id: string;
        attributes: {
          size: string; 
          colorName: string | null;
          colorCode: string | null;
        };
        medias: { mediaType: string; url: string }[];
        prices: { type: string; price: string[] }[];
        availability: { hasStock: boolean }[];
      }[];
    };

    const brant = {
      id: Number(json.brandId.replace("BR", "")),
      name: json.brandName,
    };

    const produck = {
      id: Number(json.id),
      name: json.name,
      brandId: brant.id,
    };

    const variantz = json.variants.map((variant) => ({
      id: Number(variant.id),
      size: variant.attributes.size,
      productId: produck.id,
      color:
        variant.attributes.colorName && variant.attributes.colorCode
          ? {
              name: variant.attributes.colorName,
              code: variant.attributes.colorCode,
            }
          : null,
      assets: variant.medias.map(
        (asset: { mediaType: string; url: string }) => ({
          type: asset.mediaType,
          url: asset.url,
        })
      ),
      price: Math.min(...variant.prices.map((price) => Number(price.price))),
      hasStock: variant.availability.some((a) => a.hasStock),
    }));

    let [brand] = await db
      .select()
      .from(brands)
      .where(eq(brands.id, brant.id))
      .limit(1);

    if (!brand) {
      await createBrand(brant);

      await createProduct(produck);

      await createVariants(variantz);

      await db
        .insert(prices)
        .values(
          variantz.map((v) => ({
            id: nanoid(12),
            variantId: v.id,
            price: v.price,
            createdAt: new Date(),
            inStock: v.hasStock,
          }))
        )
        .returning();
    } else {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, produck.id))
        .limit(1);

      if (!product) {
        await createProduct(produck);

        await createVariants(variantz);

        await db
          .insert(prices)
          .values(
            variantz.map((v) => ({
              id: nanoid(12),
              variantId: v.id,
              price: v.price,
              createdAt: new Date(),
              inStock: v.hasStock,
            }))
          )
          .returning();
      } else {
        const variantsx = await db
          .select()
          .from(variants)
          .where(eq(variants.productId, produck.id));

        // TODO: Cover edge cases: what happens if new variants of a product are created?

        if (variantsx.length === 0) {
          await createVariants(variantz);

          await db
            .insert(prices)
            .values(
              variantz.map((v) => ({
                id: nanoid(12),
                variantId: v.id,
                price: v.price,
                createdAt: new Date(),
                inStock: v.hasStock,
              }))
            )
            .returning();
        } else {
          await db
            .insert(prices)
            .values(
              variantz.map((v) => ({
                id: nanoid(12),
                variantId: v.id,
                price: v.price,
                createdAt: new Date(),
                inStock: v.hasStock,
              }))
            )
            .returning();
        }
      }
    }

    return new Response(
      JSON.stringify({
        ...produck,
        brand: brant,
        variants: variantz,
      }),
      {
        headers: {
          "content-type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error(error);
    return new Response("Error", { status: 500 });
  }
};
